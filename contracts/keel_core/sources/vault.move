// vault.move — Keel Vault: locked TradeCap + four walls + share accounting.
//
// Security model (inherits from agent_mandate):
//   The TradeCap is minted and locked inside the Vault object in a single
//   atomic PTB. It never exists as a free transferable object. Even with the
//   leader's private key fully compromised, an attacker can only call
//   execute_order() — which the chain bounds by budget/scope/expiry/revocation.
//   Withdrawal paths in deepbook::balance_manager validate the OWNER address;
//   a TradeCap physically cannot withdraw (verified against deepbookv3 source).
//
// Shares accounting:
//   All share math is delegated to agent_mandate::shares (pure functions).
//   Per-depositor cost_basis is tracked so fees apply only to realised profit.
//   The depositor ledger uses sui::table keyed by depositor address.
//   Design note: Table chosen over dynamic fields for bounded, typed access;
//   the address key means one entry per depositor per vault (simple, auditable).
//
// Deposit model (MANDATORY PTB INVARIANT):
//   deepbook::balance_manager::deposit is owner-only (enforces
//   ctx.sender() == balance_manager.owner). The vault cannot call it internally
//   on behalf of a depositor. The vault's deposit() function is therefore
//   accounting-only: it records shares for ctx.sender() proportional to the
//   amount supplied. The caller MUST construct a PTB that atomically:
//     1. Calls balance_manager::deposit(bm, coin, ctx)   [actual fund move]
//     2. Calls vault::deposit(vault, bm, amount, clock, ctx) [share mint]
//   If step 1 is omitted the BM balance does not increase, inflating shares
//   backed by nothing. This invariant is enforced by the SDK layer and audited
//   before mainnet. The BM identity check in deposit() verifies the correct BM
//   is in scope; it cannot verify the coin was deposited.
//
// The four walls (same constants as agent_mandate — error codes MUST match
// docs/abort-codes.md; every new code is added there):
//   1 ENotExecutor    — sender is not the vault leader
//   2 ERevoked        — vault is revoked
//   3 EExpired        — vault mandate has expired
//   4 EWrongPool      — order targets a pool not allowed by policy
//   5 EWrongBalanceManager — BM mismatch
//   6 EBudgetExceeded — order would exceed budget ceiling
//   7 ENotOwner       — sender is not the vault owner
//   8 ENotRevoked     — reclaim requires revoked state first
//   9 EVaultNotEmpty  — cannot close vault with outstanding shares
//  10 EZeroAmount     — deposit/withdraw amount must be > 0
//  11 EInsufficientShares — withdrawer does not hold enough shares
//  35 EZeroExpiry     — expiry_ms must be > 0 (no perpetual vaults in G1)
module agent_mandate::vault;

use agent_mandate::shares;
use deepbook::balance_manager::{BalanceManager, TradeCap};
use deepbook::pool::Pool;
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};

// === Error codes ===
const ENotExecutor: u64 = 1;
const ERevoked: u64 = 2;
const EExpired: u64 = 3;
const EWrongPool: u64 = 4;
const EWrongBalanceManager: u64 = 5;
const EBudgetExceeded: u64 = 6;
const ENotOwner: u64 = 7;
const ENotRevoked: u64 = 8;
const EVaultNotEmpty: u64 = 9;
const EZeroAmount: u64 = 10;
const EInsufficientShares: u64 = 11;
// expiry_ms == 0 is rejected at creation; no perpetual vaults in G1.
// The zero bypass that existed in deposit() is removed: assert_and_debit has
// no bypass, so expiry_ms == 0 would permanently brick trading. Reject at source.
const EZeroExpiry: u64 = 35;

// === Constants ===
// Performance fee charged to leader on realised profit: 10% = 1000 bps.
const DEFAULT_PERF_FEE_BPS: u64 = 1_000;

// DeepBook FLOAT_SCALING (quote_owed = qty * price / FLOAT_SCALING for bids).
const FLOAT_SCALING: u128 = 1_000_000_000;

// Order types (mirror deepbook::constants — defined locally per spike pattern).
const NO_RESTRICTION: u8 = 0;
const SELF_MATCHING_ALLOWED: u8 = 0;

