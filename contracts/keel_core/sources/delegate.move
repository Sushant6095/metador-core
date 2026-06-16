// delegate.move — Delegate strategy: leader executes policy-gated orders.
//
// This module is a thin orchestration wrapper. The vault object embeds the
// execute_order function directly (for atomicity with the TradeCap), so
// this module exists to:
//   1. Express the Delegate strategy as a named concept in the type system.
//   2. Provide helper functions the frontend PTB builder can use directly.
//   3. Re-export the four-walls abort codes via clear public constants so
//      the SDK abort decoder (packages/deepbook) has a single source.
//
// The actual order placement lives in vault::execute_order — see that module
// for security model and wall enforcement commentary.
//
// ADR-004 (delegate-first): the leader trades the vault directly through the
// policy-gated function. Mirror-copy of external accounts is Gate 2.
module agent_mandate::delegate;

use agent_mandate::vault::Vault;
use deepbook::balance_manager::BalanceManager;
use deepbook::pool::Pool;
use sui::clock::Clock;

// === Re-export abort codes (must match docs/abort-codes.md) ===
// These mirror vault.move constants. Kept here so the SDK abort decoder
// can import from a stable public interface without reaching into vault internals.
public fun abort_not_executor(): u64    { 1 }
public fun abort_revoked(): u64         { 2 }
public fun abort_expired(): u64         { 3 }
public fun abort_wrong_pool(): u64      { 4 }
public fun abort_wrong_bm(): u64        { 5 }
public fun abort_budget_exceeded(): u64 { 6 }
public fun abort_not_owner(): u64       { 7 }
public fun abort_not_revoked(): u64     { 8 }

// === Delegate entry point ===

/// Place a policy-gated limit order as the vault leader.
///
/// This is a convenience entry function that delegates entirely to
/// vault::execute_order. The four walls (executor, revocation, expiry,
/// pool scope, BM identity, budget ceiling) are enforced atomically inside
/// vault::execute_order before the DeepBook cross-package call.
///
/// is_bid = true for buy orders; false for sell orders.
/// pay_with_deep: whether to pay taker fees in DEEP token. Set false for
/// whitelisted pools (DEEP/SUI spike pool); set true otherwise.
///
/// The caller (leader) must supply the BalanceManager that matches the vault.
/// Gas comes from the leader's wallet — not from vault funds.
public fun place_order<BaseAsset, QuoteAsset>(
    vault: &mut Vault,
    pool: &mut Pool<BaseAsset, QuoteAsset>,
    balance_manager: &mut BalanceManager,
    client_order_id: u64,
    price: u64,
    quantity: u64,
    is_bid: bool,
    pay_with_deep: bool,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    vault.execute_order<BaseAsset, QuoteAsset>(
        pool,
        balance_manager,
        client_order_id,
        price,
        quantity,
        is_bid,
        pay_with_deep,
        clock,
        ctx,
    );
}
