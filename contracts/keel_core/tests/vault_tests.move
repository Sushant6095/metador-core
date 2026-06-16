// vault_tests.move — Vault four-walls + deposit/withdraw/revoke tests.
//
// Structure mirrors agent_mandate_tests.move: every abort path has a named
// test, helpers use real deepbook BalanceManager + TradeCap objects.
// Deposit/withdraw use vault_for_testing helpers that bypass BM identity
// checks for pure accounting tests; wall tests exercise assert_and_debit
// directly (same approach as the spike).
#[test_only]
module agent_mandate::vault_tests;

use agent_mandate::vault as v;
use deepbook::balance_manager;
use sui::clock;
use sui::test_scenario as ts;

const OWNER: address  = @0xA11CE;
const LEADER: address = @0xA9E27;
const ATTACKER: address = @0xBAD;
const MAYA: address   = @0xAAAA;
const LEO: address    = @0xBBBB;

const POOL: address       = @0x900D;
const WRONG_POOL: address = @0xEC11;

const BUDGET:  u64 = 500_000_000;   // 500 USDC (6 dec)
const PRICE:   u64 = 3_500_000;     // 3.50 USDC/SUI in deepbook units
const QTY:     u64 = 100_000_000_000; // 100 SUI (9 dec)
const EXPIRY:  u64 = 1_000_000;
const NOW:     u64 = 1_000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

fun setup(scenario: &mut ts::Scenario): (v::Vault, ID) {
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let vault = v::new_for_testing(
        cap,
        bm_id,
        OWNER,
        LEADER,
        object::id_from_address(POOL),
        BUDGET,
        EXPIRY,
        scenario.ctx(),
    );
    transfer::public_transfer(bm, OWNER);
    (vault, bm_id)
}

fun teardown(vault: v::Vault) {
    let cap = v::destroy_for_testing(vault);
    transfer::public_transfer(cap, OWNER);
}

// ─────────────────────────────────────────────
// Four-walls: assert_and_debit (mirrors spike tests 1-1 style)
// ─────────────────────────────────────────────

#[test]
fun wall_debits_and_accumulates() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    let committed = v::assert_and_debit_for_testing(
        &mut vault,
        object::id_from_address(POOL),
        bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    // 100 SUI * 3.50 USDC = 350 USDC = 350_000_000 base units
    assert!(committed == 350_000_000, 0);
    assert!(vault.spent_quote() == 350_000_000, 0);
    assert!(vault.budget_quote() == BUDGET, 0);

    teardown(vault);
    scenario.end();
}

#[test, expected_failure(abort_code = v::EBudgetExceeded)]
fun wall_budget_ceiling_aborts_second_order() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    // 350 + 350 = 700 > 500 → chain refuses
    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    abort 0
}

#[test, expected_failure(abort_code = v::ERevoked)]
fun wall_revoked_aborts_order() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    v::revoke(&mut vault, scenario.ctx()); // sender = OWNER
    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    abort 0
}

#[test, expected_failure(abort_code = v::EExpired)]
fun wall_expired_aborts_order() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    // now_ms == expiry_ms → expired (strict less-than in the assert)
    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), bm_id,
        PRICE, QTY, EXPIRY, LEADER,
    );
    abort 0
}

#[test, expected_failure(abort_code = v::EWrongPool)]
fun wall_wrong_pool_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(WRONG_POOL), bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    abort 0
}

#[test, expected_failure(abort_code = v::ENotExecutor)]
fun wall_non_leader_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, ATTACKER,
    );
    abort 0
}

#[test, expected_failure(abort_code = v::EWrongBalanceManager)]
fun wall_wrong_bm_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _bm_id) = setup(&mut scenario);

    let wrong_bm_id = object::id_from_address(@0xDEAD);
    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), wrong_bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    abort 0
}

// ─────────────────────────────────────────────
// Owner sovereignty
// ─────────────────────────────────────────────

#[test, expected_failure(abort_code = v::ENotOwner)]
fun leader_cannot_revoke() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    scenario.next_tx(LEADER);
    v::revoke(&mut vault, scenario.ctx()); // sender = LEADER → refused
    abort 0
}

