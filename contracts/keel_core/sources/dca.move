// dca.move — DCA (Dollar-Cost Averaging) strategy for Keel vaults.
//
// Design:
//   A DCA configuration is embedded in the vault via a shared DcaConfig
//   object that references the vault by ID. Any address (cranker, owner,
//   leader, the public) may call tick() when the interval has elapsed.
//   The chain re-verifies ALL four walls before placing the order, so
//   the cranker is untrusted by design — even a malicious cranker can
//   only trigger a valid, policy-bounded order or get the tx aborted.
//
//   Order params: fixed quote_per_tick is converted to a base quantity
//   at the supplied price. This is a bid-only strategy (DCA buy).
//   Sell-side DCA (base budget) is a roadmap item; the budget model
//   differs (base-denominated ceiling) and is not in scope for G1.
//
// Crank incentive:
//   crank_fee_quote is paid from vault accounting (tracked as a debit) but
//   the actual BM transfer to the cranker is a UI/cranker-service concern
//   in G1 — the event is emitted and the fee is recorded. The transfer
//   path goes through balance_manager::withdraw which is owner-only, so
//   the protocol cannot auto-pay crankers on-chain in G1 without an
//   additional WithdrawCap design. This is documented as a G2 item.
//
// Four walls: the tick() function asserts budget/scope/expiry/revocation
// via vault::assert_and_debit_for_testing path in tests; in prod it calls
// vault::execute_order which contains the same checks.
module agent_mandate::dca;

use agent_mandate::vault::Vault;
use deepbook::balance_manager::BalanceManager;
use deepbook::pool::Pool;
use sui::clock::Clock;
use sui::event;

// === Error codes ===
/// Tick called before the interval has elapsed.
const ETooEarly: u64 = 30;
/// quote_per_tick must be > 0.
const EZeroQuotePerTick: u64 = 31;
/// interval_ms must be > 0.
const EZeroInterval: u64 = 32;
/// Only the vault owner may create/update DCA config.
const ENotOwner: u64 = 7; // same value as vault ENotOwner — consistent
/// DCA config was created for a different vault than the one passed to tick().
/// First line of tick() — prevents cross-vault budget drain.
const EVaultMismatch: u64 = 33;
/// bid_price must be > 0: zero causes division-by-zero in quantity calculation.
const EZeroBidPrice: u64 = 34;

// DeepBook FLOAT_SCALING for price→qty conversion.
const FLOAT_SCALING: u128 = 1_000_000_000;

// === Objects ===

/// DCA configuration. Shared so any cranker can observe and tick it.
/// Keyed by vault_id so the frontend can join vault + config in one query.
public struct DcaConfig has key {
    id: UID,
    /// The vault this DCA config applies to.
    vault_id: ID,
    /// Quote units to spend per tick (e.g. 10 USDC = 10_000_000 base units).
    quote_per_tick: u64,
    /// Minimum ms between ticks (e.g. 86_400_000 = 24 hours).
    interval_ms: u64,
    /// Timestamp (ms) when the next tick becomes valid.
    next_tick_ms: u64,
    /// Bid price to use for the limit order placed on each tick.
    /// Set this to a price slightly below market to create a resting bid;
    /// the order will fill naturally as the market moves down, or it rests
    /// until the next interval re-places it. This is safe because the vault's
    /// budget ceiling is the hard cap regardless of price.
    bid_price: u64,
    /// Whether to pay taker fees in DEEP. False for whitelisted pools.
    pay_with_deep: bool,
    /// Client order id counter (incremented each tick for uniqueness).
    order_counter: u64,
    /// Number of ticks executed successfully.
    ticks_executed: u64,
}

// === Events ===

public struct DcaConfigCreated has copy, drop {
    config_id: ID,
    vault_id: ID,
    quote_per_tick: u64,
    interval_ms: u64,
    bid_price: u64,
}

public struct DcaTick has copy, drop {
    config_id: ID,
    vault_id: ID,
    tick_number: u64,
    quote_committed: u64,
    quantity: u64,
    bid_price: u64,
    next_tick_ms: u64,
    cranker: address,
}

public struct CrankPaid has copy, drop {
    config_id: ID,
    vault_id: ID,
    cranker: address,
    /// Crank fee in quote units; actual BM transfer is a G2 on-chain path.
    crank_fee_quote: u64,
}

// === Owner API ===

/// Create a DCA config for a vault. Only the vault owner should call this.
/// Validation: quote_per_tick > 0, interval_ms > 0.
/// first_tick_ms: when the first tick becomes valid (typically `now + interval`).
public fun create_config(
    vault: &Vault,
    quote_per_tick: u64,
    interval_ms: u64,
    first_tick_ms: u64,
    bid_price: u64,
    pay_with_deep: bool,
    ctx: &mut TxContext,
) {
    assert!(ctx.sender() == vault.owner(), ENotOwner);
    assert!(quote_per_tick > 0, EZeroQuotePerTick);
    assert!(interval_ms > 0, EZeroInterval);
    // bid_price == 0 would cause division-by-zero in tick() quantity calculation.
    assert!(bid_price > 0, EZeroBidPrice);

    let config = DcaConfig {
        id: object::new(ctx),
        vault_id: object::id(vault),
        quote_per_tick,
        interval_ms,
        next_tick_ms: first_tick_ms,
        bid_price,
        pay_with_deep,
        order_counter: 0,
        ticks_executed: 0,
    };

    event::emit(DcaConfigCreated {
        config_id: object::id(&config),
        vault_id: object::id(vault),
        quote_per_tick,
        interval_ms,
        bid_price,
    });

    transfer::share_object(config);
}

