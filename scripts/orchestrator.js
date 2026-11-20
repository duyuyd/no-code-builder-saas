#!/usr/bin/env node
'use strict';

/**
 * GitHub Multi-Repo Orchestrator v1.0
 * Node.js 22+, Git, octokit, replace-in-file.
 * Read-only by default; use --apply to create remote branches and pull requests.
 * Does not change, reset or delete any repository's default branch.
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const PUTER_URL = 'https://js.puter.com/v2/';
const PR_TITLE = '[AUTO] Standardization & Rename by Orchestrator';
const WORKFLOW_PATH = '.github/workflows/build-apk.yml';
const ALLOWED_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.jsonc',
  '.md', '.mdx', '.html', '.htm', '.css', '.scss', '.vue', '.svelte',
  '.yaml', '.yml', '.txt', '.xml'
]);
const IGNORED_DIRS = new Set([
  '.git', '.next', '.nuxt', '.turbo', '.vercel', 'node_modules',
  'dist', 'build', 'out', 'coverage', '.venv', 'venv', '__pycache__',
  'vendor', '.expo', 'android', 'ios'
]);
const IGNORED_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock',
  'bun.lockb', 'composer.lock', 'Cargo.lock', 'Pipfile.lock'
]);

function usage() {
  console.log(`GitHub Multi-Repo Orchestrator v1.0
Usage: node scripts/orchestrator.js [--apply] [--repo REPO] [--limit N] [--auto-merge]

Without --apply: scans, clones, stages LOCAL changes, and reports without pushing.
  --apply       Commit, push new feature branches, open PRs on eligible repos
  --repo NAME   Process just one of the owner's repositories (for testing)
  --limit N     Process at most N eligible repositories
  --auto-merge  Request GitHub auto-merge (requires --apply and repo permission)
  --help        Display help

Set GITHUB_TOKEN (or GH_TOKEN) in your local terminal. Node.js 22+ and Git required.`);
}

function parseArgs(argv) {
  const result = { apply: false, autoMerge: false, repo: null, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--help' || item === '-h') return { help: true };
    if (item === '--apply') result.apply = true;
    else if (item === '--auto-merge') result.autoMerge = true;
    else if (item === '--repo') result.repo = argv[++i];
    else if (item === '--limit') result.limit = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${item}`);
  }
  if (result.repo && !/^[A-Za-z0-9_.-]+$/.test(result.repo)) {
    throw new Error('--repo must be a simple repository name.');
  }
  if (!Number.isInteger(result.limit) && result.limit !== Infinity) {
    throw new Error('--limit must be a positive integer.');
  }
  if (result.limit <= 0) throw new Error('--limit must be > 0.');
  if (result.autoMerge && !result.apply) throw new Error('--auto-merge requires --apply.');
  return result;
}

function validateConfig(config) {
  if (!config || !/^[A-Za-z0-9-]+$/.test(config.owner || '')) {
    throw new Error('config.owner is required.');
  }
  if (!Array.isArray(config.replacements) || !Array.isArray(config.skipRepos)) {
    throw new Error('config.replacements and config.skipRepos must be arrays.');
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(config.branch || '') || config.branch.includes('..')) {
    throw new Error('Invalid config.branch.');
  }
  for (const rule of config.replacements) {
    if (typeof rule.old_name !== 'string' || !rule.old_name || typeof rule.new_name !== 'string') {
      throw new Error('Each replacement requires old_name and new_name strings.');
    }
  }
}

function git(args, cwd, extraEnv = {}) {
  return execFileSync('git', args, {
    cwd,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...extraEnv },
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024
  }).trim();
}

// Git credentials never appear in origin URLs, commit messages or logs.
function gitAuthEnv(token) {
  return {
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`
  };
}

function exists(file) { return fs.existsSync(file); }

function classify(root) {
  const pkgFile = path.join(root, 'package.json');
  let pkg = null;
  if (exists(pkgFile)) {
    try { pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8')); }
    catch (error) { throw new Error(`Invalid package.json: ${error.message}`); }
  }
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const isNext = Boolean(deps.next) || ['next.config.js', 'next.config.mjs', 'next.config.ts'].some(name => exists(path.join(root, name)));
  let type = 'Other';
  if (isNext) type = 'Next.js';
  else if (pkg && (deps.vite || deps.react || deps['react-dom'])) type = 'React / Vite';
  else if (pkg) type = 'Node.js / JavaScript';
  else if (exists(path.join(root, 'pyproject.toml')) || exists(path.join(root, 'requirements.txt')) || exists(path.join(root, 'setup.py'))) type = 'Python';
  else if (exists(path.join(root, 'Cargo.toml'))) type = 'Rust';
  else if (exists(path.join(root, 'go.mod'))) type = 'Go';
  else if (exists(path.join(root, 'index.html'))) type = 'Static HTML';
  return { type, isNext, hasPackage: Boolean(pkg), hasWebRoutes: ['app', 'pages', 'src/app', 'src/pages'].some(p => exists(path.join(root, p))) };
}

async function textFiles(root, maxBytes = 400_000) {
  const files = [];
  async function walk(dir) {
    for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(full);
        continue;
      }
      if (!entry.isFile() || IGNORED_FILES.has(entry.name) || entry.name.startsWith('.env')) continue;
      if (!ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) continue;
      if ((await fsp.stat(full)).size > maxBytes) continue;
      files.push(full);
    }
  }
  await walk(root);
  return files;
}

function addScriptImport(source) {
  const statement = 'import OrchestratorPuterScript from "next/script";\n';
  if (/^import\s+OrchestratorPuterScript\s+from\s+['"]next\/script['"]/m.test(source)) return source;
  const firstImport = source.search(/^import\s/m);
  if (firstImport >= 0) return source.slice(0, firstImport) + statement + source.slice(firstImport);
  const directive = /^(\uFEFF?\s*(?:['"]use client['"];?\s*|['"]use strict['"];?\s*)*)/;
  const matched = source.match(directive);
  const index = matched ? matched[0].length : 0;
  return source.slice(0, index) + statement + source.slice(index);
}

function injectPuter(source, mode) {
  if (source.includes(PUTER_URL)) return { content: source, changed: false, reason: 'Already integrated' };
  const tag = `<OrchestratorPuterScript src="${PUTER_URL}" strategy="afterInteractive" />`;
  let output;
  if (mode === 'app') {
    // A root Next.js App Router layout must render a <body> element.
    if (!/<body\b[^>]*>/i.test(source)) return { content: source, changed: false, reason: 'No <body> in App Router layout' };
    output = addScriptImport(source).replace(/(<body\b[^>]*>)/i, `$1\n        ${tag}`);
  } else {
    // Prefer wrapping the existing self-closing App component so parent Providers stay intact.
    if (!/<Component\b[^>]*\/>/m.test(source)) return { content: source, changed: false, reason: 'Pages Router _app has no simple <Component />; manual integration required' };
    output = addScriptImport(source).replace(/(<Component\b[^>]*\/>)/m, `<>$1${tag}</>`);
  }
  return { content: output, changed: true, reason: 'Puter.js loaded by next/script' };
}

async function applyPuter(root) {
  const candidates = [
    ['app/layout.tsx', 'app'], ['src/app/layout.tsx', 'app'],
    ['app/layout.jsx', 'app'], ['src/app/layout.jsx', 'app'],
    ['app/layout.js', 'app'], ['src/app/layout.js', 'app'],
    ['pages/_app.tsx', 'pages'], ['src/pages/_app.tsx', 'pages'],
    ['pages/_app.jsx', 'pages'], ['src/pages/_app.jsx', 'pages'],
    ['pages/_app.js', 'pages'], ['src/pages/_app.js', 'pages']
  ];
  const notes = [];
  const changed = [];
  for (const [relative, mode] of candidates) {
    const full = path.join(root, relative);
    if (!exists(full)) continue;
    const before = await fsp.readFile(full, 'utf8');
    const result = injectPuter(before, mode);
    if (result.changed) {
      await fsp.writeFile(full, result.content, 'utf8');
      changed.push(relative);
    }
    notes.push(`${relative}: ${result.reason}`);
  }
  if (!notes.length) notes.push('No supported Next.js root layout/_app found; Puter injection skipped');
  return { changed, notes };
}

function androidWorkflow() {
  return `name: Android debug APK (Capacitor)
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - uses: android-actions/setup-android@v3
      - name: Validate supported Capacitor web project
        shell: bash
        run: |
          node <<'NODE'
          const fs = require('node:fs');
          const pkg = require('./package.json');
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          for (const dep of ['@capacitor/core', '@capacitor/cli', '@capacitor/android']) {
            if (!deps[dep]) throw new Error('Install ' + dep + ' in the project first; this workflow does not rewrite your app.');
          }
          if (!['capacitor.config.ts', 'capacitor.config.js', 'capacitor.config.json'].some(fs.existsSync)) {
            throw new Error('Missing capacitor.config.* with webDir: "out". Run npx cap init first.');
          }
          NODE
      - name: Install dependencies
        shell: bash
        run: |
          if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
      - name: Build web app (requires Next.js static export)
        run: npm run build
      - name: Verify static assets
        run: |
          test -f out/index.html || (echo 'Next.js must use output: export and generate out/index.html. SSR apps require a separate conversion strategy.' && exit 1)
      - name: Create Android project when absent
        run: |
          if [ ! -f android/gradlew ]; then npx cap add android; fi
      - name: Sync Capacitor assets
        run: npx cap sync android
      - name: Compile debug APK
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: capacitor-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
`;
}

function apiErrorMessage(err) {
  // Some API errors may contain request metadata; never dump request/headers/tokens.
  return `${err.status || 'error'} ${err.message || 'Unknown error'}`.replace(/gh[pousr]_[A-Za-z0-9_]+/g, '[REDACTED]');
}

async function createPullRequest(octokit, owner, repo, branch, base, autoMerge) {
  const created = await octokit.rest.pulls.create({
    owner, repo, base, head: branch, title: PR_TITLE,
    body: [
      '## Generated by GitHub Multi-Repo Orchestrator v1.0',
      '- Replaces configured brand strings in selected text/source files (no data deletion).',
      '- Adds Puter.js loader only where a supported Next.js layout exists.',
      '- Adds a manually triggered Capacitor Android debug APK workflow to Next.js projects where the workflow does not already exist.',
      '',
      '> **Important:** The APK workflow needs Capacitor packages/config and Next.js static export (`out/index.html`). SSR-only Next.js apps are not automatically converted.',
      '> Puter.js loading does **not** add an AI interface or guarantee unrestricted free usage.',
      '',
      'Review the diff and run your project CI before merging.'
    ].join('\n')
  });
  const url = created.data.html_url;
  if (autoMerge) {
    if (!created.data.node_id) throw new Error(`PR opened at ${url}, but node_id missing for auto-merge`);
    await octokit.graphql(`mutation($id: ID!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: SQUASH }) {
        pullRequest { number }
      }
    }`, { id: created.data.node_id });
  }
  return url;
}

async function processRepo({ octokit, repo, config, options, token, replaceInFile }) {
  const owner = config.owner;
  const name = repo.name;
  const result = { repo: `${owner}/${name}`, classification: '', changed: [], notes: [], state: 'unknown' };
  const tempBase = path.join(ROOT, 'tmp', 'repos');
  await fsp.mkdir(tempBase, { recursive: true });
  const directory = path.join(tempBase, name);
  if (exists(directory)) throw new Error(`Temporary directory already exists: ${directory}. Move it aside before rerunning; never auto-deleting it.`);
  let createdClone = false;
  const authEnv = gitAuthEnv(token);
  try {
    git(['clone', '--depth', '1', '--single-branch', '--branch', repo.default_branch,
      `https://github.com/${owner}/${name}.git`, directory], ROOT, authEnv);
    createdClone = true;
    const category = classify(directory);
    result.classification = category.type;
    const changed = new Set();
    if (category.hasPackage && config.replacements.length) {
      const all = await textFiles(directory);
      if (all.length) {
        const from = config.replacements.map(({ old_name }) => new RegExp(old_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
        const to = config.replacements.map(({ new_name }) => new_name);
        const statuses = await replaceInFile({ files: all, from, to, disableGlobs: true, encoding: 'utf8' });
        for (const status of statuses) {
          if (status.hasChanged) changed.add(path.relative(directory, status.file).split(path.sep).join('/'));
        }
      }
    }
    if (category.isNext && category.hasWebRoutes) {
      const puter = await applyPuter(directory);
      puter.changed.forEach(f => changed.add(f));
      result.notes.push(...puter.notes);
    }
    if (category.isNext) {
      const fullWorkflow = path.join(directory, WORKFLOW_PATH);
      if (!exists(fullWorkflow)) {
        await fsp.mkdir(path.dirname(fullWorkflow), { recursive: true });
        await fsp.writeFile(fullWorkflow, androidWorkflow(), 'utf8');
        changed.add(WORKFLOW_PATH);
        result.notes.push('Added manual Capacitor APK workflow (requires project-side Capacitor/static export setup)');
      } else {
        result.notes.push('Existing build-apk.yml kept intact');
      }
    }
    result.changed = [...changed].sort();
    if (!result.changed.length) {
      result.state = 'unchanged';
      return result;
    }
    result.state = options.apply ? 'pending-push' : 'preview-only';
    if (!options.apply) return result;

    // Never update/reset an existing remote branch, preventing accidental overwrites.
    const existing = git(['ls-remote', '--heads', 'origin', `refs/heads/${config.branch}`], directory, authEnv);
    if (existing) {
      result.state = 'branch-exists';
      result.notes.push(`Remote branch ${config.branch} exists: no push/force-push attempted`);
      return result;
    }
    git(['checkout', '-b', config.branch], directory);
    git(['add', '--', ...result.changed], directory);
    if (!git(['diff', '--cached', '--name-only'], directory)) {
      result.state = 'unchanged';
      return result;
    }
    git(['-c', 'user.name=multi-repo-orchestrator', '-c', 'user.email=orchestrator@users.noreply.github.com',
      'commit', '-m', 'chore: standardize brand and add platform integrations'], directory);
    git(['push', '-u', 'origin', `HEAD:refs/heads/${config.branch}`], directory, authEnv);
    result.state = 'pushed';
    try {
      result.pr = await createPullRequest(octokit, owner, name, config.branch, repo.default_branch, options.autoMerge);
      result.state = options.autoMerge ? 'pr-auto-merge-requested' : 'pr-opened';
    } catch (error) {
      result.notes.push(`PR creation/auto-merge failed after push: ${apiErrorMessage(error)}`);
      throw Object.assign(new Error(`Branch pushed but PR step failed: ${apiErrorMessage(error)}`), { partial: result });
    }
    return result;
  } finally {
    if (createdClone) await fsp.rm(directory, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { usage(); return; }
  const config = JSON.parse(await fsp.readFile(CONFIG_PATH, 'utf8'));
  validateConfig(config);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) throw new Error('Missing GITHUB_TOKEN / GH_TOKEN; see README_ORCHESTRATOR.md.');
  try { git(['--version'], ROOT); } catch { throw new Error('Git is not installed or not on PATH.'); }
  const [{ Octokit }, { replaceInFile }] = await Promise.all([import('octokit'), import('replace-in-file')]);
  const octokit = new Octokit({ auth: token, userAgent: 'multi-repo-orchestrator/v1.0' });
  const me = await octokit.rest.users.getAuthenticated();
  if (me.data.login.toLowerCase() !== config.owner.toLowerCase()) {
    throw new Error(`Token belongs to @${me.data.login}, not configured owner @${config.owner}; aborting.`);
  }
  const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    affiliation: 'owner', visibility: 'all', per_page: 100, sort: 'full_name', direction: 'asc'
  });
  const filtered = repos.filter(r => r.owner.login.toLowerCase() === config.owner.toLowerCase()
    && !r.archived && !r.fork && !r.disabled && !r.is_template
    && !config.skipRepos.includes(r.name) && !r.empty
    && (!options.repo || r.name === options.repo)).slice(0, options.limit);
  if (options.repo && filtered.length === 0) throw new Error(`Repository '${options.repo}' not found or excluded.`);
  console.log(`[SCAN] ${repos.length} accessible owned repos; ${filtered.length} eligible. Mode: ${options.apply ? 'APPLY' : 'DRY RUN'}`);
  const report = [];
  for (const repo of filtered) {
    console.log(`[REPO] ${repo.full_name}`);
    try {
      const entry = await processRepo({ octokit, repo, config, options, token, replaceInFile });
      report.push(entry);
      console.log(`  ${entry.classification}: ${entry.state}; ${entry.changed.length} file(s)`);
      if (entry.pr) console.log(`  PR: ${entry.pr}`);
      for (const note of entry.notes) console.log(`  Note: ${note}`);
    } catch (err) {
      const partial = err.partial || { repo: repo.full_name, classification: '', changed: [], state: 'error', notes: [] };
      partial.error = apiErrorMessage(err);
      report.push(partial);
      console.error(`  ERROR: ${partial.error}`);
    }
  }
  const dest = path.join(ROOT, 'orchestrator-report.json');
  await fsp.writeFile(dest, JSON.stringify({ mode: options.apply ? 'apply' : 'dry-run', owner: config.owner,
    generatedAt: new Date().toISOString(), scanned: repos.length, eligible: filtered.length, repos: report }, null, 2) + '\n');
  console.log(`\nReport: ${dest}`);
  const failed = report.filter(r => r.error || r.state === 'branch-exists').length;
  console.log(`Processed: ${report.length}; issues: ${failed}; PRs: ${report.filter(r => r.pr).length}`);
  if (failed) process.exitCode = 1;
}

if (require.main === module) {
  main().catch(err => { console.error(`FATAL: ${apiErrorMessage(err)}`); process.exitCode = 1; });
}

module.exports = { parseArgs, validateConfig, classify, injectPuter, androidWorkflow, addScriptImport, textFiles };