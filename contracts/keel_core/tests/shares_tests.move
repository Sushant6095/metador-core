// shares_tests.move — Known-answer and boundary tests for shares.move.
//
// The CANONICAL CASE (from docs/research/keel-context-transfer.md):
//   Maya deposits 1,000 units → vault NAV rises 12% →
//   gross withdrawal = 1,120 units
//   Leo's fee = 10% of 120 profit = 12 units
//   Maya's net = 1,108 units
//
// All amounts use 6-decimal quote token (DBUSDC/USDC-like):
//   1,000 units = 1_000_000_000 in base (but for simplicity the canonical
//   test uses human-readable integers to keep the arithmetic legible; the
//   property holds for any scaling).
//
// Additional cases:
//   - First deposit (1:1)
//   - Multiple depositors
//   - Rounding direction (truncation always favours vault)
//   - Zero / edge-case guards (abort paths)
#[test_only]
module agent_mandate::shares_tests;

use agent_mandate::shares;

// ─────────────────────────────────────────────
// CANONICAL CASE — Maya 1,000 → 12% NAV → 1,108
// ─────────────────────────────────────────────

#[test]
fun canonical_maya_deposit_1_to_1_first() {
    // First deposit: 1:1, no prior shares.
    let shares_minted = shares::shares_for_deposit(1_000, 0, 0);
    assert!(shares_minted == 1_000, 0);
}

#[test]
fun canonical_assets_after_nav_increase() {
    // State after +12% NAV: 1 depositor holds 1_000 shares,
    // vault now has 1_120 assets (from profitable trading).
    // Her gross withdrawal = 1_000 * 1_120 / 1_000 = 1_120.
    let gross = shares::assets_for_shares(1_000, 1_120, 1_000);
    assert!(gross == 1_120, 0);
}

#[test]
fun canonical_fee_on_profit() {
    // gross = 1_120, cost_basis = 1_000
    // profit = 120, fee_bps = 1_000 (10%)
    // fee = 120 * 1_000 / 10_000 = 12
    // net = 1_120 - 12 = 1_108
    let (fee, net) = shares::fee_on_profit(1_120, 1_000, 1_000);
    assert!(fee == 12, 0);
    assert!(net == 1_108, 0);
}

#[test]
fun canonical_full_flow() {
    // Compose all three calls: the complete Maya journey.
    // Step 1: Maya deposits 1,000 (first deposit → 1:1 shares).
    let shares_minted = shares::shares_for_deposit(1_000, 0, 0);
    assert!(shares_minted == 1_000, 0);

    // Step 2: Vault NAV rises to 1_120 (leader traded well).
    // (Outside share math — total_assets is set by vault accounting.)

    // Step 3: Maya withdraws all 1,000 shares at new NAV.
    let gross = shares::assets_for_shares(1_000, 1_120, 1_000);
    assert!(gross == 1_120, 0);

    // Step 4: Fee on profit.
    let (fee, net) = shares::fee_on_profit(gross, 1_000, 1_000);
    assert!(fee == 12, 0);
    assert!(net == 1_108, 0);
    // CONFIRMED: Maya's canonical result is 1,108 net.
}

// ─────────────────────────────────────────────
// First-deposit is always 1:1
// ─────────────────────────────────────────────

#[test]
fun first_deposit_one_to_one_small() {
    let s = shares::shares_for_deposit(1, 0, 0);
    assert!(s == 1, 0);
}

#[test]
fun first_deposit_one_to_one_large() {
    let s = shares::shares_for_deposit(1_000_000_000_000, 0, 0);
    assert!(s == 1_000_000_000_000, 0);
}

// ─────────────────────────────────────────────
// Subsequent deposit proportionality
// ─────────────────────────────────────────────

#[test]
fun second_deposit_same_nav() {
    // Leo also deposits 1,000 into a vault with 1,000 assets and 1,000 shares.
    // His shares = 1,000 * 1,000 / 1,000 = 1,000 (NAV unchanged).
    let s = shares::shares_for_deposit(1_000, 1_000, 1_000);
    assert!(s == 1_000, 0);
}

#[test]
fun second_deposit_higher_nav() {
    // Vault has 1,120 assets and 1,000 shares (after profitable trading).
    // New depositor deposits 1,120; gets 1,120 * 1,000 / 1,120 = 1,000 shares.
    let s = shares::shares_for_deposit(1_120, 1_120, 1_000);
    assert!(s == 1_000, 0);
}

#[test]
fun second_deposit_dilution_truncates_toward_vault() {
    // Vault: 1,000 assets, 1,000 shares. New deposit: 999 (odd amount).
    // shares = 999 * 1_000 / 1_000 = 999 (no rounding needed here).
    let s = shares::shares_for_deposit(999, 1_000, 1_000);
    assert!(s == 999, 0);
}

