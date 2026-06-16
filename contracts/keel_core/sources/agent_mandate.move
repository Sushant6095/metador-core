// Mandate — an agent wallet whose limits are enforced by Sui, not by trust.
//
// The four rubric must-haves are four aborts in one function:
//   1. real DeepBook order      -> pool::place_limit_order (cross-package, atomic)
//   2. budget ceiling           -> EBudgetExceeded
//   3. on-chain activity log    -> OrderExecuted event
//   4. owner revocation         -> ERevoked
//
// Security model (the red-team beat):
//   The agent keypair holds NOTHING. Funds live in a DeepBook BalanceManager
//   owned by the human. The TradeCap (trade-only capability) is locked inside
//   this shared AgentMandate object. Even with the agent's private key fully
//   compromised, an attacker can only call execute_order() — which the chain
//   bounds by budget / pool / expiry / revocation. Withdrawal paths in
//   deepbook::balance_manager validate the OWNER address; a TradeCap
//   physically cannot withdraw (verified against deepbookv3 source).
module agent_mandate::agent_mandate;

use deepbook::balance_manager::{BalanceManager, TradeCap};
use deepbook::pool::Pool;
use sui::clock::Clock;
use sui::event;

// === Errors ===
const ENotAgent: u64 = 1;
const ERevoked: u64 = 2;
const EExpired: u64 = 3;
const EWrongPool: u64 = 4;
const EWrongBalanceManager: u64 = 5;
const EBudgetExceeded: u64 = 6;
const ENotOwner: u64 = 7;
const ENotRevoked: u64 = 8;

// === Constants ===
// DeepBook fixed-point scaling: quote_owed = quantity * price / FLOAT_SCALING
// (same math deepbook::order_info uses to compute owed quote for bids).
const FLOAT_SCALING: u128 = 1_000_000_000;
// Order types (mirror deepbook::constants; defined locally so we never depend
// on visibility of their getters).
const NO_RESTRICTION: u8 = 0;
const SELF_MATCHING_ALLOWED: u8 = 0;

// === Objects ===
/// Shared object. The owner's standing instruction to an agent:
/// "trade THIS pool, with THIS money, until THIS time — and I can kill it."
public struct AgentMandate has key {
    id: UID,
    /// Human principal. Only address that can revoke / reclaim.
    owner: address,
    /// Agent keypair address. Only address that can execute orders.
    agent: address,
    /// Trade-only capability, locked inside the mandate. Never touches
    /// the agent's wallet, so it can never be exfiltrated.
    trade_cap: TradeCap,
    /// BalanceManager this mandate is bound to.
    balance_manager_id: ID,
    /// The ONE pool the agent may trade (scope).
    allowed_pool: ID,
    /// Budget ceiling in quote units (e.g. USDC, 6 decimals).
    budget_quote: u64,
    /// Quote committed so far (debited at order placement, conservatively).
    spent_quote: u64,
    /// Mandate expiry, ms since epoch. Orders also inherit this expiry.
    expiry_ms: u64,
    /// Kill switch.
    revoked: bool,
}

// === Events (the on-chain activity log) ===
public struct MandateCreated has copy, drop {
    mandate_id: ID,
    owner: address,
    agent: address,
    balance_manager_id: ID,
    allowed_pool: ID,
    budget_quote: u64,
    expiry_ms: u64,
}

public struct OrderExecuted has copy, drop {
    mandate_id: ID,
    order_id: u128,
    client_order_id: u64,
    price: u64,
    quantity: u64,
    quote_committed: u64,
    spent_after: u64,
    budget_quote: u64,
    status: u8,
}

public struct MandateRevoked has copy, drop {
    mandate_id: ID,
    spent_quote: u64,
}

// === Owner API ===
/// Create and share a mandate. Mint the TradeCap and call this in one PTB:
///   bm::mint_trade_cap(&mut bm) -> cap; create_mandate(cap, ...)
public fun create_mandate(
    trade_cap: TradeCap,
    balance_manager: &BalanceManager,
    agent: address,
    allowed_pool: ID,
    budget_quote: u64,
    expiry_ms: u64,
    ctx: &mut TxContext,
) {
    let mandate = AgentMandate {
        id: object::new(ctx),
        owner: ctx.sender(),
        agent,
        trade_cap,
        balance_manager_id: object::id(balance_manager),
        allowed_pool,
        budget_quote,
        spent_quote: 0,
        expiry_ms,
        revoked: false,
    };
    event::emit(MandateCreated {
        mandate_id: object::id(&mandate),
        owner: mandate.owner,
        agent,
        balance_manager_id: mandate.balance_manager_id,
        allowed_pool,
        budget_quote,
        expiry_ms,
    });
    transfer::share_object(mandate);
}

/// Kill switch. Owner-only. Next agent call aborts with ERevoked.
public fun revoke(mandate: &mut AgentMandate, ctx: &TxContext) {
    assert!(ctx.sender() == mandate.owner, ENotOwner);
    mandate.revoked = true;
    event::emit(MandateRevoked {
        mandate_id: object::id(mandate),
        spent_quote: mandate.spent_quote,
    });
}

/// After revocation, owner reclaims the TradeCap (full lifecycle closure).
public fun reclaim_trade_cap(mandate: AgentMandate, ctx: &TxContext): TradeCap {
    assert!(ctx.sender() == mandate.owner, ENotOwner);
    assert!(mandate.revoked, ENotRevoked);
    let AgentMandate { id, trade_cap, .. } = mandate;
    id.delete();
    trade_cap
}