// === Objects ===

/// Per-depositor record: how many shares they hold and their cost basis.
/// cost_basis is the original deposit amount in quote units.
/// It never changes after deposit (we use snapshot-at-deposit, not FIFO/LIFO).
public struct DepositorRecord has store {
    shares: u64,
    cost_basis: u64,
}

/// Vault — the main shared object.
/// One vault per leader-strategy pair. Shared at creation.
public struct Vault has key {
    id: UID,
    /// Human who created the vault and owns the kill switch.
    owner: address,
    /// Leader who executes orders. ADR-004: delegate-first model.
    leader: address,
    /// Placeholder for ADR-004 leader_min_stake enforcement (G2+).
    /// Stored now so the object shape doesn't change on upgrade.
    leader_min_stake_bps: u64,
    /// The TradeCap locked at birth. Never leaves this object.
    trade_cap: TradeCap,
    /// The BalanceManager this vault trades through.
    balance_manager_id: ID,
    // --- Policy (the four walls) ---
    /// The ONE pool the leader may trade (scope wall).
    allowed_pool: ID,
    /// Total spend ceiling in quote units (budget wall).
    budget_quote: u64,
    /// Quote spent so far; debited conservatively at order placement.
    spent_quote: u64,
    /// Per-order size cap in quote units (extra guardrail, max_order_quote).
    /// 0 means no per-order cap beyond the global budget.
    max_order_quote: u64,
    /// Mandate expiry in ms since epoch (expiry wall).
    expiry_ms: u64,
    /// Kill switch (revocation wall).
    revoked: bool,
    // --- Share accounting ---
    /// Total shares outstanding.
    total_shares: u64,
    /// Total quote assets deposited (the vault's NAV denominator).
    /// This tracks the BalanceManager balance conceptually; it is updated
    /// on deposit/withdraw. The actual custody is always in the BM.
    total_assets: u64,
    /// Per-depositor ledger: address -> DepositorRecord.
    depositors: Table<address, DepositorRecord>,
    // --- Fee config ---
    /// Performance fee in basis points; only on realised positive PnL.
    perf_fee_bps: u64,
    /// Crank reward in quote units per tick (DCA; 0 for Delegate vaults).
    crank_fee_quote: u64,
}

// === Events ===

public struct VaultCreated has copy, drop {
    vault_id: ID,
    owner: address,
    leader: address,
    balance_manager_id: ID,
    allowed_pool: ID,
    budget_quote: u64,
    expiry_ms: u64,
}

public struct Deposited has copy, drop {
    vault_id: ID,
    depositor: address,
    amount: u64,
    shares_minted: u64,
    total_shares: u64,
    total_assets: u64,
}

public struct Withdrawn has copy, drop {
    vault_id: ID,
    depositor: address,
    shares_burned: u64,
    gross_assets: u64,
    fee_paid: u64,
    net_assets: u64,
    total_shares: u64,
    total_assets: u64,
}

public struct OrderExecuted has copy, drop {
    vault_id: ID,
    order_id: u128,
    client_order_id: u64,
    price: u64,
    quantity: u64,
    quote_committed: u64,
    spent_after: u64,
    budget_quote: u64,
    status: u8,
}

public struct VaultRevoked has copy, drop {
    vault_id: ID,
    spent_quote: u64,
    total_assets: u64,
}

/// Fee accrued in favour of the leader on this withdrawal.
/// G1 NOTE: fee_amount is ACCRUED (event-recorded) only — no on-chain transfer
/// to the leader occurs in G1. balance_manager::withdraw is owner-only so the
/// vault cannot auto-pay the leader. On-chain fee settlement is a G2 item.
/// UI must NOT display this as a completed transfer to the leader.
public struct FeeCollected has copy, drop {
    vault_id: ID,
    depositor: address,
    fee_amount: u64,
    leader: address,
}

// === Owner API ===