#[test]
fun shares_truncation_favours_vault() {
    // Vault: 3 assets, 2 shares. New deposit: 2 units.
    // shares = 2 * 2 / 3 = 1 (truncated from 1.333... — vault keeps the dust).
    let s = shares::shares_for_deposit(2, 3, 2);
    assert!(s == 1, 0);
}

// ─────────────────────────────────────────────
// Withdrawal proportionality and rounding
// ─────────────────────────────────────────────

#[test]
fun withdraw_proportional_exact() {
    // 500 shares out of 1,000 total, 1,200 assets → 600 assets out.
    let a = shares::assets_for_shares(500, 1_200, 1_000);
    assert!(a == 600, 0);
}

#[test]
fun withdraw_all_shares() {
    // Burning all shares returns all assets.
    let a = shares::assets_for_shares(1_000, 1_000, 1_000);
    assert!(a == 1_000, 0);
}

#[test]
fun withdraw_assets_truncate_toward_vault() {
    // 2 shares out of 3 total, 3 assets → assets = 2*3/3 = 2 (exact here).
    // Try: 1 share, 2 total, 3 assets → 1*3/2 = 1 (truncated from 1.5).
    let a = shares::assets_for_shares(1, 3, 2);
    assert!(a == 1, 0);
}

// ─────────────────────────────────────────────
// Fee edge cases
// ─────────────────────────────────────────────

#[test]
fun no_fee_when_no_profit() {
    // assets_out == cost_basis → profit = 0, no fee.
    let (fee, net) = shares::fee_on_profit(1_000, 1_000, 1_000);
    assert!(fee == 0, 0);
    assert!(net == 1_000, 0);
}

#[test]
fun no_fee_when_loss() {
    // assets_out < cost_basis → profit negative, fee = 0.
    let (fee, net) = shares::fee_on_profit(900, 1_000, 1_000);
    assert!(fee == 0, 0);
    assert!(net == 900, 0);
}

#[test]
fun fee_truncation_favours_depositor() {
    // profit = 1, fee_bps = 1000 → fee = 1 * 1000 / 10000 = 0 (truncated)
    // depositor gets the full 1 unit of profit.
    let (fee, net) = shares::fee_on_profit(1_001, 1_000, 1_000);
    assert!(fee == 0, 0);
    assert!(net == 1_001, 0);
}

#[test]
fun fee_on_large_profit() {
    // profit = 10_000, fee_bps = 1_000 → fee = 1_000
    let (fee, net) = shares::fee_on_profit(11_000, 1_000, 1_000);
    assert!(fee == 1_000, 0);
    assert!(net == 10_000, 0);
}

#[test]
fun fee_zero_bps_no_fee() {
    // 0 bps → leader takes nothing.
    let (fee, net) = shares::fee_on_profit(1_200, 1_000, 0);
    assert!(fee == 0, 0);
    assert!(net == 1_200, 0);
}

#[test]
fun fee_full_bps_max() {
    // 10_000 bps = 100% fee → leader takes all profit.
    // profit = 100, fee = 100, net = cost_basis.
    let (fee, net) = shares::fee_on_profit(1_100, 1_000, 10_000);
    assert!(fee == 100, 0);
    assert!(net == 1_000, 0);
}

// ─────────────────────────────────────────────
// first_deposit helper
// ─────────────────────────────────────────────

#[test]
fun is_first_deposit_true_when_zero_shares() {
    assert!(shares::is_first_deposit(0), 0);
}

#[test]
fun is_first_deposit_false_when_shares_exist() {
    assert!(!shares::is_first_deposit(1), 0);
}

// ─────────────────────────────────────────────
// Abort paths — guard conditions
// ─────────────────────────────────────────────

#[test, expected_failure(abort_code = shares::EZeroDeposit)]
fun deposit_zero_amount_aborts() {
    shares::shares_for_deposit(0, 100, 100);
    abort 0
}

#[test, expected_failure(abort_code = shares::EZeroAssets)]
fun deposit_with_shares_but_no_assets_aborts() {
    // total_shares > 0 but total_assets == 0 → invariant violation.
    shares::shares_for_deposit(100, 0, 100);
    abort 0
}

#[test, expected_failure(abort_code = shares::EZeroSharesBurn)]
fun withdraw_zero_shares_aborts() {
    shares::assets_for_shares(0, 100, 100);
    abort 0
}

#[test, expected_failure(abort_code = shares::EZeroShares)]
fun withdraw_with_no_supply_aborts() {
    shares::assets_for_shares(1, 100, 0);
    abort 0
}

#[test, expected_failure(abort_code = shares::ESharesExceedSupply)]
fun withdraw_more_than_supply_aborts() {
    shares::assets_for_shares(101, 100, 100);
    abort 0
}
