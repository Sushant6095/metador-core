// Enforcement proofs. Every abort path in the mandate, tested against a REAL
// deepbook BalanceManager + TradeCap (both creatable without a Pool).
// `sui move test` green here == build-plan step 2 done.
#[test_only]
module agent_mandate::agent_mandate_tests;

use agent_mandate::agent_mandate as am;
use deepbook::balance_manager;
use sui::test_scenario as ts;

const OWNER: address = @0xA11CE;
const AGENT: address = @0xA9E27;
const ATTACKER: address = @0xBAD;

const POOL: address = @0x900D;
const WRONG_POOL: address = @0xEC11;

// 500 USDC budget (6 decimals), price 3.50 USDC/SUI in deepbook units (1e6),
// qty 100 SUI (1e9 units) -> notional 350 USDC per order.
const BUDGET: u64 = 500_000_000;
const PRICE: u64 = 3_500_000;
const QTY: u64 = 100_000_000_000;
const EXPIRY: u64 = 1_000_000;
const NOW: u64 = 1_000;

// --- helpers ---
fun setup(scenario: &mut ts::Scenario): (am::AgentMandate, ID) {
    let mut bm = balance_manager::new(scenario.ctx());
    let cap = bm.mint_trade_cap(scenario.ctx());
    let bm_id = object::id(&bm);
    let mandate = am::new_for_testing(
        cap,
        bm_id,
        OWNER,
        AGENT,
        object::id_from_address(POOL),
        BUDGET,
        EXPIRY,
        scenario.ctx(),
    );
    transfer::public_transfer(bm, OWNER);
    (mandate, bm_id)
}

fun teardown(mandate: am::AgentMandate) {
    let cap = am::destroy_for_testing(mandate);
    transfer::public_transfer(cap, OWNER);
}

// --- the four walls ---

#[test]
fun debits_quote_notional_and_accumulates() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, bm_id) = setup(&mut scenario);

    let committed = am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, AGENT,
    );
    assert!(committed == 350_000_000); // 100 * 3.50 in 6-decimal quote units
    assert!(mandate.spent_quote() == 350_000_000);
    assert!(mandate.budget_quote() == BUDGET);

    teardown(mandate);
    scenario.end();
}

#[test, expected_failure(abort_code = am::EBudgetExceeded)]
fun budget_ceiling_aborts_second_order() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, bm_id) = setup(&mut scenario);

    // 350 OK, 350 + 350 = 700 > 500 -> the chain refuses.
    am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, AGENT,
    );
    am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, AGENT,
    );
    abort 0
}

#[test, expected_failure(abort_code = am::ERevoked)]
fun revoked_mandate_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, bm_id) = setup(&mut scenario);

    am::revoke(&mut mandate, scenario.ctx()); // sender is OWNER
    am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, AGENT,
    );
    abort 0
}

#[test, expected_failure(abort_code = am::EExpired)]
fun expired_mandate_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, bm_id) = setup(&mut scenario);

    am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(POOL), bm_id,
        PRICE, QTY, EXPIRY, AGENT, // now == expiry -> dead
    );
    abort 0
}

#[test, expected_failure(abort_code = am::EWrongPool)]
fun out_of_scope_pool_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, bm_id) = setup(&mut scenario);

    am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(WRONG_POOL), bm_id,
        PRICE, QTY, NOW, AGENT,
    );
    abort 0
}

#[test, expected_failure(abort_code = am::ENotAgent)]
fun non_agent_sender_aborts() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, bm_id) = setup(&mut scenario);

    am::assert_and_debit_for_testing(
        &mut mandate, object::id_from_address(POOL), bm_id,
        PRICE, QTY, NOW, ATTACKER,
    );
    abort 0
}

// --- owner sovereignty ---

#[test, expected_failure(abort_code = am::ENotOwner)]
fun agent_cannot_revoke() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, _bm_id) = setup(&mut scenario);

    scenario.next_tx(AGENT);
    am::revoke(&mut mandate, scenario.ctx()); // sender is AGENT -> refused
    abort 0
}

#[test]
fun owner_reclaims_cap_after_revoke() {
    let mut scenario = ts::begin(OWNER);
    let (mut mandate, _bm_id) = setup(&mut scenario);

    am::revoke(&mut mandate, scenario.ctx());
    assert!(mandate.is_revoked());
    let cap = am::reclaim_trade_cap(mandate, scenario.ctx());
    transfer::public_transfer(cap, OWNER);
    scenario.end();
}
