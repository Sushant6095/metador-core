// shares.move — Pure math for Keel vault share accounting.
//
// Design:
//   shares represent fractional ownership of the vault's total assets.
//   NAV (net asset value per share) = total_assets / total_shares.
//
//   deposit:  new_shares = amount * total_shares / total_assets
//             first deposit (total_shares == 0): new_shares = amount (1:1)
//
//   withdraw: assets_out = shares * total_assets / total_shares
//
//   fee:      assessed only on POSITIVE realised PnL at withdrawal:
//             profit = assets_out - cost_basis   (if profit <= 0, fee = 0)
//             fee    = profit * fee_bps / 10_000
//
// Rounding rule (stated in every division):
//   Every integer division that could shortchange the vault rounds DOWN for
//   the depositor and thus truncates in favour of remaining share-holders.
//   This is the invariant: total_assets_owed_to_all_withdrawers <=
//   actual_total_assets at every moment.
//
// All values are u64 base units (6-decimal quote token, e.g. DBUSDC).
// Intermediate arithmetic uses u128 to avoid overflow before the final cast.
// No objects — every function is pure and side-effect free.
module agent_mandate::shares;

// === Error codes ===
/// Guard: total_assets must be > 0 when total_shares > 0.
const EZeroAssets: u64 = 20;
/// Guard: total_shares must be > 0 when total_assets > 0.
const EZeroShares: u64 = 21;
/// Guard: deposit amount must be > 0.
const EZeroDeposit: u64 = 22;
/// Guard: shares_to_burn must be > 0.
const EZeroSharesBurn: u64 = 23;
/// Guard: shares_to_burn must not exceed total_shares.
const ESharesExceedSupply: u64 = 24;

// === Deposit math ===

/// Compute shares minted for `amount` deposited into a vault.
///
/// total_assets = vault's current quote balance BEFORE this deposit.
/// total_shares = current total supply of shares.
///
/// Case 1 — first deposit (total_shares == 0): 1:1, new_shares = amount.
/// Case 2 — subsequent: new_shares = amount * total_shares / total_assets
///          Division truncates (rounds down for depositor → up for vault).
///
/// Aborts:
///   EZeroDeposit  if amount == 0
///   EZeroAssets   if total_shares > 0 but total_assets == 0 (invariant
///                 violation — vault has shares outstanding against no assets)
public fun shares_for_deposit(
    amount: u64,
    total_assets: u64,
    total_shares: u64,
): u64 {
    assert!(amount > 0, EZeroDeposit);

    if (total_shares == 0) {
        // First depositor: shares = amount (1:1, no existing NAV to dilute).
        return amount
    };

    // total_shares > 0 implies there must be assets backing those shares.
    assert!(total_assets > 0, EZeroAssets);

    // new_shares = amount * total_shares / total_assets
    // Rounds DOWN — favour vault over depositor.
    let num = (amount as u128) * (total_shares as u128);
    let result = num / (total_assets as u128);
    (result as u64)
}

// === Withdrawal math ===

/// Compute quote assets returned for burning `shares_to_burn`.
///
/// assets_out = shares_to_burn * total_assets / total_shares
/// Division truncates (rounds DOWN for withdrawer → favour remaining holders).
///
/// Aborts:
///   EZeroSharesBurn      if shares_to_burn == 0
///   EZeroShares          if total_shares == 0 (no shares outstanding)
///   ESharesExceedSupply  if shares_to_burn > total_shares
public fun assets_for_shares(
    shares_to_burn: u64,
    total_assets: u64,
    total_shares: u64,
): u64 {
    assert!(shares_to_burn > 0, EZeroSharesBurn);
    assert!(total_shares > 0, EZeroShares);
    assert!(shares_to_burn <= total_shares, ESharesExceedSupply);

    // assets_out = shares_to_burn * total_assets / total_shares
    // Rounds DOWN — remaining share-holders cannot be shortchanged.
    let num = (shares_to_burn as u128) * (total_assets as u128);
    let result = num / (total_shares as u128);
    (result as u64)
}

// === Fee math ===

/// Compute the performance fee owed on a withdrawal.
///
/// fee_bps   — basis points charged to the leader on realised profit
///             (1000 bps = 10 %).
/// assets_out — gross assets returned (output of assets_for_shares).
/// cost_basis — the depositor's original deposit amount.
///
/// If assets_out <= cost_basis the trade lost money; no fee is charged.
/// Otherwise: fee = (assets_out - cost_basis) * fee_bps / 10_000
/// Division truncates (rounds DOWN) — leader gets slightly less, depositor
/// keeps the dust. Invariant: depositor_net >= cost_basis when profitable.
///
/// Returns (fee_amount, depositor_net):
///   fee_amount    = what the leader receives
///   depositor_net = assets_out - fee_amount
public fun fee_on_profit(
    assets_out: u64,
    cost_basis: u64,
    fee_bps: u64,
): (u64, u64) {
    if (assets_out <= cost_basis) {
        // No profit → no fee. Depositor receives everything.
        return (0, assets_out)
    };

    let profit = assets_out - cost_basis;
    // fee = profit * fee_bps / 10_000  (truncates → favour depositor)
    let fee = (((profit as u128) * (fee_bps as u128)) / 10_000u128) as u64;
    let depositor_net = assets_out - fee;
    (fee, depositor_net)
}

// === View helpers (no-abort convenience) ===

/// Returns true when a vault has no shares issued yet (first-deposit state).
public fun is_first_deposit(total_shares: u64): bool {
    total_shares == 0
}

// === Error accessors for tests ===
public fun e_zero_assets(): u64  { EZeroAssets }
public fun e_zero_shares(): u64  { EZeroShares }
public fun e_zero_deposit(): u64 { EZeroDeposit }
public fun e_zero_shares_burn(): u64 { EZeroSharesBurn }
public fun e_shares_exceed_supply(): u64 { ESharesExceedSupply }