// === Agent API ===
/// The whole project is this function. Places a REAL DeepBook limit bid,
/// but only after the chain checks every line of the mandate. Any violation
/// aborts the entire transaction — order included — atomically.
///
/// MVP is bid-only (DCA buy agent): budget semantics stay crisp because every
/// order commits `quantity * price / 1e9` of the quote coin. Sell-side needs a
/// base-denominated budget — roadmap, not code.
public fun execute_order<BaseAsset, QuoteAsset>(
    mandate: &mut AgentMandate,
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    client_order_id: u64,
    price: u64,
    quantity: u64,
    pay_with_deep: bool,
    clock: &Clock,
    ctx: &TxContext,
) {
    // --- The four walls (+ two identity checks), then debit ---
    let quote_committed = assert_and_debit(
        mandate,
        object::id(pool),
        object::id(balance_manager),
        price,
        quantity,
        clock.timestamp_ms(),
        ctx.sender(),
    );

    // --- The cross-package calls the Day-1 spike exists to prove ---
    // 1. TradeCap (locked in this object) -> TradeProof. `public` in deepbook.
    let proof = balance_manager.generate_proof_as_trader(
        &mandate.trade_cap,
        ctx,
    );
    // 2. Real order on the real book. `public` in deepbook. Returns OrderInfo
    //    (copy+drop), so we read what we need and let it drop.
    let order_info = pool.place_limit_order(
        balance_manager,
        &proof,
        client_order_id,
        NO_RESTRICTION,
        SELF_MATCHING_ALLOWED,
        price,
        quantity,
        true, // is_bid — MVP buys only
        pay_with_deep,
        mandate.expiry_ms, // orders cannot outlive the mandate
        clock,
        ctx,
    );

    // 3. Activity log.
    event::emit(OrderExecuted {
        mandate_id: object::id(mandate),
        order_id: order_info.order_id(),
        client_order_id,
        price,
        quantity,
        quote_committed,
        spent_after: mandate.spent_quote,
        budget_quote: mandate.budget_quote,
        status: order_info.status(),
    });
}

// === Internal ===
/// All enforcement in one place, separated from the DeepBook call so unit
/// tests can prove every abort path without spinning up a Pool.
/// Returns the quote amount debited.
fun assert_and_debit(
    mandate: &mut AgentMandate,
    pool_id: ID,
    balance_manager_id: ID,
    price: u64,
    quantity: u64,
    now_ms: u64,
    sender: address,
): u64 {
    assert!(sender == mandate.agent, ENotAgent);
    assert!(!mandate.revoked, ERevoked);
    assert!(now_ms < mandate.expiry_ms, EExpired);
    assert!(pool_id == mandate.allowed_pool, EWrongPool);
    assert!(balance_manager_id == mandate.balance_manager_id, EWrongBalanceManager);

    // Conservative budget accounting: debit full quote notional at placement
    // (deepbook's own owed-quote math for bids). Resting orders count against
    // the budget the moment they're committed, not when they fill.
    let quote_committed =
        (((quantity as u128) * (price as u128)) / FLOAT_SCALING) as u64;
    // Cast to u128 before addition to prevent generic arithmetic overflow abort
    // when spent_quote is near u64::MAX. Result fits in u64 because budget_quote
    // is u64-bounded. Internal expression only — no signature or behavior change.
    assert!(
        (mandate.spent_quote as u128) + (quote_committed as u128) <= (mandate.budget_quote as u128),
        EBudgetExceeded,
    );
    mandate.spent_quote = mandate.spent_quote + quote_committed;

    quote_committed
}

// === Test hooks ===
#[test_only]
public fun new_for_testing(
    trade_cap: TradeCap,
    balance_manager_id: ID,
    owner: address,
    agent: address,
    allowed_pool: ID,
    budget_quote: u64,
    expiry_ms: u64,
    ctx: &mut TxContext,
): AgentMandate {
    AgentMandate {
        id: object::new(ctx),
        owner,
        agent,
        trade_cap,
        balance_manager_id,
        allowed_pool,
        budget_quote,
        spent_quote: 0,
        expiry_ms,
        revoked: false,
    }
}

#[test_only]
public fun assert_and_debit_for_testing(
    mandate: &mut AgentMandate,
    pool_id: ID,
    balance_manager_id: ID,
    price: u64,
    quantity: u64,
    now_ms: u64,
    sender: address,
): u64 {
    assert_and_debit(
        mandate, pool_id, balance_manager_id, price, quantity, now_ms, sender,
    )
}

#[test_only]
public fun destroy_for_testing(mandate: AgentMandate): TradeCap {
    let AgentMandate { id, trade_cap, .. } = mandate;
    id.delete();
    trade_cap
}

// === Views (dashboard) ===
public fun budget_quote(m: &AgentMandate): u64 { m.budget_quote }

public fun spent_quote(m: &AgentMandate): u64 { m.spent_quote }

public fun is_revoked(m: &AgentMandate): bool { m.revoked }

public fun expiry_ms(m: &AgentMandate): u64 { m.expiry_ms }

public fun agent(m: &AgentMandate): address { m.agent }

public fun owner(m: &AgentMandate): address { m.owner }
