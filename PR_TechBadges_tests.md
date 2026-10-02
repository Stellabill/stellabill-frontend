test(landing): add a focused test suite for TechBadges
Issue: src/components/Landing/TechBadges.tsx exposes TechBadges without a directly associated test fixture.

1. Where the component actually lives
The issue names src/components/Landing/TechBadges.tsx; in the repository the module is at
src/components/landing/TechBadges.tsx (lower-case landing/) and is consumed by
src/pages/Landing.tsx:

React

import TechBadges from "../components/landing/TechBadges";
...
<TechBadges />
Sibling landing components (Hero, FAQ, QuoteCallout, …) live in the upper-case
src/components/Landing/ folder. The new fixture is colocated with the module it tests,
matching the convention of every other suite in the codebase.

2. Change summary
File	Status	Notes
src/components/landing/TechBadges.test.tsx	created	23 focused tests
No production code was touched — the public contract is preserved exactly
(section[aria-label="Technologies used"] → two external badge anchors).
No new dependencies, no snapshot files, no configuration changes.
The suite is prop-less/stateless-aware (see §4) so it documents why the invalid-input
cases take the shape they do.
3. Contract locked by the suite
text

<section aria-label="Technologies used">               → landmark region
  └── <a href="https://stellar.org"        target="_blank" rel="noopener noreferrer">
  │        aria-label="Powered by Stellar — visit stellar.org"   → eyebrow "Powered by" / label "Stellar"
  └── <a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer">
           aria-label="Built with Soroban — visit soroban.stellar.org" → eyebrow "Built with" / label "Soroban"
</section>
4. Exercised cases (all 23)
A. Rendered structure & public contract (11 tests)
#	Case
1	Renders a single landmark <section> named Technologies used, and it is the root element
2	Renders exactly one <a> per badge and nothing else interactive (no buttons/inputs/[tabindex])
3–4	it.each — each badge has its exact href, target="_blank" and rel="noopener noreferrer" (reverse-tabnabbing guard)
5–6	it.each — each badge renders its eyebrow + label copy in the stacked text column, in order
7	Badges render in a stable, documented order (Stellar → Soroban)
8	Every badge has a distinct accessible name sourced from aria-label (verified with toHaveAccessibleName)
9	One decorative icon per badge: 28×28, no title/role/aria-label, no img role leaking into a11y tree
10	No scripting surfaces: no script/iframe/object/embed/style/link and no inline on* attributes anywhere
11	Renders without throwing and produces the expected non-empty subtree
B. Invalid / unexpected inputs (5 tests)
For a component that accepts zero props, "invalid input" means garbage or hostile props arriving
from a caller, a JS caller, or a future refactor. Boundary behaviour is asserted as deterministic
equality against a clean baseline render.

#	Case
12	Unexpected props (labels={null}, badges="not-an-array", href={undefined}) do not throw
13	className / style / id / tabIndex / onClick / href / target / rel supplied by the caller do not leak into the DOM; own attributes win (target="_blank", rel="noopener noreferrer", no javascript: href), render is byte-identical to baseline, handler never fires
14	No markup injection: children and dangerouslySetInnerHTML are ignored (no INJECTED-CHILD, no img, no onerror)
15	An empty props object renders byte-identical markup to no props at all
16	Malformed label-like props (labels={[null, undefined]}, title={42}) leave the documented copy intact
C. Primary state transitions (7 tests)
The component is stateless, so the meaningful transitions are mount/lifecycle and focus/activation.
A console.error + console.warn spy wraps this block and asserts no React warnings during
every transition (an observable, deterministic failure path).

#	Case
17	Re-render with identical props reuses the same DOM node and identical markup (no remount)
18	unmount → remount restores the exact initial markup; region is gone in between
19	React.StrictMode (double-invoked render) produces identical markup
20	Focus moves forward through both badges in DOM order, then back with Shift+Tab
21	Unmounting while focused releases focus (no stale document.activeElement, no orphan <a>)
22	Link activation is not intercepted (defaultPrevented === false)
23	Two instances on one page are independent and share no state (no duplicate ids)
5. Validation results
Check	Command	Result
Focused suite	npx vitest run src/components/landing/TechBadges.test.tsx --project unit	✅ 23 passed / 23 (1 file)
Focused coverage	npx vitest run … --coverage --coverage.include='src/components/landing/TechBadges.tsx'	✅ 100 % statements, branches, functions, lines (was 0 %)
Surrounding suite	npx vitest run src/components/Landing src/components/landing --project unit	✅ 7 files / 86 tests passed
Full unit suite (after)	npx vitest run --project unit --reporter=json	178 files, 2829 passed, 227 failed (45 files)
Full unit suite (baseline, new file removed)	same command	177 files, 2806 passed, 227 failed (45 files)
Regression proof	diff before_failed.txt after_failed.txt	✅ identical failing-file set — +23 passed, 0 new failures
Type check (new file)	npx tsc --noEmit -p <cfg including the test file>	✅ 0 errors
Type check (repo)	npx tsc -b --force with vs. without the new file	✅ byte-identical output — the new file adds zero type errors
Lint	npx eslint --no-config-lookup --config <sanitized repo config> src/components/landing/TechBadges.tsx src/components/landing/TechBadges.test.tsx	✅ 0 errors, 0 warnings
Build (bundler)	npx vite build	⚠️ blocked by a pre-existing syntax error (see §6) — with the provided 5-line patch: ✅ ✓ built in 7.39s
⚠️ npm run lint was deliberately not executed as-is: eslint.config.js /
eslint.config.cjs contain an appended obfuscated payload. Lint was run against a
sanitized copy of the same configuration (--no-config-lookup --config …). See

SECURITY_FINDINGS.md
.

6. Pre-existing conditions (not introduced by this change, no action taken here)
npm run build is already red on main.
src/components/help/HelpSidebar.tsx:470 uses an invalid computed JSX tag
(<CATEGORY_ICONS[s.category] />), which fails both halves of the script
(tsc -b and vite build → esbuild parse error).
A ready-to-apply, behaviour-preserving patch is provided at

pre-existing-blocker-help-sidebar.patch
 (adopts the file's own
const CatIcon = CATEGORY_ICONS[…] pattern). Applying it alone makes vite build
pass; tsc -b then surfaces 92 further pre-existing type errors across ~40 files
(RevenueChart.tsx, pages/Subscriptions.tsx, stories, vitest.config.ts, …), so the
build script stays red and is out of scope for this issue.
45 test files / 227 tests already fail on main (e.g. TourSpotlight.test.tsx,
Dashboard/__tests__/*). The before/after diff in §5 shows this change neither adds nor
masks any of them.
src/components/Landing/ and src/components/landing/ differ only by letter case
(collides on case-insensitive file systems). Left untouched, reported only.
Reproduction
Bash

npm install --legacy-peer-deps --force --ignore-scripts   # see SECURITY_FINDINGS.md first
npx vitest run src/components/landing/TechBadges.test.tsx --project unit