#[test]
fun owner_reclaims_cap_after_revoke_empty_vault() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    v::revoke(&mut vault, scenario.ctx());
    assert!(vault.is_revoked(), 0);

    // Vault is empty (no shares), reclaim succeeds.
    let cap = v::reclaim_trade_cap(vault, scenario.ctx());
    transfer::public_transfer(cap, OWNER);
    scenario.end();
}

#[test, expected_failure(abort_code = v::ENotRevoked)]
fun reclaim_before_revoke_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (vault, _) = setup(&mut scenario);

    // Not revoked → reclaim aborts.
    let _cap = v::reclaim_trade_cap(vault, scenario.ctx());
    abort 0
}

#[test, expected_failure(abort_code = v::EVaultNotEmpty)]
fun reclaim_with_outstanding_shares_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    // Deposit some shares.
    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    v::revoke(&mut vault, scenario.ctx());
    // Vault has shares → reclaim aborts.
    let _cap = v::reclaim_trade_cap(vault, scenario.ctx());
    abort 0
}

// ─────────────────────────────────────────────
// Deposit flow
// ─────────────────────────────────────────────

#[test]
fun deposit_first_is_one_to_one() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());
    assert!(vault.total_shares() == 1_000, 0);
    assert!(vault.total_assets() == 1_000, 0);
    let (shares, cost) = vault.depositor_record(MAYA);
    assert!(shares == 1_000, 0);
    assert!(cost == 1_000, 0);

    let cap = v::destroy_with_depositors_for_testing(vault, vector[MAYA]);
    transfer::public_transfer(cap, OWNER);
    scenario.end();
}

#[test]
fun deposit_two_depositors_proportional() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());
    v::deposit_for_testing(&mut vault, 1_000, LEO, scenario.ctx());

    // Both deposited at same NAV → equal shares.
    assert!(vault.total_shares() == 2_000, 0);
    assert!(vault.total_assets() == 2_000, 0);
    let (maya_shares, _) = vault.depositor_record(MAYA);
    let (leo_shares, _)  = vault.depositor_record(LEO);
    assert!(maya_shares == 1_000, 0);
    assert!(leo_shares == 1_000, 0);

    let cap = v::destroy_with_depositors_for_testing(vault, vector[MAYA, LEO]);
    transfer::public_transfer(cap, OWNER);
    scenario.end();
}

#[test]
fun deposit_second_at_higher_nav_fewer_shares() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    // Maya first at 1:1.
    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    // Simulate NAV rise: vault now has 1_120 assets, 1_000 shares.
    v::set_total_assets_for_testing(&mut vault, 1_120);

    // Leo deposits 1_120 → 1_120 * 1_000 / 1_120 = 1_000 shares.
    v::deposit_for_testing(&mut vault, 1_120, LEO, scenario.ctx());
    let (leo_shares, leo_cost) = vault.depositor_record(LEO);
    assert!(leo_shares == 1_000, 0);
    assert!(leo_cost == 1_120, 0);

    let cap = v::destroy_with_depositors_for_testing(vault, vector[MAYA, LEO]);
    transfer::public_transfer(cap, OWNER);
    scenario.end();
}

#[test, expected_failure(abort_code = v::EZeroAmount)]
fun deposit_zero_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, _) = setup(&mut scenario);

    v::deposit_for_testing(&mut vault, 0, MAYA, scenario.ctx());
    abort 0
}

// ─────────────────────────────────────────────
// Withdraw flow
// ─────────────────────────────────────────────

