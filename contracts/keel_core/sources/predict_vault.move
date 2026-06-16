// predict_vault.move — Metador's non-custodial vault for DeepBook Predict (ADR-009).
//
// Security model (the four walls, re-pointed at Predict):
//   The PredictManager's authority caps (PredictTradeCap / PredictDepositCap /
//   PredictWithdrawCap) are minted and LOCKED inside the PredictVault object in
//   one atomic creation PTB. They never exist as free transferable objects.
//   Even with the leader's private key fully compromised, an attacker can only
//   reach `roll`, which the chain bounds by the four walls before any
//   `plp::supply` or `expiry_market::mint`:
//     1. Budget  — premium + PLP supply this roll must be <= per_roll_budget.
//     2. Scope   — the target market's pyth_lazer_feed_id must equal the one
//                  this vault was bound to; a mint on any other market aborts.
//     3. Expiry  — now < mandate_expiry_ms (the vault's own mandate, distinct
//                  from each rolling sub-hour Predict expiry).
//     4. Revoke  — owner flips `revoked`; proof generation then aborts at the
//                  manager (the cap ID is removed from its allow-list), so the
//                  leader loses trade authority instantly. Depositors keep
//                  withdraw rights through the held PredictWithdrawCap.
//   UI checks are convenience; these on-chain asserts are the only security.
//
// Shares accounting:
//   All share math is delegated to agent_mandate::shares (pure, known-answer
//   tested). NAV per share = total_assets / total_shares; total_assets tracks
//   the manager's settled DUSDC balance. Live PLP and open-position value are
//   read from the protocol via the NAV getter — never recomputed by us
//   (CLAUDE.md §1 layer guardrail: we own vault + policy, not pricing).
//
// Custody / PTB invariant:
//   `deposit` routes the caller's Coin<DUSDC> into the manager through the held
//   PredictDepositCap in the SAME call, so (unlike the spot vault.move) shares
//   are minted only after the funds actually land — there is no off-by-one PTB
//   ordering hazard. `withdraw` debits the manager through the held
//   PredictWithdrawCap and returns the Coin<DUSDC> to the depositor.
//
// Error codes are added to docs/abort-codes.md under
// `agent_mandate::predict_vault`; the frontend renders from that table.
module agent_mandate::predict_vault;
use agent_mandate::shares;
use deepbook_predict::{
    expiry_market::ExpiryMarket,
    market_oracle::MarketOracle,
    plp::{Self, PoolVault, PLP},
    predict_manager::{PredictManager, PredictTradeCap, PredictDepositCap, PredictWithdrawCap},
    protocol_config::ProtocolConfig,
    pyth_source::PythSource
};
use dusdc::dusdc::DUSDC;
use sui::{
    balance::{Self, Balance},
    clock::Clock,
    coin::{Self, Coin},
    event,
    table::{Self, Table}
};

// === Error codes (one per wall, plus value guards) ===
// Wall 1 (revoke), 2 (expiry), 3 (scope), 4 (budget); roles 5/6; guards 7/8.
/// Revocation wall: the vault's mandate has been revoked by its owner.
const ERevoked: u64 = 1;
/// Expiry wall: the vault's mandate has passed mandate_expiry_ms.
const EExpired: u64 = 2;
/// Scope wall: the target market is not the pyth feed this vault is bound to.
const EOutOfScope: u64 = 3;
/// Budget wall: this roll's premium + PLP supply exceeds per_roll_budget.
const EBudgetExceeded: u64 = 4;
/// Only the vault leader may roll the strategy.
const ENotLeader: u64 = 5;
/// Only the vault owner may revoke or reclaim.
const ENotOwner: u64 = 6;
/// Deposit / withdraw / roll amount must be greater than zero.
const EZeroAmount: u64 = 7;
/// Withdrawer does not hold enough shares to burn the requested amount.
const EInsufficientShares: u64 = 8;
/// Reclaim requires the vault to be revoked first.
const ENotRevoked: u64 = 9;
/// Reclaim requires every depositor to have withdrawn (no shares outstanding).
const EVaultNotEmpty: u64 = 10;
/// The supplied PredictManager is not the one this vault was created against.
const EWrongManager: u64 = 11;
/// Mandate expiry must be a real timestamp greater than zero (no perpetuals).
const EZeroExpiry: u64 = 12;

