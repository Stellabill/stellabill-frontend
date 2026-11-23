# Stellabill Frontend

Web app for **Stellabill**, subscription billing on the Stellar network. Customers deposit USDC into a prepaid vault and Soroban smart contracts release funds to the merchant on each billing interval, so there are no forced debits and subscribers stay in control of their balance.

**Live demo:** https://stellabill-frontend-blush.vercel.app

> All plans, subscriptions, balances and wallet data shown in the app are sample demo data. No real payments are made.

## Features

- Marketing landing page with product overview, demo pricing, FAQ and docs links
- Merchant dashboard with revenue charts and key metrics
- Plan management: list plans, create plans, browse plans
- Subscription management: list, detail view, usage-based billing, pause/resume/cancel flows
- Prepaid balance top-up and explainer pages
- Gift subscriptions (redeem flow)
- Merchant onboarding (business, payout, review)
- Freighter wallet connect flow
- Light/dark themes (dark by default), i18n, command palette, accessibility-focused components
- Design tokens page, brand pack and UI kit (`/design-tokens`, `/brand`, `/ui-kit`)

## Tech stack

React 18, TypeScript, Vite 5, React Router 6, Tailwind CSS 4, Framer Motion, i18next, Freighter API, Vitest and Storybook.

## Quickstart

Requires Node 20+ (CI uses 22).

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npx vite build` | Production build to `dist/` (used by CI and Vercel) |
| `npm run build` | `tsc -b` type check plus build (type errors currently exist in some files) |
| `npm run preview` | Serve the built app locally |
| `npm test` | Run Vitest |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run lint` | Run ESLint |
| `npm run storybook` | Component explorer on port 6006 |

## End-to-end testing

Playwright end-to-end specs live in [`e2e/`](e2e/) and verify the lazy-loaded route tree, `OnboardingPayoutGuard` redirects, merchant onboarding happy path (`/onboarding/business` → `/onboarding/payout` → `/onboarding/review` → `/onboarding-success`), and the browse-plans to checkout flow (`/browse-plans` → `/checkout/:planId` → `/subscriptions`) against a local `vite preview` server with no external network requests.

```bash
npx playwright install chromium   # one-time browser install
npm run test:e2e
```

## Environment variables

None are required to run the demo. The dev server proxies `/api` to `http://localhost:8080` (see `vite.config.ts`) for an optional Stellabill backend. Never commit `.env` files.

## Deployment

The app is a static Vite SPA deployed on Vercel. `vercel.json` rewrites all paths to `index.html` so client-side routes work.

```bash
npm i -g vercel
vercel --prod
```

CI (`.github/workflows/ci.yml`) installs dependencies and builds on every push and pull request to `main`. Installs use `legacy-peer-deps` (see `.npmrc`) because of an upstream peer range conflict between `i18next-icu` and `intl-messageformat`.

## Documentation

Feature guides live in [`docs/`](docs/) (product tour, gift subscriptions, invoice print stylesheet, typography, i18n, accessibility and more).

## Contributing

Issues and pull requests are welcome at https://github.com/Stellabill/stellabill-frontend.
