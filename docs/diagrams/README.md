# Metador — System Design Diagrams

Repo-ready Mermaid sources. Destination: `docs/diagrams/` in the metador monorepo.
The Architect agent owns these files — any architecture change lands here in the same PR (see CLAUDE.md).

| File | Diagram | Use |
|---|---|---|
| `01-system-architecture.mermaid` | Full Gate-1 system: actors → Next.js app → keel_core → DeepBook + cranker + read layer | README hero, judge orientation |
| `02-flow-create-vault.mermaid` | One-PTB vault birth (cap never exists outside the box) | Security story, §6 of plan |
| `03-flow-leader-trade.mermaid` | Four-walls gauntlet + all three red-team abort paths | Demo script source of truth |
| `04-flow-deposit-withdraw-crank.mermaid` | Shares/NAV math + permissionless DCA crank loop | Depositor docs |
| `05-move-object-model.mermaid` | classDiagram of Vault/Policy/Strategy + DeepBook objects we touch | Move engineer + auditor map |
| `06-page-routing.mermaid` | 11 screens incl. Cockpit, modals, guards, deep-links | Frontend agent contract |

## How to render
- **GitHub**: paste into any `.md` inside a ```mermaid fence — renders automatically.
- **Live editor**: https://mermaid.live (paste file contents; export SVG/PNG for slides).
- **VS Code**: extension "Markdown Preview Mermaid Support".
- **CLI export** (for the pitch deck): `npx -y @mermaid-js/mermaid-cli -i 01-system-architecture.mermaid -o arch.svg -b transparent`

## Conventions
- Colors mirror the product design tokens: Sui blue `#4DA2FF` = on-chain hot paths, teal `#2DD4BF` = our app code, grey = external/existing, red = enforcement/abort paths, amber = modals.
- Anything DeepBook is marked "EXISTS, we only call it" — if a diagram ever shows us building matching/settlement/oracles, the diagram (or the plan) is wrong.
- Gate-2+ elements are dashed.
