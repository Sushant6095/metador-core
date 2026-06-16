# Earning as a Leader

Leaders earn 10% of the profit generated for their followers. There is no AUM fee, no subscription fee, and no Metador platform fee in v1.

## How the fee is calculated

The fee applies to realized profit per depositor, measured from their entry NAV to their exit NAV.

Maya deposits 1,000 tokens at a NAV of 1 token per share, receiving 1,000 shares. Leo trades. The vault's NAV rises to 1.12 tokens per share. Maya withdraws her 1,000 shares, now worth 1,120 tokens. Her profit is 120 tokens. Leo's fee is 10% of 120 = 12 tokens. Maya receives 1,108 tokens.

If Maya withdraws at a NAV below her entry price — meaning the trading lost value — no fee is charged on that withdrawal. The fee is on profit only.

## Fee mechanics on-chain

Fee deduction happens at withdrawal time. The contract calculates the profit component of the withdrawal, deducts the leader's share, and transfers it to the leader's address atomically. There is no separate claim step. There is no Metador intermediary — the fee flows directly from depositor to leader in the same transaction.

## What leaders do not get

Leaders do not hold depositor funds. The 10% performance fee is their only payment mechanism. They cannot set a higher fee rate unilaterally — the rate is encoded in `keel_core`. A leader with full access to their vault's TradeCap still cannot touch the underlying deposits.

## Performance context

The fee structure aligns with leading a vault only being worth it if followers profit. A leader who trades poorly within the walls earns no fee and builds no track record. The on-chain activity feed and NAV history are the complete, uneditable record.

## Next

[Responsibilities](responsibilities.md) — what the chain does and does not constrain a leader from doing.
