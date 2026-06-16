# Testnet IDs

All addresses below are verified against the DeepBook v3 `main` branch SDK constants and cross-checked on-chain on 2026-06-10/11. Re-verify before any mainnet deployment.

## DeepBook v3 — Sui testnet

| Object | ID |
|---|---|
| DeepBook package (latest / published-at) | `0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c` |
| DeepBook package (original / type-origin) | `0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982` |
| Registry | `0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1` |
| Pool: DEEP/SUI | `0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f` |
| Pool: SUI/DBUSDC | `0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5` |
| DEEP token package | `0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8` |
| Clock | `0x6` |

## Token Move types

| Token | Move type |
|---|---|
| DEEP | `0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP` |
| SUI | `0x2::sui::SUI` |

## Pool notes

The DEEP/SUI pool is whitelisted (zero-fee) on testnet, making it suitable for the initial spike because no DEEP fee tokens are required. The SUI/DBUSDC pool is the production-story pool ("500 USDC budget ceiling") used once testnet DBUSDC and DEEP fee tokens are sourced.

## Shell exports (for use with `sui client ptb`)

```bash
export DEEPBOOK=0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c
export REGISTRY=0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1
export POOL_DEEP_SUI=0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f
export POOL_SUI_DBUSDC=0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5
export DEEP_TYPE=0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP
export SUI_TYPE=0x2::sui::SUI
export CLOCK=0x6
```

## Source

`packages/deepbook/src/constants.ts` is the authoritative source. If the table above diverges from that file, update this page to match.

## Next

[Running the Spike](running-the-spike.md) — end-to-end steps to publish `keel_core` and place a live testnet order.
