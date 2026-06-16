# Setting Up GitBook Git Sync

Five steps to connect this docs tree to a GitBook space.

1. **Create a GitBook space.** Log into gitbook.com, create a new space named "Metador Docs".
2. **Enable GitHub Git Sync.** In the space settings, open "Git Sync", connect your GitHub account, select this repository, and set the branch to `main`.
3. **Confirm the root path.** GitBook detects `.gitbook.yaml` at the repo root. Confirm `root: ./apps/docs` when prompted — this is the correct directory.
4. **Verify the initial sync.** GitBook imports the tree from `apps/docs/SUMMARY.md`. Check that the left-sidebar navigation matches the expected structure before publishing.
5. **Set the custom domain.** In space settings under "Custom domain", point your docs subdomain (e.g. `docs.metador.app`) to GitBook's DNS target and enable HTTPS.

Changes merged to `main` publish automatically. No manual publish step is required.