#[test]
fun withdraw_all_no_profit_no_fee() {
    let mut scenario = ts::begin(OWNER);

    // Build a vault + BM pair; deposit then withdraw in the same test.
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap, bm_id, OWNER, LEADER,
        object::id_from_address(POOL), BUDGET, EXPIRY, scenario.ctx(),
    );

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    // No NAV change → gross == cost_basis, no fee.
    scenario.next_tx(MAYA);
    let (gross, fee, net) = vault.withdraw(&bm, 1_000, scenario.ctx());
    assert!(gross == 1_000, 0);
    assert!(fee == 0, 0);
    assert!(net == 1_000, 0);
    assert!(vault.total_shares() == 0, 0);
    assert!(vault.total_assets() == 0, 0);

    // Depositor record removed on full withdrawal → vault table is empty.
    transfer::public_transfer(bm, OWNER);
    let cap2 = v::destroy_for_testing(vault);
    transfer::public_transfer(cap2, OWNER);
    scenario.end();
}

#[test]
fun canonical_maya_withdraw_with_profit() {
    // Full Maya canonical: 1,000 → NAV +12% → withdraw 1,120 gross,
    // fee = 12, net = 1,108.
    let mut scenario = ts::begin(OWNER);

    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap, bm_id, OWNER, LEADER,
        object::id_from_address(POOL), BUDGET, EXPIRY, scenario.ctx(),
    );

    // Maya deposits 1,000.
    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    // Simulate 12% NAV rise: total_assets becomes 1_120.
    v::set_total_assets_for_testing(&mut vault, 1_120);

    // Maya withdraws all 1,000 shares.
    scenario.next_tx(MAYA);
    let (gross, fee, net) = vault.withdraw(&bm, 1_000, scenario.ctx());

    assert!(gross == 1_120, 0);
    assert!(fee == 12, 0);  // 10% of 120 profit
    assert!(net == 1_108, 0);
    assert!(vault.total_shares() == 0, 0);
    // total_assets = 1_120 - 1_120 = 0
    assert!(vault.total_assets() == 0, 0);

    transfer::public_transfer(bm, OWNER);
    let cap2 = v::destroy_for_testing(vault);
    transfer::public_transfer(cap2, OWNER);
    scenario.end();
}

#[test, expected_failure(abort_code = v::EInsufficientShares)]
fun withdraw_more_than_held_aborts() {
    let mut scenario = ts::begin(OWNER);
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap, bm_id, OWNER, LEADER,
        object::id_from_address(POOL), BUDGET, EXPIRY, scenario.ctx(),
    );

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    scenario.next_tx(MAYA);
    let (_g, _f, _n) = vault.withdraw(&bm, 1_001, scenario.ctx());
    abort 0
}

#[test, expected_failure(abort_code = v::EInsufficientShares)]
fun withdraw_by_non_depositor_aborts() {
    let mut scenario = ts::begin(OWNER);
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap, bm_id, OWNER, LEADER,
        object::id_from_address(POOL), BUDGET, EXPIRY, scenario.ctx(),
    );

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    // LEO has no shares — should abort.
    scenario.next_tx(LEO);
    let (_g, _f, _n) = vault.withdraw(&bm, 100, scenario.ctx());
    abort 0
}

#[test, expected_failure(abort_code = v::EZeroAmount)]
fun withdraw_zero_shares_aborts() {
    let mut scenario = ts::begin(OWNER);
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap, bm_id, OWNER, LEADER,
        object::id_from_address(POOL), BUDGET, EXPIRY, scenario.ctx(),
    );

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());
    scenario.next_tx(MAYA);
    let (_g, _f, _n) = vault.withdraw(&bm, 0, scenario.ctx());
    abort 0
}

// ─────────────────────────────────────────────
// Revoke blocks new orders but not withdrawals
// ─────────────────────────────────────────────

#[test]
fun revoke_does_not_block_existing_depositors() {
    // Depositors may always withdraw regardless of revocation state.
    let mut scenario = ts::begin(OWNER);
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap, bm_id, OWNER, LEADER,
        object::id_from_address(POOL), BUDGET, EXPIRY, scenario.ctx(),
    );

    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());
    v::revoke(&mut vault, scenario.ctx()); // owner revokes

    scenario.next_tx(MAYA);
    // withdraw should NOT check revoked flag.
    let (gross, fee, net) = vault.withdraw(&bm, 1_000, scenario.ctx());
    assert!(gross == 1_000, 0);
    assert!(fee == 0, 0);
    assert!(net == 1_000, 0);

    transfer::public_transfer(bm, OWNER);
    let cap2 = v::destroy_for_testing(vault);
    transfer::public_transfer(cap2, OWNER);
    scenario.end();
}