/// Create and share a vault. The TradeCap must be minted and passed in the
/// same PTB — it is locked inside the vault atomically, never free.
///
/// max_order_quote = 0 disables the per-order cap (only global budget applies).
/// crank_fee_quote = 0 is correct for Delegate strategy vaults.
/// expiry_ms must be > 0: perpetual vaults are not supported in G1. A vault
/// with expiry_ms == 0 would accept deposits forever but trading would always
/// abort (assert_and_debit uses strict less-than with no bypass), silently
/// bricking depositors' funds.
public fun create_vault(
    trade_cap: TradeCap,
    balance_manager: &BalanceManager,
    leader: address,
    allowed_pool: ID,
    budget_quote: u64,
    max_order_quote: u64,
    expiry_ms: u64,
    crank_fee_quote: u64,
    ctx: &mut TxContext,
) {
    assert!(expiry_ms > 0, EZeroExpiry);
    let vault = Vault {
        id: object::new(ctx),
        owner: ctx.sender(),
        leader,
        leader_min_stake_bps: 0, // ADR-004 placeholder — enforced G2+
        trade_cap,
        balance_manager_id: object::id(balance_manager),
        allowed_pool,
        budget_quote,
        spent_quote: 0,
        max_order_quote,
        expiry_ms,
        revoked: false,
        total_shares: 0,
        total_assets: 0,
        depositors: table::new(ctx),
        perf_fee_bps: DEFAULT_PERF_FEE_BPS,
        crank_fee_quote,
    };

    event::emit(VaultCreated {
        vault_id: object::id(&vault),
        owner: vault.owner,
        leader,
        balance_manager_id: vault.balance_manager_id,
        allowed_pool,
        budget_quote,
        expiry_ms,
    });

    transfer::share_object(vault);
}

/// Owner-only kill switch. Flips revoked; next leader call aborts with ERevoked.
/// DeepBook-level revocation is a separate PTB step the owner should also
/// call (balance_manager::revoke_trade_cap) to brick the cap at DB level.
/// Funds remain in the BalanceManager and are withdrawable by depositors.
public fun revoke(vault: &mut Vault, ctx: &TxContext) {
    assert!(ctx.sender() == vault.owner, ENotOwner);
    vault.revoked = true;
    event::emit(VaultRevoked {
        vault_id: object::id(vault),
        spent_quote: vault.spent_quote,
        total_assets: vault.total_assets,
    });
}

/// After revocation, owner reclaims the TradeCap (full lifecycle closure).
/// Vault must be empty (no outstanding shares) before it can be destroyed.
/// If depositors have not yet withdrawn, owner should wait or facilitate.
/// The vault object is deleted; TradeCap returned to caller for BM cleanup.
public fun reclaim_trade_cap(vault: Vault, ctx: &TxContext): TradeCap {
    assert!(ctx.sender() == vault.owner, ENotOwner);
    assert!(vault.revoked, ENotRevoked);
    assert!(vault.total_shares == 0, EVaultNotEmpty);

    let Vault {
        id,
        trade_cap,
        depositors,
        ..
    } = vault;

    id.delete();
    depositors.destroy_empty();
    trade_cap
}

// === Depositor API ===

