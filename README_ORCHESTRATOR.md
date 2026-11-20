# GitHub Multi-Repo Orchestrator v1.0

Node.js script to scan **all eligible repositories owned by `duyuyd`**, apply standardized branding, stage safe integrations, push **one new feature branch per repository**, and open a Pull Request for manual review. It never merges by default, never touches a default branch directly, never force-pushes, and skips forks, archived repositories and repositories in `skipRepos`.

## 1. Download this branch

You need Node.js **22+**, npm, and Git installed.

```bash
git clone --branch release/orchestrator-v1.0 https://github.com/duyuyd/no-code-builder-saas.git
cd no-code-builder-saas
```

If you already have a clone, switch to a clean working directory and check out the branch without discarding your local changes.

## 2. Install dependencies only for the script

Run these commands **from the repository root**:

```bash
cd scripts
npm install --no-save --no-package-lock octokit replace-in-file
cd ..
```

Installing in `scripts/` avoids installing or changing the platform's large Next.js dependency tree. The script uses ESM packages through dynamic imports from CommonJS. No GitHub token goes into a source file.

## 3. Create a personal access token

GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Select resource owner `duyuyd` and choose **All repositories** (including private repos if you want to scan them).

Repository permissions: **Metadata: Read**, **Contents: Read and write**, **Pull requests: Read and write**, and **Workflows: Read and write** if GitHub requests workflow-editing permission. Public-repository-only tokens cannot scan private repositories. Grant access only to the account you control.

Set `GITHUB_TOKEN` **only in your local terminal**. Do not commit it, paste it into chat or put it into `config.json`:

**macOS / Linux / Termux:**

```bash
export GITHUB_TOKEN='PASTE_YOUR_TOKEN_LOCALLY'
```

**Windows PowerShell:**

```powershell
$env:GITHUB_TOKEN = 'PASTE_YOUR_TOKEN_LOCALLY'
```

## 4. Preview before changing GitHub (recommended)

```bash
node scripts/orchestrator.js --repo no-code-builder-saas
node scripts/orchestrator.js
```

Both commands **clone, classify, and show a dry-run report** without committing, pushing or opening any PR. A JSON report is written to `orchestrator-report.json`. Temp clones at `tmp/repos/<repo-name>` are removed after each processed repository; an existing directory is never deleted or overwritten.

Then run a single-repository pilot:

```bash
node scripts/orchestrator.js --apply --repo no-code-builder-saas
```

When the pilot PR looks correct, process all eligible repositories:

```bash
node scripts/orchestrator.js --apply
```

Optional:

```bash
node scripts/orchestrator.js --apply --limit 5
node scripts/orchestrator.js --apply --auto-merge
node scripts/orchestrator.js --help
```

**Warning:** `--auto-merge` can merge PRs as soon as GitHub allows; use only if the repository supports auto-merge and you intentionally want it. Default is always manual review.

## 5. Behavior / limitations

- Scans all pages of the authenticated owner's repositories using `octokit.paginate`, then excludes archived, forked, disabled, template, empty, non-owned, or configured skipped repositories.
- Clones each repository to `tmp/repos/<repo-name>` using a temporary Git HTTP authorization header. The token is **never embedded into a clone URL**.
- Classifies Next.js, React/Vite, Node.js, Python, Rust, Go, static HTML and unknown projects based on source files.
- Only when a top-level `package.json` exists, uses `replace-in-file` to replace `NPT Duy Studio` → `NuvoraCraft` and `No-Code Builder` → `ChaiBuilder` in selected source/text files. Skips dependencies, generated output, native assets, virtual environments, lockfiles, `.env` files and files larger than 400 KB. Does not rename packages, filenames, GitHub repository names, or database records.
- For Next.js projects with supported `app/layout.*` or `pages/_app.*`, inserts `next/script` with `https://js.puter.com/v2/` using `afterInteractive`. A custom Pages Router `_app` without a simple `<Component />` pattern is left intact for manual integration. Puter.js is a loader only — AI UI, authentication, usage limits and cost model need to be designed separately.
- For Next.js projects, adds a **manual** `.github/workflows/build-apk.yml` when absent. Existing workflow files are not overwritten. The workflow uses Capacitor, installs dependencies, builds the static website, syncs Android, compiles `app-debug.apk`, and uploads an Actions artifact. **It cannot automatically turn a Next.js SSR/API/Server Actions project into an offline-capable mobile app.** Before running the workflow, install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, initialize `capacitor.config.*` with `webDir: 'out'`, and configure Next.js for static export (`output: 'export'`). Apps that depend on server rendering need a deliberate architecture change; the workflow fails with an explicit diagnostic until that is done. This does not silently alter deployed web applications.
- Any repo with no changes is skipped. Existing `feat/standardization-auto` branches are **never overwritten**, even on reruns. Check its open PR manually or choose a new branch name in `scripts/config.json` for a new rollout. The script never performs a forced push.
- If a PR cannot be opened after the branch was pushed, the JSON report records the partial failure; review the branch on GitHub. Rerunning does not overwrite that existing branch.

## 6. Review the PRs

Visit `https://github.com/duyuyd/<repo>/pulls` for each repo. Inspect `Files changed` and verify project-specific builds. Then merge accepted PRs manually. Review all Next.js workflows separately: the build workflow may require Capacitor preparation before it can produce an APK.

For personal accounts with many repositories, review GitHub API limits, Actions minutes, and build compute usage before running at scale. No repository's main branch is modified by the Orchestrator itself.