// === Objects ===

/// Per-depositor record: shares held and original DUSDC cost basis (snapshot at
/// deposit, never re-marked). Cost basis backs the performance-fee-on-profit
/// computation at withdrawal.
public struct DepositorRecord has store {
    shares: u64,
    cost_basis: u64,
}

/// The four walls, expressed against Predict. Admin-tunable policy: these
/// fields encode the mandate the leader trades under. `drop` so the vault can
/// be unpacked at `reclaim`; all fields are plain config primitives.
public struct VaultPolicy has drop, store {
    /// Budget wall: max DUSDC (mint premium + PLP supply) deployable per roll.
    per_roll_budget: u64,
    /// Scope wall: the single Pyth Lazer feed lineage this vault may trade.
    /// A roll against a market whose `pyth_lazer_feed_id` differs aborts.
    allowed_pyth_feed_id: u32,
    /// Expiry wall: the vault's own mandate horizon in ms since epoch. Distinct
    /// from each rolling Predict expiry; once passed, no further rolls.
    mandate_expiry_ms: u64,
    /// Revocation wall: owner kill switch. When true, `roll` cannot proceed and
    /// the manager-side cap revoke has severed trade authority.
    revoked: bool,
}

/// PredictVault — the main shared object. Wraps one PredictManager, locks its
/// authority caps, and runs a PLP+Hedge strategy under VaultPolicy.
public struct PredictVault has key {
    id: UID,
    /// Human who created the vault and holds the kill switch.
    owner: address,
    /// Leader authorized to roll the strategy. ADR-004 delegate-first.
    leader: address,
    /// The PredictManager this vault deposits into and trades through.
    manager_id: ID,
    /// Locked trade authority. Used only to generate proofs inside `roll`;
    /// never exposed. Revoking removes its ID from the manager's allow-list.
    trade_cap: PredictTradeCap,
    /// Locked deposit authority. Routes depositor DUSDC into the manager.
    deposit_cap: PredictDepositCap,
    /// Locked withdraw authority. Routes pro-rata DUSDC back to withdrawers.
    withdraw_cap: PredictWithdrawCap,
    /// PLP shares held by the vault from `plp::supply` (the core allocation).
    plp_balance: Balance<PLP>,
    /// The four walls.
    policy: VaultPolicy,
    /// Total share supply outstanding.
    total_shares: u64,
    /// DUSDC deposited (the settled-cash NAV denominator). The manager holds
    /// custody; this mirrors deposits/withdrawals through the vault.
    total_assets: u64,
    /// Per-depositor ledger keyed by address.
    depositors: Table<address, DepositorRecord>,
}

// === Events ===

public struct PredictVaultCreated has copy, drop {
    vault_id: ID,
    owner: address,
    leader: address,
    manager_id: ID,
    per_roll_budget: u64,
    allowed_pyth_feed_id: u32,
    mandate_expiry_ms: u64,
}

public struct PredictDeposited has copy, drop {
    vault_id: ID,
    depositor: address,
    amount: u64,
    shares_minted: u64,
    total_shares: u64,
    total_assets: u64,
}

public struct PredictWithdrawn has copy, drop {
    vault_id: ID,
    depositor: address,
    shares_burned: u64,
    assets_out: u64,
    total_shares: u64,
    total_assets: u64,
}

public struct PredictRolled has copy, drop {
    vault_id: ID,
    expiry_market_id: ID,
    plp_supplied: u64,
    hedge_premium: u64,
    hedge_order_id: u256,
    budget_used: u64,
    per_roll_budget: u64,
}

/// The theatrical kill-switch flip (DESIGN.md #motion): the demo's emotional
/// peak. Emitted after both the policy flag and the manager-side cap revoke.
public struct PredictVaultRevoked has copy, drop {
    vault_id: ID,
    manager_id: ID,
    total_assets: u64,
}