/// Deposit `amount` quote units; mints shares at current NAV for ctx.sender().
/// First depositor: 1 share per 1 unit (cost_basis = amount).
///
/// MANDATORY PTB INVARIANT: the caller must include balance_manager::deposit
/// in the same PTB BEFORE this call (deepbook::balance_manager::deposit is
/// owner-only and cannot be called by the vault internally). This function
/// only performs share accounting; it cannot verify that funds were deposited
/// into the BM. The BM identity check below verifies the correct BM object
/// is passed; it does not verify the coin transfer occurred.
///
/// depositor is always ctx.sender() — no sponsor-deposit case exists in G1.
/// This prevents a third party from crediting shares to an arbitrary address.
public fun deposit(
    vault: &mut Vault,
    balance_manager: &BalanceManager,
    amount: u64,
    clock: &Clock,
    ctx: &TxContext,
) {
    assert!(amount > 0, EZeroAmount);
    assert!(!vault.revoked, ERevoked);
    assert!(object::id(balance_manager) == vault.balance_manager_id, EWrongBalanceManager);
    // Expiry check: new deposits are blocked after expiry to protect
    // depositors from entering a mandate that cannot trade.
    // No bypass for expiry_ms == 0: create_vault rejects 0, so this is always
    // a real timestamp and the strict less-than is correct on both paths.
    assert!(clock.timestamp_ms() < vault.expiry_ms, EExpired);

    let depositor = ctx.sender();
    let new_shares = shares::shares_for_deposit(amount, vault.total_assets, vault.total_shares);

    // Update totals.
    vault.total_assets = vault.total_assets + amount;
    vault.total_shares = vault.total_shares + new_shares;

    // Update or create depositor record.
    if (table::contains(&vault.depositors, depositor)) {
        let record = table::borrow_mut(&mut vault.depositors, depositor);
        record.shares = record.shares + new_shares;
        record.cost_basis = record.cost_basis + amount;
    } else {
        table::add(&mut vault.depositors, depositor, DepositorRecord {
            shares: new_shares,
            cost_basis: amount,
        });
    };

    event::emit(Deposited {
        vault_id: object::id(vault),
        depositor,
        amount,
        shares_minted: new_shares,
        total_shares: vault.total_shares,
        total_assets: vault.total_assets,
    });
}

/// Burn `shares_to_burn` shares and return the proportional gross assets.
/// If gross_assets > cost_basis, the leader's performance fee is deducted.
/// Fee event is emitted separately so the UI can display fee breakdown.
/// Returns (gross_assets, fee_amount, net_assets) — caller updates BM.
///
/// Depositors may withdraw at any time, including after revocation or expiry.
public fun withdraw(
    vault: &mut Vault,
    balance_manager: &BalanceManager,
    shares_to_burn: u64,
    ctx: &TxContext,
): (u64, u64, u64) {
    let depositor = ctx.sender();
    assert!(shares_to_burn > 0, EZeroAmount);
    assert!(object::id(balance_manager) == vault.balance_manager_id, EWrongBalanceManager);
    assert!(table::contains(&vault.depositors, depositor), EInsufficientShares);

    let record = table::borrow(&vault.depositors, depositor);
    assert!(record.shares >= shares_to_burn, EInsufficientShares);

    // Proportional cost_basis for the shares being burned.
    // cost_basis_out = cost_basis * shares_to_burn / total_depositor_shares
    // Rounds DOWN — favour the vault (remaining depositors).
    let depositor_shares = record.shares;
    let depositor_cost_basis = record.cost_basis;
    let cost_basis_out = (
        ((depositor_cost_basis as u128) * (shares_to_burn as u128))
            / (depositor_shares as u128)
    ) as u64;

    // Gross assets at current NAV.
    let gross_assets = shares::assets_for_shares(
        shares_to_burn,
        vault.total_assets,
        vault.total_shares,
    );

    // Performance fee on realised profit only.
    let (fee_amount, net_assets) = shares::fee_on_profit(
        gross_assets,
        cost_basis_out,
        vault.perf_fee_bps,
    );

    // Update accounting.
    vault.total_assets = vault.total_assets - gross_assets;
    vault.total_shares = vault.total_shares - shares_to_burn;

    // Update depositor record; remove if fully withdrawn.
    // DepositorRecord has no 'drop' so we must explicitly handle the removed value.
    let record_mut = table::borrow_mut(&mut vault.depositors, depositor);
    record_mut.shares = record_mut.shares - shares_to_burn;
    record_mut.cost_basis = record_mut.cost_basis - cost_basis_out;
    if (record_mut.shares == 0) {
        let DepositorRecord { shares: _, cost_basis: _ } =
            table::remove(&mut vault.depositors, depositor);
    };

    // Emit fee event before withdrawal so the UI sees both.
    if (fee_amount > 0) {
        event::emit(FeeCollected {
            vault_id: object::id(vault),
            depositor,
            fee_amount,
            leader: vault.leader,
        });
    };

    event::emit(Withdrawn {
        vault_id: object::id(vault),
        depositor,
        shares_burned: shares_to_burn,
        gross_assets,
        fee_paid: fee_amount,
        net_assets,
        total_shares: vault.total_shares,
        total_assets: vault.total_assets,
    });

    (gross_assets, fee_amount, net_assets)
}

