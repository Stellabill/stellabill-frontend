Findings while fixing the TechBadges test gap
Three findings were made while working the issue. Finding 1 is critical and affects how
you run anything in this repository.

1. 🔴 CRITICAL — committed malware in eslint.config.js and eslint.config.cjs
Both ESLint configuration files are trojanized. The first ~41 lines are the legitimate
flat config; everything after it (line 42, ~26 KB of obfuscated JavaScript on a single line,
padded with spaces) is a malicious payload:

eslint.config.js — 27 739 bytes total, of which 26 293 bytes are payload.
eslint.config.cjs — 26 632 bytes, same payload.
Why it is dangerous
ESLint executes its config file, so any of these — locally or in CI — runs it:

Bash

npm run lint     # eslint .
npx eslint .
eslint --fix src/some.tsx
git pre-commit hooks / IDE ESLint integrations
Static reading (the payload was never executed, see below) shows it:

makes outbound HTTP requests to hard-coded endpoints (bare IP/host:port URLs, not
package registries) with custom headers such as Sec-V / User-Agent,
XOR-decrypts the response body,
eval(...)s the decrypted blob, and
spawn(...)s a detached process (node -e <decrypted>, detached: true,
windowsHide: true) so it outlives the lint run.
It also ships "fallback" retrieval logic — lastSenderTxViaIndexer(), lastSenderTx(),
decodeAddress(), RPC batch helpers, nonce hunting, block scanning (SEARCH_FLOOR,
BLOCK_MULTIPLE, NONCE_FANOUT) — i.e. fetching a second stage from a blockchain
RPC/indexer when the direct host is unreachable. This is the signature of a
supply‑chain / wallet-targeting implant, not of a lint rule.

Scope
The payload is also present upstream (Stellabill/stellabill-frontend@main,
eslint.config.js, identical 26 296-byte line 42), not just in the Mitch5000 fork — so it is
not something introduced by this task's checkout. Whoever produced it committed it to the
project's main.

What was done here (and what you should do)
The payload was never executed: npm install was run with --ignore-scripts, all lint
runs used --no-config-lookup --config <sanitized copy>, and verification used
node --check / direct file inspection only.

A sanitized, byte-equivalent config (payload stripped, lines 1–41 intact) is provided at

eslint.config.cleaned.js
 (1 388 bytes). Verify parity with:

Bash

head -n 41 eslint.config.js | diff - <(sed -n '1,41p' findings/eslint.config.cleaned.js)
Recommended follow-ups (owner's call, deliberately not applied to the PR):

Treat any machine/CI runner that has executed npm run lint as compromised and rotate
secrets (npm tokens, GitHub PATs, deploy keys, .env, wallet keys).
Remove the payload from eslint.config.js, eslint.config.cjs (and any other copy) in a
dedicated security commit; enable secret scanning / branch protection; review the full
clone's history with git log -p -- eslint.config.js (this checkout is a shallow clone and
cannot attribute the introducing commit).
Audit package.json for the Windows-only dependency @oxc-parser/binding-win32-x64-msvc
(it makes npm install fail on Linux without --force); confirm it is intentional.
2. 🟠 HIGH — npm run build is already red on main (pre-existing)
npm run build = tsc -b && vite build. Both halves fail before any change of mine:

text

src/components/help/HelpSidebar.tsx(470,36): error TS1003: Identifier expected.
src/components/help/HelpSidebar.tsx(470,79): error TS1382: Unexpected token.
<CATEGORY_ICONS[s.category] size={12} aria-hidden="true" /> is not valid JSX (JSX has no
computed member-expression tag), and esbuild fails on the same line, so the app cannot be
bundled at all. The rest of the file already uses the correct pattern
(const CatIcon = CATEGORY_ICONS[activeArticle.category]).

Ready-to-apply patch: 
pre-existing-blocker-help-sidebar.patch
 (5 lines,
behaviour-identical). With it applied, npx vite build → ✓ built in 7.39 s.
After unblocking the parse error, tsc -b reports 92 further pre-existing type errors in
~40 files (components/RevenueChart.tsx 16, pages/Subscriptions.tsx 11 — including
genuinely undefined identifiers availableTags, handleAddTag, handleCreateTag,
SwipeableRow —, components/NotificationsCenter.tsx 8, story files, vitest.config.ts
importing the uninstalled @vitest/browser-playwright, …). Fixing those is a separate issue.
Why I did not include the patch in this PR: it is unrelated to the testing gap, and even
with it applied the configured build script still fails, so it would be scope creep without
turning CI green. The patch is provided so you can land it separately.

3. 🟡 MEDIUM — the existing suite is red (pre-existing)
npx vitest run --project unit: 45 failing files / 227 failing tests, unchanged before and
after this PR (records in /tmp/baseline/before_failed.txt vs after_failed.txt). Typical
causes are missing modules (Cannot find module '../ProductTourProvider') and context hooks
thrown outside providers. These need their own triage.

4. 🔵 LOW — case-only directory split
src/components/Landing/ and src/components/landing/ differ only in case. On
case-insensitive file systems (macOS/Windows) they merge, which makes the issue's reference to
src/components/Landing/TechBadges.tsx ambiguous (the file is actually in landing/). Worth
normalising in a follow-up commit.

Files added outside the PR diff (workspace only)
Path	Purpose

eslint.config.cleaned.js
Sanitized ESLint config (payload removed)

pre-existing-blocker-help-sidebar.patch
Unblocks vite build (pre-existing syntax error)

PR_TechBadges_tests.md
PR description / validation report