// === Owner API ===

/// Create and share a PredictVault. The three manager authority caps must be
/// minted and passed in the same PTB so they are locked atomically and never
/// exist as free objects. `mandate_expiry_ms` must be > 0: a zero mandate would
/// accept deposits but every roll would abort with EExpired, bricking funds.
public fun create_vault(
    manager: &PredictManager,
    trade_cap: PredictTradeCap,
    deposit_cap: PredictDepositCap,
    withdraw_cap: PredictWithdrawCap,
    leader: address,
    per_roll_budget: u64,
    allowed_pyth_feed_id: u32,
    mandate_expiry_ms: u64,
    ctx: &mut TxContext,
) {
    assert!(mandate_expiry_ms > 0, EZeroExpiry);
    let manager_id = manager.id();
    let vault = PredictVault {
        id: object::new(ctx),
        owner: ctx.sender(),
        leader,
        manager_id,
        trade_cap,
        deposit_cap,
        withdraw_cap,
        plp_balance: balance::zero(),
        policy: VaultPolicy {
            per_roll_budget,
            allowed_pyth_feed_id,
            mandate_expiry_ms,
            revoked: false,
        },
        total_shares: 0,
        total_assets: 0,
        depositors: table::new(ctx),
    };

    event::emit(PredictVaultCreated {
        vault_id: vault.id(),
        owner: vault.owner,
        leader,
        manager_id,
        per_roll_budget,
        allowed_pyth_feed_id,
        mandate_expiry_ms,
    });

    transfer::share_object(vault);
}

/// Owner-only kill switch. Removes the locked PredictTradeCap from the manager's
/// allow-list (severing the leader's trade authority on-chain — `roll`'s
/// proof generation will abort at the manager) and flips the policy flag.
/// Depositors keep withdraw rights through the held PredictWithdrawCap.
public fun revoke(vault: &mut PredictVault, manager: &mut PredictManager, ctx: &TxContext) {
    assert!(ctx.sender() == vault.owner, ENotOwner);
    assert!(manager.id() == vault.manager_id, EWrongManager);

    // Manager-side revoke: strip the trade cap's ID from the allow-list so any
    // future `generate_proof_as_trader` aborts even though the cap object still
    // physically lives inside this vault. predict_manager exposes no cap-ID
    // getter, so read the object ID of the locked cap directly.
    let cap_id = object::id(&vault.trade_cap);
    manager.revoke_cap(&cap_id, ctx);
    vault.policy.revoked = true;

    event::emit(PredictVaultRevoked {
        vault_id: vault.id(),
        manager_id: vault.manager_id,
        total_assets: vault.total_assets,
    });
}

/// After revocation and once every depositor has withdrawn, the owner reclaims
/// the three locked caps and destroys the vault (full lifecycle closure,
/// mirroring the spot vault's `reclaim_trade_cap`). The caps are returned so the
/// owner can wind the PredictManager down separately. Returns
/// (trade_cap, deposit_cap, withdraw_cap).
public fun reclaim(
    vault: PredictVault,
    ctx: &TxContext,
): (PredictTradeCap, PredictDepositCap, PredictWithdrawCap) {
    assert!(ctx.sender() == vault.owner, ENotOwner);
    assert!(vault.policy.revoked, ENotRevoked);
    assert!(vault.total_shares == 0, EVaultNotEmpty);

    let PredictVault {
        id,
        trade_cap,
        deposit_cap,
        withdraw_cap,
        plp_balance,
        depositors,
        ..,
    } = vault;

    // A revoked, share-empty vault should hold no PLP either; destroy_zero
    // asserts that invariant rather than silently dropping value.
    plp_balance.destroy_zero();
    depositors.destroy_empty();
    id.delete();
    (trade_cap, deposit_cap, withdraw_cap)
}

// === Depositor API ===