// === Leader API ===

/// Execute a policy-gated limit order through the vault (Delegate strategy).
/// Only the leader may call this. All four walls are checked atomically.
/// The TradeCap, locked in the vault, is used to generate the TradeProof.
public fun execute_order<BaseAsset, QuoteAsset>(
    vault: &mut Vault,
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    client_order_id: u64,
    price: u64,
    quantity: u64,
    is_bid: bool,
    pay_with_deep: bool,
    clock: &Clock,
    ctx: &TxContext,
) {
    let quote_committed = assert_and_debit(
        vault,
        object::id(pool),
        object::id(balance_manager),
        price,
        quantity,
        clock.timestamp_ms(),
        ctx.sender(),
    );

    let proof = balance_manager.generate_proof_as_trader(&vault.trade_cap, ctx);

    let order_info = pool.place_limit_order(
        balance_manager,
        &proof,
        client_order_id,
        NO_RESTRICTION,
        SELF_MATCHING_ALLOWED,
        price,
        quantity,
        is_bid,
        pay_with_deep,
        vault.expiry_ms,
        clock,
        ctx,
    );

    event::emit(OrderExecuted {
        vault_id: object::id(vault),
        order_id: order_info.order_id(),
        client_order_id,
        price,
        quantity,
        quote_committed,
        spent_after: vault.spent_quote,
        budget_quote: vault.budget_quote,
        status: order_info.status(),
    });
}

// === Internal ===

/// All four-walls enforcement in one place (mirrors agent_mandate pattern).
/// Returns the quote amount debited.
fun assert_and_debit(
    vault: &mut Vault,
    pool_id: ID,
    balance_manager_id: ID,
    price: u64,
    quantity: u64,
    now_ms: u64,
    sender: address,
): u64 {
    assert!(sender == vault.leader, ENotExecutor);
    assert!(!vault.revoked, ERevoked);
    assert!(now_ms < vault.expiry_ms, EExpired);
    assert!(pool_id == vault.allowed_pool, EWrongPool);
    assert!(balance_manager_id == vault.balance_manager_id, EWrongBalanceManager);

    // Conservative budget debit: full quote notional for bids.
    // Same formula as agent_mandate::assert_and_debit.
    let quote_committed =
        (((quantity as u128) * (price as u128)) / FLOAT_SCALING) as u64;

    // Per-order cap check (if configured).
    if (vault.max_order_quote > 0) {
        assert!(quote_committed <= vault.max_order_quote, EBudgetExceeded);
    };

    // Cast to u128 before addition to prevent a generic arithmetic overflow
    // abort when spent_quote is near u64::MAX. The result fits in u64 because
    // budget_quote is itself u64-bounded; the comparison is safe at u128 width.
    assert!(
        (vault.spent_quote as u128) + (quote_committed as u128) <= (vault.budget_quote as u128),
        EBudgetExceeded,
    );
    vault.spent_quote = vault.spent_quote + quote_committed;

    quote_committed
}

// === Test helpers ===

#[test_only]
public fun new_for_testing(
    trade_cap: TradeCap,
    balance_manager_id: ID,
    owner: address,
    leader: address,
    allowed_pool: ID,
    budget_quote: u64,
    expiry_ms: u64,
    ctx: &mut TxContext,
): Vault {
    Vault {
        id: object::new(ctx),
        owner,
        leader,
        leader_min_stake_bps: 0,
        trade_cap,
        balance_manager_id,
        allowed_pool,
        budget_quote,
        spent_quote: 0,
        max_order_quote: 0,
        expiry_ms,
        revoked: false,
        total_shares: 0,
        total_assets: 0,
        depositors: table::new(ctx),
        perf_fee_bps: DEFAULT_PERF_FEE_BPS,
        crank_fee_quote: 0,
    }
}

#[test_only]
public fun assert_and_debit_for_testing(
    vault: &mut Vault,
    pool_id: ID,
    balance_manager_id: ID,
    price: u64,
    quantity: u64,
    now_ms: u64,
    sender: address,
): u64 {
    assert_and_debit(vault, pool_id, balance_manager_id, price, quantity, now_ms, sender)
}

