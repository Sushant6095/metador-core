// predict_vault_tests.move — Four-walls abort-path coverage + share/cost-basis
// math for the Predict vault (ADR-009).
//
// Scope rationale (BLOCKER PROTOCOL, brief): the live Predict object graph
// (PoolVault, ExpiryMarket, MarketOracle, PythSource, ProtocolConfig) needs
// pyth_lazer + wormhole git deps and on-chain oracle/market setup that is a
// testnet spike concern, not a unit-test concern. The vault's OWN security
// logic — the four walls and the share/cost-basis math — is pure and is fully
// exercised here in isolation via the `*_for_testing` shims. Every
// expected_failure targets one named wall code; a trailing `abort 999` guard
// fails the test if execution ever reaches past the asserted line.
//
// Wall → code map (must match docs/abort-codes.md agent_mandate::predict_vault):
//   role  → ENotLeader (5)   revoke → ERevoked (1)   expiry → EExpired (2)
//   scope → EOutOfScope (3)  budget → EBudgetExceeded (4)
#[test_only]
module agent_mandate::predict_vault_tests;
use agent_mandate::{predict_vault as pv, shares};

// Canonical test fixtures.
const LEADER: address = @0xA;
const STRANGER: address = @0xB;
const FEED_BTC: u32 = 1; // the feed this vault is bound to (scope wall)
const FEED_ETH: u32 = 2; // a different feed → must be rejected
const BUDGET: u64 = 1_000_000; // per-roll budget in DUSDC base units
const EXPIRY_MS: u64 = 2_000_000; // mandate expiry timestamp
const NOW_OK: u64 = 1_000_000; // before expiry
const NOW_LATE: u64 = 2_000_001; // after expiry

// A policy in the healthy state: live, not revoked, bound to FEED_BTC.
fun healthy_policy(): pv::PolicyHandle {
    pv::new_policy_for_testing(BUDGET, FEED_BTC, EXPIRY_MS, false)
}

// ─────────────────────────────────────────────
// FOUR WALLS — happy path passes all gates
// ─────────────────────────────────────────────

#[test]
fun roll_walls_pass_within_all_four() {
    let h = healthy_policy();
    // plp 600k + premium 400k = 1_000_000 == budget (boundary, allowed).
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 600_000, 400_000, NOW_OK, LEADER);
}

// ─────────────────────────────────────────────
// WALL: role gate (ENotLeader) — checked first
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = pv::ENotLeader)]
fun roll_aborts_when_sender_not_leader() {
    let h = healthy_policy();
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 100, 100, NOW_OK, STRANGER);
    abort 999
}

// ─────────────────────────────────────────────
// WALL 1: revoke (ERevoked)
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = pv::ERevoked)]
fun roll_aborts_when_revoked() {
    // Same as healthy but revoked = true.
    let h = pv::new_policy_for_testing(BUDGET, FEED_BTC, EXPIRY_MS, true);
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 100, 100, NOW_OK, LEADER);
    abort 999
}

// ─────────────────────────────────────────────
// WALL 2: expiry (EExpired)
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = pv::EExpired)]
fun roll_aborts_after_mandate_expiry() {
    let h = healthy_policy();
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 100, 100, NOW_LATE, LEADER);
    abort 999
}

#[test]
#[expected_failure(abort_code = pv::EExpired)]
fun roll_aborts_exactly_at_expiry_boundary() {
    // now == expiry must abort (gate is strict less-than).
    let h = healthy_policy();
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 100, 100, EXPIRY_MS, LEADER);
    abort 999
}

// ─────────────────────────────────────────────
// WALL 3: scope (EOutOfScope)
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = pv::EOutOfScope)]
fun roll_aborts_on_wrong_market_feed() {
    let h = healthy_policy();
    // Market reports FEED_ETH; vault is bound to FEED_BTC.
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_ETH, 100, 100, NOW_OK, LEADER);
    abort 999
}

// ─────────────────────────────────────────────
// WALL 4: budget (EBudgetExceeded)
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = pv::EBudgetExceeded)]
fun roll_aborts_when_over_budget() {
    let h = healthy_policy();
    // plp 600k + premium 400_001 = 1_000_001 > 1_000_000 budget.
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 600_000, 400_001, NOW_OK, LEADER);
    abort 999
}