/// Deposit `coin` DUSDC into the vault. Routes the coin into the manager via
/// the locked PredictDepositCap, then mints shares against current NAV for the
/// caller. Because the deposit and the share mint happen in one call, shares
/// are always backed by funds that actually landed.
///
/// Blocked once revoked or past the mandate expiry: a depositor must never
/// enter a mandate that can no longer trade.
public fun deposit(
    vault: &mut PredictVault,
    manager: &mut PredictManager,
    coin: Coin<DUSDC>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(manager.id() == vault.manager_id, EWrongManager);
    assert!(!vault.policy.revoked, ERevoked);
    assert!(clock.timestamp_ms() < vault.policy.mandate_expiry_ms, EExpired);

    let amount = coin.value();
    assert!(amount > 0, EZeroAmount);

    let new_shares = shares::shares_for_deposit(amount, vault.total_assets, vault.total_shares);

    // Route funds into the manager through the locked deposit cap, then account.
    manager.deposit_with_cap(&vault.deposit_cap, coin, ctx);
    vault.total_assets = vault.total_assets + amount;
    vault.total_shares = vault.total_shares + new_shares;

    let depositor = ctx.sender();
    if (vault.depositors.contains(depositor)) {
        let record = &mut vault.depositors[depositor];
        record.shares = record.shares + new_shares;
        record.cost_basis = record.cost_basis + amount;
    } else {
        vault
            .depositors
            .add(depositor, DepositorRecord { shares: new_shares, cost_basis: amount });
    };

    event::emit(PredictDeposited {
        vault_id: vault.id(),
        depositor,
        amount,
        shares_minted: new_shares,
        total_shares: vault.total_shares,
        total_assets: vault.total_assets,
    });
}

/// Burn `shares_to_burn` shares and return the pro-rata DUSDC, withdrawn from
/// the manager through the locked PredictWithdrawCap. Depositors may withdraw
/// at any time, including after revocation or expiry — withdrawal is never
/// gated by the four walls.
public fun withdraw(
    vault: &mut PredictVault,
    manager: &mut PredictManager,
    shares_to_burn: u64,
    ctx: &mut TxContext,
): Coin<DUSDC> {
    assert!(manager.id() == vault.manager_id, EWrongManager);
    assert!(shares_to_burn > 0, EZeroAmount);

    let depositor = ctx.sender();
    assert!(vault.depositors.contains(depositor), EInsufficientShares);
    let record = &vault.depositors[depositor];
    assert!(record.shares >= shares_to_burn, EInsufficientShares);

    let assets_out = shares::assets_for_shares(
        shares_to_burn,
        vault.total_assets,
        vault.total_shares,
    );

    vault.total_assets = vault.total_assets - assets_out;
    vault.total_shares = vault.total_shares - shares_to_burn;

    let record_mut = &mut vault.depositors[depositor];
    let cost_basis_out = mul_div_down(record_mut.cost_basis, shares_to_burn, record_mut.shares);
    record_mut.shares = record_mut.shares - shares_to_burn;
    record_mut.cost_basis = record_mut.cost_basis - cost_basis_out;
    if (record_mut.shares == 0) {
        let DepositorRecord { shares: _, cost_basis: _ } = vault.depositors.remove(depositor);
    };

    event::emit(PredictWithdrawn {
        vault_id: vault.id(),
        depositor,
        shares_burned: shares_to_burn,
        assets_out,
        total_shares: vault.total_shares,
        total_assets: vault.total_assets,
    });

    manager.withdraw_with_cap(&vault.withdraw_cap, assets_out, ctx)
}

// === Leader API ===

