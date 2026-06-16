#!/usr/bin/env bash
# Reproduces SPIKE-RUNBOOK.md §3B from a clean checkout: vendors deepbookv3
# at the pinned commit and applies the testnet publish pins that the git
# dependency lacks. Required before `sui move build/test/publish` in
# contracts/keel_core. Idempotent.
set -euo pipefail

CONTRACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$CONTRACTS_DIR/deepbookv3"
REPO=https://github.com/MystenLabs/deepbookv3
COMMIT=e276939f0613b98d8dcfa818ada3612dbbeb386b

# Testnet ids — sources: SPIKE-RUNBOOK.md constants (latest deepbook),
# Registry object type-origin (original deepbook), token Move.lock (token).
DEEPBOOK_LATEST=0x22be4cade64bf2d02412c7e8d0e8beea2f78828b948118d46735315409371a3c
DEEPBOOK_ORIGINAL=0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982
TOKEN_ID=0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8

DEEPBOOK_TOML="$DEST/packages/deepbook/Move.toml"
TOKEN_TOML="$DEST/packages/token/Move.toml"

if grep -q "published-at" "$DEEPBOOK_TOML" 2>/dev/null; then
  echo "setup-deepbook: already pinned at $DEST — nothing to do"
  exit 0
fi

if [ ! -d "$DEST/.git" ]; then
  echo "setup-deepbook: fetching deepbookv3 @ $COMMIT"
  mkdir -p "$DEST"
  git -C "$DEST" init -q
  git -C "$DEST" remote add origin "$REPO"
  git -C "$DEST" fetch -q --depth 1 origin "$COMMIT"
  git -C "$DEST" checkout -q FETCH_HEAD
fi

echo "setup-deepbook: pinning deepbook ($DEEPBOOK_LATEST / $DEEPBOOK_ORIGINAL)"
perl -pi -e "s/^version = \"0\\.0\\.1\"$/version = \"0.0.1\"\npublished-at = \"$DEEPBOOK_LATEST\"/" "$DEEPBOOK_TOML"
perl -pi -e "s/^deepbook = \"0x0\"$/deepbook = \"$DEEPBOOK_ORIGINAL\"/" "$DEEPBOOK_TOML"
perl -pi -e 's/^token = \{ git =.*$/token = { local = "..\/token" }/' "$DEEPBOOK_TOML"

echo "setup-deepbook: pinning token ($TOKEN_ID)"
perl -pi -e "s/^edition = \"2024\\.beta\"$/edition = \"2024.beta\"\npublished-at = \"$TOKEN_ID\"/" "$TOKEN_TOML"
perl -pi -e "s/^token = \"0x0\"$/token = \"$TOKEN_ID\"/" "$TOKEN_TOML"

grep -q "published-at = \"$DEEPBOOK_LATEST\"" "$DEEPBOOK_TOML"
grep -q "published-at = \"$TOKEN_ID\"" "$TOKEN_TOML"
echo "setup-deepbook: done — keel_core can now build/test/publish"
