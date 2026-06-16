import { describe, expect, test } from 'vitest';
import { METADOR_EVENTS } from './events';

describe('METADOR_EVENTS registry', () => {
  test('event names are snake_case and unique', () => {
    const names = Object.values(METADOR_EVENTS);
    for (const name of names) {
      expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  test('bootstrap Phase G first-events set is present', () => {
    expect(Object.values(METADOR_EVENTS)).toEqual(
      expect.arrayContaining([
        'page_view',
        'wallet_connected',
        'vault_viewed',
        'deposit_started',
        'waitlist_joined',
      ]),
    );
  });
});
