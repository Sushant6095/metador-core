/**
 * Metador analytics event registry — THE only place event names exist
 * (CLAUDE.md §11 sync contracts). Apps import from here; never inline
 * an event name. Growth agent owns additions.
 */
export const METADOR_EVENTS = {
  /** Any route render, both apps. Props: { app, path } */
  pageView: 'page_view',
  /** Wallet session established. Props: { wallet_name, network } */
  walletConnected: 'wallet_connected',
  /** Vault detail opened. Props: { vault_id } */
  vaultViewed: 'vault_viewed',
  /** Deposit flow entered (NOT completed). Props: { vault_id } */
  depositStarted: 'deposit_started',
  /** Leader capability revoked (confirmed on-chain). Props: { vault_id } */
  vaultRevoked: 'vault_revoked',
  /** Waitlist signup on the main site. Props: { source } */
  waitlistJoined: 'waitlist_joined',
} as const;

export type MetadorEventKey = keyof typeof METADOR_EVENTS;
export type MetadorEventName = (typeof METADOR_EVENTS)[MetadorEventKey];