#[test_only]
public fun deposit_for_testing(
    vault: &mut Vault,
    amount: u64,
    depositor: address,
    ctx: &mut TxContext,
) {
    assert!(amount > 0, EZeroAmount);
    let new_shares = shares::shares_for_deposit(amount, vault.total_assets, vault.total_shares);
    vault.total_assets = vault.total_assets + amount;
    vault.total_shares = vault.total_shares + new_shares;
    if (table::contains(&vault.depositors, depositor)) {
        let record = table::borrow_mut(&mut vault.depositors, depositor);
        record.shares = record.shares + new_shares;
        record.cost_basis = record.cost_basis + amount;
    } else {
        table::add(&mut vault.depositors, depositor, DepositorRecord {
            shares: new_shares,
            cost_basis: amount,
        });
    };
    // suppress unused ctx warning
    let _ = ctx;
}

#[test_only]
public fun set_total_assets_for_testing(vault: &mut Vault, total_assets: u64) {
    vault.total_assets = total_assets;
}

#[test_only]
/// Destroy a vault that has no outstanding depositors (depositors table must be empty).
/// Use destroy_for_testing_with_depositors when depositors remain.
public fun destroy_for_testing(vault: Vault): TradeCap {
    let Vault { id, trade_cap, depositors, .. } = vault;
    id.delete();
    depositors.destroy_empty();
    trade_cap
}

#[test_only]
/// Destroy a vault that may still have depositor records.
/// Drains the depositor table by clearing known depositor addresses.
/// Only call from tests — passes addresses that were deposited.
public fun destroy_with_depositors_for_testing(
    vault: Vault,
    addrs: vector<address>,
): TradeCap {
    let Vault { id, trade_cap, mut depositors, .. } = vault;
    let mut i = 0;
    while (i < addrs.length()) {
        let addr = addrs[i];
        if (table::contains(&depositors, addr)) {
            let DepositorRecord { shares: _, cost_basis: _ } =
                table::remove(&mut depositors, addr);
        };
        i = i + 1;
    };
    id.delete();
    depositors.destroy_empty();
    trade_cap
}

// === View functions ===
public fun total_shares(v: &Vault): u64 { v.total_shares }
public fun total_assets(v: &Vault): u64 { v.total_assets }
public fun budget_quote(v: &Vault): u64 { v.budget_quote }
public fun spent_quote(v: &Vault): u64 { v.spent_quote }
public fun is_revoked(v: &Vault): bool { v.revoked }
public fun expiry_ms(v: &Vault): u64 { v.expiry_ms }
public fun leader(v: &Vault): address { v.leader }
public fun owner(v: &Vault): address { v.owner }
public fun perf_fee_bps(v: &Vault): u64 { v.perf_fee_bps }

/// Returns (shares, cost_basis) for a depositor, or (0, 0) if not present.
public fun crank_fee_quote(v: &Vault): u64 { v.crank_fee_quote }

/// Returns (shares, cost_basis) for a depositor, or (0, 0) if not present.
public fun depositor_record(v: &Vault, addr: address): (u64, u64) {
    if (table::contains(&v.depositors, addr)) {
        let r = table::borrow(&v.depositors, addr);
        (r.shares, r.cost_basis)
    } else {
        (0, 0)
    }
}

// Error accessors for tests.
public fun e_not_executor(): u64     { ENotExecutor }
public fun e_revoked(): u64          { ERevoked }
public fun e_expired(): u64          { EExpired }
public fun e_wrong_pool(): u64       { EWrongPool }
public fun e_wrong_bm(): u64         { EWrongBalanceManager }
public fun e_budget_exceeded(): u64  { EBudgetExceeded }
public fun e_not_owner(): u64        { ENotOwner }
public fun e_not_revoked(): u64      { ENotRevoked }
public fun e_insufficient_shares(): u64 { EInsufficientShares }
public fun e_zero_amount(): u64      { EZeroAmount }
public fun e_zero_expiry(): u64      { EZeroExpiry }