/// Roll the PLP+Hedge strategy: supply `plp_supply` DUSDC into the pool vault
/// (the core allocation, taking the counterparty side) and mint one OTM hedge
/// range on `market` for `hedge_premium` of cover at `leverage`.
///
/// Leader-only. RE-CHECKS ALL FOUR WALLS before any fund movement: revoke,
/// expiry, scope (market feed must equal the bound feed), and budget
/// (plp_supply + hedge_premium <= per_roll_budget). The locked PredictTradeCap
/// is used to generate the proof; if the owner has revoked, proof generation
/// aborts at the manager. Returns the minted hedge order ID for the keeper.
public fun roll(
    vault: &mut PredictVault,
    manager: &mut PredictManager,
    market: &mut ExpiryMarket,
    market_oracle: &MarketOracle,
    pyth: &PythSource,
    pool_vault: &mut PoolVault,
    config: &mut ProtocolConfig,
    sui_source: &PythSource,
    deep_source: &PythSource,
    plp_supply: u64,
    hedge_lower_strike: u64,
    hedge_higher_strike: u64,
    hedge_quantity: u64,
    hedge_premium: u64,
    leverage: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): u256 {
    // The four walls — all mutation-independent facts this flow owns, checked
    // before a single coin moves.
    assert_roll_walls(
        &vault.policy,
        vault.leader,
        market.pyth_lazer_feed_id(),
        plp_supply,
        hedge_premium,
        clock.timestamp_ms(),
        ctx.sender(),
    );

    // --- Core allocation: supply DUSDC into the PLP pool. ---
    // Pull the supply premium out of the manager through the locked withdraw
    // cap so it comes from vault-owned funds, then supply it to the pool.
    let supply_coin = manager.withdraw_with_cap(&vault.withdraw_cap, plp_supply, ctx);
    let sync = plp::start_pool_sync(config, pool_vault);
    let plp = plp::supply(
        pool_vault,
        config,
        sync,
        supply_coin,
        sui_source,
        deep_source,
        clock,
        ctx,
    );
    vault.plp_balance.join(plp.into_balance());
    // Supplied DUSDC left the manager's settled balance; reflect in NAV
    // denominator so per-share cash accounting stays consistent. PLP value is
    // surfaced separately by `nav` (read from the protocol, not recomputed).
    vault.total_assets = vault.total_assets - plp_supply;

    // --- Hedge: mint one OTM strike range, authorized by the locked cap. ---
    let proof = manager.generate_proof_as_trader(&vault.trade_cap, ctx);
    let hedge_order_id = market.mint(
        manager,
        &proof,
        config,
        market_oracle,
        pyth,
        hedge_lower_strike,
        hedge_higher_strike,
        hedge_quantity,
        leverage,
        clock,
        ctx,
    );

    event::emit(PredictRolled {
        vault_id: vault.id(),
        expiry_market_id: market.id(),
        plp_supplied: plp_supply,
        hedge_premium,
        hedge_order_id,
        budget_used: plp_supply + hedge_premium,
        per_roll_budget: vault.policy.per_roll_budget,
    });

    hedge_order_id
}

// === Views ===

/// Net asset value of the vault in DUSDC. Sums the manager's settled balance,
/// the live PLP value (priced by the pool, never by us), and any open-position
/// value the protocol reports. Live valuation reads from the protocol so we
/// never recompute Predict pricing (CLAUDE.md §1 layer guardrail).
public fun nav(vault: &PredictVault, manager: &PredictManager, pool_vault: &PoolVault): u64 {
    let plp_shares = vault.plp_balance.value();
    let plp_total = pool_vault.total_supply();
    let plp_value = if (plp_total == 0) {
        0
    } else {
        // pro-rata DUSDC the pool's idle backing assigns to our PLP shares.
        mul_div_down(plp_shares, pool_vault.idle_balance(), plp_total)
    };
    manager.balance() + plp_value
}

public fun id(vault: &PredictVault): ID { vault.id.to_inner() }

public fun owner(vault: &PredictVault): address { vault.owner }

public fun leader(vault: &PredictVault): address { vault.leader }

public fun manager_id(vault: &PredictVault): ID { vault.manager_id }

public fun total_shares(vault: &PredictVault): u64 { vault.total_shares }

public fun total_assets(vault: &PredictVault): u64 { vault.total_assets }

public fun is_revoked(vault: &PredictVault): bool { vault.policy.revoked }

public fun per_roll_budget(vault: &PredictVault): u64 { vault.policy.per_roll_budget }

public fun allowed_pyth_feed_id(vault: &PredictVault): u32 {
    vault.policy.allowed_pyth_feed_id
}

