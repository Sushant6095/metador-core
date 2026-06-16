import { describe, expect, test } from 'vitest';
import { DEEPBOOK_TESTNET } from './constants';

const FULL_ADDRESS = /^0x[0-9a-f]{64}$/;

describe('DEEPBOOK_TESTNET anchors', () => {
  test('object ids are full 32-byte hex addresses', () => {
    const ids = [
      DEEPBOOK_TESTNET.PACKAGE,
      DEEPBOOK_TESTNET.PACKAGE_ORIGINAL,
      DEEPBOOK_TESTNET.REGISTRY,
      DEEPBOOK_TESTNET.POOL_DEEP_SUI,
      DEEPBOOK_TESTNET.POOL_SUI_DBUSDC,
      DEEPBOOK_TESTNET.TOKEN_PACKAGE,
    ];
    for (const id of ids) {
      expect(id).toMatch(FULL_ADDRESS);
    }
  });

  test('DEEP type is anchored to the token package', () => {
    expect(DEEPBOOK_TESTNET.DEEP_TYPE).toBe(
      `${DEEPBOOK_TESTNET.TOKEN_PACKAGE}::deep::DEEP`,
    );
  });

  test('latest and original deepbook package ids differ (upgraded package)', () => {
    expect(DEEPBOOK_TESTNET.PACKAGE).not.toBe(
      DEEPBOOK_TESTNET.PACKAGE_ORIGINAL,
    );
  });
});
