/**
 * DeepBook v3 testnet anchors — verified against deepbookv3 `main` and the
 * official SDK constants on 2026-06-10 (SPIKE-RUNBOOK.md), original ids
 * cross-checked live on 2026-06-11 (registry type-origin + token Move.lock).
 *
 * `@mysten/sui` / DeepBook SDK wrappers land in G1; until then this package
 * holds only chain constants and pure helpers.
 */
export const DEEPBOOK_TESTNET = {
  /** Latest published package (use for calls / published-at). */
  PACKAGE: '0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c',
  /** Original (type-origin) package id — types resolve against this. */
  PACKAGE_ORIGINAL:
    '0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982',
  REGISTRY: '0x7c256edbda983a2cd6f946655f4bf3f00a41043993781f8674a7046e8c0e11d1',
  POOL_DEEP_SUI:
    '0x48c95963e9eac37a316b7ae04a0deb761bcdcc2b67912374d6036e7f0e9bae9f',
  POOL_SUI_DBUSDC:
    '0x1c19362ca52b8ffd7a33cee805a67d40f31e6ba303753fd3a4cfdfacea7163a5',
  /** DEEP token package — original = latest (v1, never upgraded). */
  TOKEN_PACKAGE:
    '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8',
  DEEP_TYPE:
    '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
  SUI_TYPE: '0x2::sui::SUI',
  CLOCK: '0x6',
} as const;
