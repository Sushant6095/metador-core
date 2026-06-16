# Day-1 Spike Runbook — `agent_mandate`

Goal: prove a custom Move module can hold a `TradeCap`, generate a `TradeProof`, and place a **real** DeepBook order cross-package on testnet. Everything below uses IDs pulled from deepbookv3 `main` + the official SDK constants on 2026-06-10.

**Source-verified already (no testnet needed):**

| Question | Answer | Where |
|---|---|---|
| Can `TradeCap` live inside our object? | ✅ `has key, store` | `balance_manager.move` |
| Can our module mint a proof? | ✅ `generate_proof_as_trader` is `public` | `balance_manager.move` |
| Can our module place orders? | ✅ `place_limit_order` is `public`, returns `OrderInfo (copy, drop, store)` | `pool.move`, `order_info.move` |
| Can a TradeCap withdraw? | ❌ every withdraw path validates **owner** or a `WithdrawCap` we never mint | `balance_manager.move` |
| Bonus kill switch | `revoke_trade_cap` (owner-only) bricks the cap at DeepBook level too | `balance_manager.move` |

So the spike's only real unknowns are: (a) dependency/publish resolution, (b) live order mechanics (units, fees). That's what today answers.

## Spike pool choice: DEEP/SUI (not SUI/DBUSDC)

For the **spike**, trade `DEEP_SUI`: quote = SUI, so the faucet funds everything, and DEEP-pair pools are the whitelisted (zero-fee) ones — no DEEP needed for fees. The mandate story stays identical ("budget: 1 SUI"). Switch to `SUI_DBUSDC` ("500 USDC" story) in step 3 of the build plan once you've sorted DBUSDC + DEEP fee tokens.

## Constants (testnet, from SDK `constants.ts` @ main)

```bash
export DEEPBOOK=0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c
export REGISTRY=0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1
export POOL_DEEP_SUI=0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f
export POOL_SUI_DBUSDC=0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5
export DEEP_TYPE=0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP
export SUI_TYPE=0x2::sui::SUI
export CLOCK=0x6
```

## 0. Prereqs

```bash
sui client switch --env testnet
sui client faucet && sui client gas          # owner address
sui client new-address ed25519               # AGENT address — save it
export AGENT=0x...                           # the new address
# fund agent with gas only (gas ≠ trading funds — that's the point)
sui client transfer-sui --to $AGENT --amount 200000000 --sui-coin-object-id <a-gas-coin>
```

## 1. Local proof (5 min)

```bash
cd mandate
sui move build
sui move test
```

Green tests = budget ceiling, revocation, expiry, scope, agent-gating, and owner-only revoke are all enforced — against a **real** deepbook `BalanceManager` + `TradeCap`. That's build-plan step 2's "prove enforcement in tests" done on day 1.

NOTE: this package was written against deepbookv3 source but has not been compiled (no sui CLI in the authoring environment). Expect at most minor syntax fixes here, not design fixes.

## 2. Publish

```bash
sui client publish --gas-budget 200000000
export PKG=<published package id>
```

**If publish fails with an unpublished-dependency error (plan 3B):**

```bash
git clone https://github.com/MystenLabs/deepbookv3 ../deepbookv3
# find deepbook's ORIGINAL package id (first-publish address — type origin):
sui client object $REGISTRY --json | jq -r '.data.type'   # prefix = original id
```

In `../deepbookv3/packages/deepbook/Move.toml` set:

```toml
[package]
published-at = "0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c"  # latest
[addresses]
deepbook = "<ORIGINAL id from the registry object type>"
```

and switch our `Move.toml` dependency to `deepbook = { local = "../deepbookv3/packages/deepbook" }`. Rebuild, republish.

## 3. Create BalanceManager + deposit 2 SUI (owner)

```bash
sui client ptb \
  --move-call $DEEPBOOK::balance_manager::new --assign bm \
  --split-coins gas "[2000000000]" --assign c \
  --move-call $DEEPBOOK::balance_manager::deposit "<$SUI_TYPE>" bm c.0 \
  --move-call 0x2::transfer::public_share_object "<$DEEPBOOK::balance_manager::BalanceManager>" bm \
  --gas-budget 100000000
export BM=<BalanceManager id from output>
```

(`deposit` is owner-callable on the not-yet-shared manager inside the same PTB — order matters: deposit before share is simplest.)

