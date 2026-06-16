# Gates and Timeline

Metador ships in named gates. Dates for G1–G3 are fixed by external commitments (hackathon calendar). G4 is open-ended. Features that miss a gate move to the next one — nothing ships mediocre to meet a date.

## G1 — June 21, 2026 (hackathon submission)

Target: a working, demonstrable product on Sui testnet.

- `keel_core` Move package: Vault, Policy, Delegate and DCA strategies, shares/NAV, events
- Marketplace: browse vaults, read policy cards
- Vault detail: policy card, budget meter, live activity feed including rejected attempts
- Create Vault wizard: full policy authoring, dryRun preview, one-signature publish
- Leader cockpit: place and monitor orders through the policy-gated interface
- Portfolio: depositor share balance, current NAV value, withdraw
- Safety page: plain-English explanation of the four walls
- Cranker service: DCA tick execution, live on a free cron schedule
- Demo wallets and testnet book liquidity seeded
- 4-minute demo video: hook (Drift incident + strategy drift), create vault, live trade, red-team stolen key, revoke, roadmap
- Public repository, README, submission filed

## G2 — July 8 shortlist / July 20–21 Demo Day

Target: differentiation and Demo Day readiness.

- Mirror copy-trading: follow any on-chain account, not just Metador vaults (a feature Hyperliquid cannot build on a permission-required model)
- Leaderboard and trader profiles
- Oracle-free stop-loss and TWAP cranks
- Landing site and waitlist, polished to benchmark grade
- Enoki/zkLogin onboarding (DECIDE-004 if spike passes)
- Demo Day rehearsal runs

## G3 — August 2026

Target: guarded mainnet.

- External security review: two OtterSec/OpenZeppelin office-hour sessions
- Hard caps enforced in Move: $500 per vault, $5,000 global
- Fees off at mainnet launch
- Performance and CLS pass
- GitBook docs published
- Analytics dashboards live
- Mainnet deploy triggers the remaining 50% of any hackathon prize

## G4 — Beyond mainnet

Target: the consumer margin layer and marketplace expansion. No date commitment.

- Margin venue: leveraged vaults using DeepBook Margin SDK, health factor and liquidation price always visible on open positions, full `/risk-review` sign-off before ship
- Predict venue: yield-only protected vaults using DeepBook Predict
- Strategy marketplace: discoverable strategies, follower-side filtering
- Fee switch: governance-controlled platform fee

---

*These are target dates, not guarantees. Mainnet requires external review sign-off and founder approval in the decision log. No earnings promises are made for any gate.*

## Next

[Architecture](developers/architecture.md) — how the on-chain objects fit together.