#[test]
#[expected_failure(abort_code = pv::EZeroAmount)]
fun roll_aborts_on_zero_deploy() {
    let h = healthy_policy();
    // 0 plp + 0 premium is a no-op roll; rejected before budget compare.
    pv::assert_roll_walls_for_testing(&h, LEADER, FEED_BTC, 0, 0, NOW_OK, LEADER);
    abort 999
}

// ─────────────────────────────────────────────
// WALL ORDERING — role check precedes state checks
// A revoked + expired + wrong-feed + over-budget roll by a STRANGER must
// surface ENotLeader, proving the role gate runs first.
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = pv::ENotLeader)]
fun role_gate_precedes_all_state_walls() {
    let h = pv::new_policy_for_testing(BUDGET, FEED_BTC, EXPIRY_MS, true);
    pv::assert_roll_walls_for_testing(
        &h,
        LEADER,
        FEED_ETH,
        9_000_000,
        9_000_000,
        NOW_LATE,
        STRANGER,
    );
    abort 999
}

// ─────────────────────────────────────────────
// SHARE MATH (reused agent_mandate::shares) — vault accounting invariants
// ─────────────────────────────────────────────

#[test]
fun first_deposit_mints_one_to_one() {
    // First depositor into an empty vault: shares == amount.
    let s = shares::shares_for_deposit(500_000, 0, 0);
    assert!(s == 500_000, 0);
}

#[test]
fun second_deposit_mints_against_nav() {
    // Vault holds 1_000 assets / 1_000 shares (NAV 1.0). A 1_000 deposit
    // mints 1_000 * 1_000 / 1_000 = 1_000 shares.
    let s = shares::shares_for_deposit(1_000, 1_000, 1_000);
    assert!(s == 1_000, 0);
}

#[test]
fun deposit_after_profit_mints_fewer_shares() {
    // NAV rose to 1.2 (1_200 assets / 1_000 shares). A 1_200 deposit mints
    // 1_200 * 1_000 / 1_200 = 1_000 shares (newcomer doesn't dilute profit).
    let s = shares::shares_for_deposit(1_200, 1_200, 1_000);
    assert!(s == 1_000, 0);
}

#[test]
fun withdraw_returns_pro_rata_assets() {
    // Burn 1_000 of 1_000 shares against 1_120 assets → 1_120 out.
    let out = shares::assets_for_shares(1_000, 1_120, 1_000);
    assert!(out == 1_120, 0);
}

// ─────────────────────────────────────────────
// COST-BASIS pro-rata (mul_div_down) — partial-withdrawal accounting
// ─────────────────────────────────────────────

#[test]
fun cost_basis_pro_rata_half_withdrawal() {
    // Depositor holds 1_000 shares with 1_000 cost basis; burns 400.
    // cost_basis_out = 1_000 * 400 / 1_000 = 400.
    let cb_out = pv::mul_div_down_for_testing(1_000, 400, 1_000);
    assert!(cb_out == 400, 0);
}

#[test]
fun cost_basis_rounds_down_favouring_remaining_holders() {
    // 1_000 cost basis, burn 333 of 1_000 shares.
    // 1_000 * 333 / 1_000 = 333 (exact here); check a truncating case:
    // 1_001 * 1 / 3 = 333 (rounds down from 333.67).
    let cb_out = pv::mul_div_down_for_testing(1_001, 1, 3);
    assert!(cb_out == 333, 0);
}

#[test]
fun plp_pro_rata_value_rounds_down() {
    // NAV PLP valuation: 500 PLP shares of 1_000 total against 2_000 idle
    // backing → 500 * 2_000 / 1_000 = 1_000.
    let v = pv::mul_div_down_for_testing(500, 2_000, 1_000);
    assert!(v == 1_000, 0);
}

// ─────────────────────────────────────────────
// SHARES guards (named aborts, reused module)
// ─────────────────────────────────────────────

#[test]
#[expected_failure(abort_code = shares::EZeroDeposit)]
fun deposit_zero_amount_aborts() {
    shares::shares_for_deposit(0, 1_000, 1_000);
    abort 999
}

#[test]
#[expected_failure(abort_code = shares::ESharesExceedSupply)]
fun withdraw_more_than_supply_aborts() {
    shares::assets_for_shares(1_001, 1_000, 1_000);
    abort 999
}