## 4. Mint TradeCap → create mandate, ONE PTB (owner)

The cap is born and locked inside the mandate in a single atomic tx — it never exists as a free object anyone could copy or move.

```bash
EXPIRY=$(( $(date +%s) * 1000 + 86400000 ))   # 24h
sui client ptb \
  --move-call $DEEPBOOK::balance_manager::mint_trade_cap @$BM --assign cap \
  --move-call $PKG::agent_mandate::create_mandate cap @$BM @$AGENT @$POOL_DEEP_SUI 1000000000 $EXPIRY \
  --gas-budget 100000000
export MANDATE=<shared AgentMandate id>
```

Budget here: `1000000000` = 1 SUI (quote units of DEEP/SUI).

## 5. THE SPIKE: agent places a real order

```bash
sui client switch --address $AGENT

# DEEP/SUI price units = human_price * 1e12 (FLOAT_SCALING 1e9 * sui_scalar 1e9 / deep_scalar 1e6)
# e.g. bid 100 DEEP @ 0.002 SUI:  price=2000000000, qty=100000000 (DEEP has 6 decimals)
sui client ptb \
  --move-call $PKG::agent_mandate::execute_order "<$DEEP_TYPE,$SUI_TYPE>" \
    @$MANDATE @$POOL_DEEP_SUI @$BM 1 2000000000 100000000 true @$CLOCK \
  --gas-budget 100000000
```

✅ **Spike passes when:** tx succeeds, an `OrderExecuted` event appears (with `OrderPlaced`/`OrderFilled` from deepbook), and `sui client object $MANDATE` shows `spent_quote` debited. Check on https://suiscan.xyz/testnet/.

Likely unit errors and fixes: `EOrderInvalidPrice(0)` → price not a tick multiple; `EOrderBelowMinimumSize(1)` / `EOrderInvalidLotSize(2)` → read `tick_size/lot_size/min_size` off the pool object on Suiscan and adjust. Pick a bid price far below market so the order rests (visible on the book, no fill dependency). If a fee/DEEP-related abort appears, the pool isn't whitelisted as assumed — retry with `pay_with_deep` and a small DEEP deposit, or just confirm `whitelisted` on the pool object.

## 6. Rehearse the three demo aborts (still day 1, 10 min)

```bash
# (a) budget breach — bid notional > remaining budget → MoveAbort code 6 (EBudgetExceeded)
sui client ptb --move-call $PKG::agent_mandate::execute_order "<$DEEP_TYPE,$SUI_TYPE>" \
  @$MANDATE @$POOL_DEEP_SUI @$BM 2 2000000000 1000000000000 true @$CLOCK --gas-budget 100000000

# (b) RED TEAM — agent key tries to drain funds → deepbook aborts EInvalidOwner(0)
sui client ptb --move-call $DEEPBOOK::balance_manager::withdraw "<$SUI_TYPE>" \
  @$BM 1000000000 --assign loot \
  --move-call 0x2::transfer::public_transfer "<0x2::coin::Coin<$SUI_TYPE>>" loot @$AGENT \
  --gas-budget 100000000

# (c) revoke (owner) then any agent call → MoveAbort code 2 (ERevoked)
sui client switch --address <owner>
sui client ptb --move-call $PKG::agent_mandate::revoke @$MANDATE --gas-budget 50000000
sui client switch --address $AGENT
sui client ptb --move-call $PKG::agent_mandate::execute_order "<$DEEP_TYPE,$SUI_TYPE>" \
  @$MANDATE @$POOL_DEEP_SUI @$BM 3 2000000000 100000000 true @$CLOCK --gas-budget 100000000
```

Screenshot all three failures — they ARE the demo. (b) is the 7→9 lever: full key compromise, funds untouched.

## Definition of done (build-plan step 1 + most of step 2)

- [ ] `sui move test` green locally
- [ ] package published to testnet (dependency route A or B noted for the README)
- [ ] one real resting order on DEEP/SUI placed **through the mandate** by the agent key
- [ ] `OrderExecuted` event visible on Suiscan; `spent_quote` debited on the mandate object
- [ ] budget-breach abort, withdraw-attempt abort, revoke abort all reproduced

Next (step 3): same flow on `SUI_DBUSDC` — source DBUSDC + DEEP, re-point the mandate, budget becomes the "500 USDC" of the demo script.