public fun mandate_expiry_ms(vault: &PredictVault): u64 { vault.policy.mandate_expiry_ms }

public fun plp_shares(vault: &PredictVault): u64 { vault.plp_balance.value() }

/// Returns (shares, cost_basis) for a depositor, or (0, 0) if not present.
public fun depositor_record(vault: &PredictVault, addr: address): (u64, u64) {
    if (vault.depositors.contains(addr)) {
        let r = &vault.depositors[addr];
        (r.shares, r.cost_basis)
    } else {
        (0, 0)
    }
}

// === Internal ===

/// The four-walls gate for `roll`, factored out as a pure function over policy
/// fields so the security logic is unit-testable in isolation. Wall order
/// matches the abort-code numbering: revoke, expiry, scope, budget; role gate
/// first. `budget_used` is the total DUSDC this roll deploys (PLP + premium).
fun assert_roll_walls(
    policy: &VaultPolicy,
    leader: address,
    market_feed_id: u32,
    plp_supply: u64,
    hedge_premium: u64,
    now_ms: u64,
    sender: address,
) {
    assert!(sender == leader, ENotLeader);
    assert!(!policy.revoked, ERevoked);
    assert!(now_ms < policy.mandate_expiry_ms, EExpired);
    assert!(market_feed_id == policy.allowed_pyth_feed_id, EOutOfScope);
    let budget_used = plp_supply + hedge_premium;
    assert!(budget_used > 0, EZeroAmount);
    // u128 widen so a near-u64 sum compares without a generic overflow abort.
    assert!((budget_used as u128) <= (policy.per_roll_budget as u128), EBudgetExceeded);
}

/// a * b / c with u128 intermediate, rounding down. Used for cost-basis and
/// PLP pro-rata; mirrors the rounding rule in agent_mandate::shares.
fun mul_div_down(a: u64, b: u64, c: u64): u64 {
    (((a as u128) * (b as u128)) / (c as u128)) as u64
}

// === Test helpers ===

#[test_only]
public struct PolicyHandle has drop {
    policy: VaultPolicy,
}

#[test_only]
/// Build a standalone VaultPolicy so the four-walls gate can be exercised
/// without the full Predict object graph.
public fun new_policy_for_testing(
    per_roll_budget: u64,
    allowed_pyth_feed_id: u32,
    mandate_expiry_ms: u64,
    revoked: bool,
): PolicyHandle {
    PolicyHandle {
        policy: VaultPolicy {
            per_roll_budget,
            allowed_pyth_feed_id,
            mandate_expiry_ms,
            revoked,
        },
    }
}

#[test_only]
/// Exercise the four-walls gate against a test policy. Aborts with the same
/// wall codes `roll` enforces.
public fun assert_roll_walls_for_testing(
    handle: &PolicyHandle,
    leader: address,
    market_feed_id: u32,
    plp_supply: u64,
    hedge_premium: u64,
    now_ms: u64,
    sender: address,
) {
    assert_roll_walls(
        &handle.policy,
        leader,
        market_feed_id,
        plp_supply,
        hedge_premium,
        now_ms,
        sender,
    );
}

#[test_only]
public fun mul_div_down_for_testing(a: u64, b: u64, c: u64): u64 {
    mul_div_down(a, b, c)
}

// === Error accessors for tests ===
public fun e_revoked(): u64 { ERevoked }

public fun e_expired(): u64 { EExpired }

public fun e_out_of_scope(): u64 { EOutOfScope }

public fun e_budget_exceeded(): u64 { EBudgetExceeded }

public fun e_not_leader(): u64 { ENotLeader }

public fun e_not_owner(): u64 { ENotOwner }

public fun e_zero_amount(): u64 { EZeroAmount }

public fun e_insufficient_shares(): u64 { EInsufficientShares }

public fun e_not_revoked(): u64 { ENotRevoked }

public fun e_vault_not_empty(): u64 { EVaultNotEmpty }

public fun e_wrong_manager(): u64 { EWrongManager }

public fun e_zero_expiry(): u64 { EZeroExpiry }
