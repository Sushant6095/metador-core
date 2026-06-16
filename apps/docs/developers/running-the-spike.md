# Running the Spike

This walkthrough proves the core claim: a custom Move module can hold a `TradeCap`, pass through the four policy walls, and place a real order on DeepBook testnet. All steps run from a clean checkout.

## Prerequisites

- Sui CLI installed and configured for testnet: `sui client switch --env testnet`
- Node.js 20+ and pnpm
- A funded testnet wallet: `sui client faucet` to get gas

## Clone and build

```bash
git clone <repo-url> keel
cd keel
pnpm install
```

Get testnet gas and create the agent address:

```bash
sui client faucet && sui client gas
sui client new-address ed25519          # this is the AGENT/executor address
export AGENT=<new address>
# give the agent gas only — trading funds come from the BalanceManager, not the agent's wallet
sui client transfer-sui --to $AGENT --amount 200000000 --sui-coin-object-id <a-gas-coin>
```

## Build and test Move locally

```bash
cd contracts/keel_core
sui move build
sui move test
```

Green output means all eight unit tests pass: budget ceiling, revocation, expiry, scope enforcement, agent gating, and owner-only revoke are all verified against real DeepBook types.

## Set up DeepBook dependency (if publish fails)

If `sui client publish` reports an unpublished-dependency error:

```bash
cd contracts
git clone https://github.com/MystenLabs/deepbookv3 ./deepbookv3
```

In `./deepbookv3/packages/deepbook/Move.toml`, set:

```toml
[package]
published-at = "0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c"

[addresses]
deepbook = "0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982"
```

Then update `keel_core/Move.toml` to use `deepbook = { local = "../deepbookv3/packages/deepbook" }` and rebuild.

## Publish keel_core

```bash
cd contracts/keel_core
sui client publish --gas-budget 200000000
export PKG=<published package id from output>
```

Also run the setup script if available:

```bash
bash contracts/scripts/setup-deepbook.sh
```

## Create a BalanceManager and deposit

```bash
sui client ptb \
  --move-call $DEEPBOOK::balance_manager::new --assign bm \
  --split-coins gas "[2000000000]" --assign c \
  --move-call $DEEPBOOK::balance_manager::deposit "<$SUI_TYPE>" bm c.0 \
  --move-call 0x2::transfer::public_share_object "<$DEEPBOOK::balance_manager::BalanceManager>" bm \
  --gas-budget 100000000
export BM=<BalanceManager object id>
```

## Create the vault (mint TradeCap and lock it atomically)

```bash
EXPIRY=$(( $(date +%s) * 1000 + 86400000 ))   # 24 hours from now in milliseconds
sui client ptb \
  --move-call $DEEPBOOK::balance_manager::mint_trade_cap @$BM --assign cap \
  --move-call $PKG::agent_mandate::create_mandate cap @$BM @$AGENT @$POOL_DEEP_SUI 1000000000 $EXPIRY \
  --gas-budget 100000000
export MANDATE=<shared AgentMandate object id>
```

Budget `1000000000` = 1 SUI in base units (quote token for DEEP/SUI pool).

## Place a live order (the spike)

Switch to the agent address and place a bid:

```bash
sui client switch --address $AGENT
# DEEP/SUI price scaling: human_price * 1e12
# Example: bid 100 DEEP @ 0.002 SUI → price=2000000000, qty=100000000 (DEEP has 6 decimals)
sui client ptb \
  --move-call $PKG::agent_mandate::execute_order "<$DEEP_TYPE,$SUI_TYPE>" \
    @$MANDATE @$POOL_DEEP_SUI @$BM 1 2000000000 100000000 true @$CLOCK \
  --gas-budget 100000000
```

Spike passes when: the transaction succeeds, `OrderExecuted` appears in events on [Suiscan testnet](https://suiscan.xyz/testnet/), and `sui client object $MANDATE` shows `spent_quote` debited.

## Rehearse the three demo aborts

```bash
# (a) Budget breach — order notional exceeds remaining budget
sui client ptb --move-call $PKG::agent_mandate::execute_order "<$DEEP_TYPE,$SUI_TYPE>" \
  @$MANDATE @$POOL_DEEP_SUI @$BM 2 2000000000 1000000000000 true @$CLOCK --gas-budget 100000000
# Expected: MoveAbort code 6 (EBudgetExceeded)

# (b) Red team — agent key tries to drain the BalanceManager directly
sui client ptb --move-call $DEEPBOOK::balance_manager::withdraw "<$SUI_TYPE>" \
  @$BM 1000000000 --assign loot \
  --move-call 0x2::transfer::public_transfer "<0x2::coin::Coin<$SUI_TYPE>>" loot @$AGENT \
  --gas-budget 100000000
# Expected: DeepBook abort EInvalidOwner (code 0) — funds untouched

# (c) Revoke then attempt execution
sui client switch --address <owner-address>
sui client ptb --move-call $PKG::agent_mandate::revoke @$MANDATE --gas-budget 50000000
sui client switch --address $AGENT
sui client ptb --move-call $PKG::agent_mandate::execute_order "<$DEEP_TYPE,$SUI_TYPE>" \
  @$MANDATE @$POOL_DEEP_SUI @$BM 3 2000000000 100000000 true @$CLOCK --gas-budget 100000000
# Expected: MoveAbort code 2 (ERevoked)
```

Screenshot all three failures — they are the demo.

## Next

[SDK](sdk.md) — the TypeScript SDK that wraps these calls at G1.
