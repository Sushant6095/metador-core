# Responsibilities

The four walls make certain failures structurally impossible. They do not make poor leadership impossible. This page is direct about the distinction.

## What the chain makes impossible

**Strategy drift.** The scope wall encodes the allowed market at vault creation. A leader cannot move depositor capital into a different market — the chain aborts `EWrongPool` before the order reaches DeepBook. A vault described to depositors as conservative spot trading cannot become a speculative position. The chain prevents it.

**Exceeding the ceiling.** The budget wall ensures the total spent never exceeds the stated ceiling. A leader cannot quietly extend the exposure they described.

**Trading after expiry or revocation.** An expired or revoked vault is inert. No further orders can be placed regardless of the leader's intent.

## What the chain does not prevent

**Trading badly within the walls.** A leader can place limit orders that lose value. They can enter positions poorly, exit late, or misjudge the market. All of this is possible within the allowed pool and under the budget ceiling. Depositor funds can and will decline in value when trades are unprofitable.

**Opaque communication.** The on-chain policy card shows the walls. It does not show a leader's stated strategy, risk tolerance, or investment philosophy. Leaders are responsible for communicating that clearly off-chain. Depositors are responsible for reading it before depositing.

**Not revoking a compromised key.** If a leader's key is stolen and they do not call revoke promptly, the attacker can continue trading within the walls until the expiry. The attacker cannot steal funds, but they can place bad trades. Leaders should treat their vault's execution key with care and revoke immediately if compromise is suspected.

## The summary

Metador eliminates the structural risks in copy trading. It does not eliminate the need for good judgment as a leader. Depositors trust the chain for custody safety and trust you for trading quality. Those are two separate things.

## Next

[Security Model](../risk-and-safety/security-model.md) — chain-enforced vs. trust-enforced, in full detail.