#[test, expected_failure(abort_code = v::ERevoked)]
fun revoke_then_order_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut vault, bm_id) = setup(&mut scenario);

    v::revoke(&mut vault, scenario.ctx());
    // After revoke, assert_and_debit must abort ERevoked.
    v::assert_and_debit_for_testing(
        &mut vault, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, LEADER,
    );
    abort 0
}

// ─────────────────────────────────────────────
// HIGH-1: expiry_ms == 0 rejected at creation (EZeroExpiry)
// ─────────────────────────────────────────────

#[test, expected_failure(abort_code = v::EZeroExpiry)]
fun create_vault_zero_expiry_aborts() {
    let mut scenario = ts::begin(OWNER);
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());

    // expiry_ms = 0 → must abort EZeroExpiry before sharing the vault.
    v::create_vault(
        cap,
        &bm,
        LEADER,
        object::id_from_address(POOL),
        BUDGET,
        0,    // max_order_quote
        0,    // expiry_ms = 0 → EZeroExpiry
        0,    // crank_fee_quote
        scenario.ctx(),
    );

    transfer::public_transfer(bm, OWNER);
    scenario.end();
    abort 0
}

// ─────────────────────────────────────────────
// CRITICAL-1 / HIGH-1: deposit EExpired when clock >= expiry_ms
// Exercises the public deposit() path with a real Clock object.
// ─────────────────────────────────────────────

#[test, expected_failure(abort_code = v::EExpired)]
fun deposit_expired_aborts() {
    let mut scenario = ts::begin(OWNER);

    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap,
        bm_id,
        OWNER,
        LEADER,
        object::id_from_address(POOL),
        BUDGET,
        EXPIRY,   // expiry_ms = 1_000_000
        scenario.ctx(),
    );

    // Clock at exactly expiry_ms → strict less-than fails → EExpired.
    let mut ck = clock::create_for_testing(scenario.ctx());
    ck.set_for_testing(EXPIRY);

    v::deposit(&mut vault, &bm, 1_000, &ck, scenario.ctx());

    ck.destroy_for_testing();
    transfer::public_transfer(bm, OWNER);
    let cap2 = v::destroy_for_testing(vault);
    transfer::public_transfer(cap2, OWNER);
    scenario.end();
    abort 0
}

// ─────────────────────────────────────────────
// MEDIUM: depositor record cleaned up on full withdraw → reclaim succeeds
// Proves destroy_empty() is safe after the last depositor withdraws.
// ─────────────────────────────────────────────

#[test]
fun reclaim_after_full_withdraw_depositor_record_cleaned() {
    let mut scenario = ts::begin(OWNER);

    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mut vault = v::new_for_testing(
        cap,
        bm_id,
        OWNER,
        LEADER,
        object::id_from_address(POOL),
        BUDGET,
        EXPIRY,
        scenario.ctx(),
    );

    // Maya deposits.
    v::deposit_for_testing(&mut vault, 1_000, MAYA, scenario.ctx());

    // Maya withdraws all shares.
    scenario.next_tx(MAYA);
    let (_g, _f, _n) = vault.withdraw(&bm, 1_000, scenario.ctx());

    // Vault is empty; depositor record must have been removed.
    let (shares, _) = vault.depositor_record(MAYA);
    assert!(shares == 0, 0);
    assert!(vault.total_shares() == 0, 0);

    // Owner can now revoke and reclaim — destroy_empty() must succeed.
    scenario.next_tx(OWNER);
    v::revoke(&mut vault, scenario.ctx());
    let cap2 = v::reclaim_trade_cap(vault, scenario.ctx());

    transfer::public_transfer(bm, OWNER);
    transfer::public_transfer(cap2, OWNER);
    scenario.end();
}