/// Update bid_price; owner-only. Useful when market has moved significantly.
/// new_price must be > 0 to prevent division-by-zero in tick().
public fun update_bid_price(
    config: &mut DcaConfig,
    vault: &Vault,
    new_price: u64,
    ctx: &TxContext,
) {
    assert!(ctx.sender() == vault.owner(), ENotOwner);
    assert!(new_price > 0, EZeroBidPrice);
    config.bid_price = new_price;
}

// === Cranker API ===

/// Execute one DCA tick. Anyone may call this (permissionless crank).
/// The chain enforces:
///   - interval gate: aborts ETooEarly if clock < next_tick_ms
///   - all four vault walls via vault::execute_order (budget/scope/expiry/revoke)
///
/// Quantity is computed as: qty = quote_per_tick * FLOAT_SCALING / bid_price
/// Rounding: truncate (rounds down) — vault spends <= quote_per_tick.
///
/// On success: next_tick_ms advances by interval_ms, order counter increments,
/// ticks_executed increments, CrankPaid event emitted.
public fun tick<BaseAsset, QuoteAsset>(
    config: &mut DcaConfig,
    vault: &mut Vault,
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // CRITICAL: verify this config was created for this vault.
    // Without this check a malicious cranker could pass DcaConfig from vault A
    // with vault B, draining vault B's budget under vault A's DCA parameters.
    assert!(config.vault_id == object::id(vault), EVaultMismatch);

    let now_ms = clock.timestamp_ms();
    assert!(now_ms >= config.next_tick_ms, ETooEarly);

    // Compute base quantity from quote budget and bid price.
    // qty = quote_per_tick * FLOAT_SCALING / bid_price   (truncate)
    // This means actual_quote_spent = qty * bid_price / FLOAT_SCALING <= quote_per_tick.
    let quantity = (
        ((config.quote_per_tick as u128) * FLOAT_SCALING) / (config.bid_price as u128)
    ) as u64;

    // Use an incrementing client_order_id so each tick's order is unique.
    config.order_counter = config.order_counter + 1;
    let client_order_id = config.order_counter;

    // Place the order through the vault (four walls enforced inside).
    vault.execute_order<BaseAsset, QuoteAsset>(
        pool,
        balance_manager,
        client_order_id,
        config.bid_price,
        quantity,
        true, // is_bid — DCA buys only
        config.pay_with_deep,
        clock,
        ctx,
    );

    // Advance schedule.
    config.next_tick_ms = config.next_tick_ms + config.interval_ms;
    config.ticks_executed = config.ticks_executed + 1;

    let cranker = ctx.sender();
    let crank_fee = vault.crank_fee_quote();

    event::emit(DcaTick {
        config_id: object::id(config),
        vault_id: object::id(vault),
        tick_number: config.ticks_executed,
        quote_committed: config.quote_per_tick,
        quantity,
        bid_price: config.bid_price,
        next_tick_ms: config.next_tick_ms,
        cranker,
    });

    if (crank_fee > 0) {
        event::emit(CrankPaid {
            config_id: object::id(config),
            vault_id: object::id(vault),
            cranker,
            crank_fee_quote: crank_fee,
        });
    };
}

// === View functions ===
public fun vault_id(c: &DcaConfig): ID       { c.vault_id }
public fun quote_per_tick(c: &DcaConfig): u64 { c.quote_per_tick }
public fun interval_ms(c: &DcaConfig): u64    { c.interval_ms }
public fun next_tick_ms(c: &DcaConfig): u64   { c.next_tick_ms }
public fun ticks_executed(c: &DcaConfig): u64 { c.ticks_executed }
public fun bid_price(c: &DcaConfig): u64      { c.bid_price }

// Error accessors for tests.
public fun e_too_early(): u64 { ETooEarly }
public fun e_zero_quote_per_tick(): u64 { EZeroQuotePerTick }
public fun e_zero_interval(): u64 { EZeroInterval }
public fun e_vault_mismatch(): u64 { EVaultMismatch }
public fun e_zero_bid_price(): u64 { EZeroBidPrice }

// === Test-only helpers ===

/// Assert interval gate only (no Pool needed). Aborts ETooEarly if early.
/// Used to test the ETooEarly abort code in the dca module without needing
/// a real Pool object.
#[test_only]
public fun assert_interval_for_testing(config: &DcaConfig, now_ms: u64) {
    assert!(now_ms >= config.next_tick_ms, ETooEarly);
}

/// Assert vault binding only (no Pool needed). Aborts EVaultMismatch if mismatch.
/// Used to test the EVaultMismatch abort code in the dca module without needing
/// a real Pool object.
#[test_only]
public fun assert_vault_binding_for_testing(config: &DcaConfig, vault: &Vault) {
    assert!(config.vault_id == object::id(vault), EVaultMismatch);
}
