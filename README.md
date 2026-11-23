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
| `npm run test:coverage` | Run Vitest with V8 coverage (enforces global thresholds: 65% lines, 67% functions, 85% branches, 65% statements) |
| `npm run lint` | Run ESLint |
| `npm run storybook` | Component explorer on port 6006 |

## Environment variables

Copy `.env.example` to `.env.local` to customize any variable. All variables are optional; the dev server proxies `/api` to `http://localhost:8080` (see `vite.config.ts`) for an optional Stellabill backend. Never commit `.env` or `.env.local` files.

| Variable | Default | Effect |
| --- | --- | --- |
| `VITE_STELLAR_NETWORK` | `Testnet` | Sets the expected Stellar network (`Testnet` or `Mainnet`; also accepts `mainnet`, `public`, `pubnet`, `livenet`) |
| `VITE_USE_FIXTURES` | Unset (falsy) | When truthy (e.g. `true`), loads local fixture data on the Subscriptions page instead of fetching `/api/subscriptions` |
| `VITE_SUPPORT_URL` | `https://github.com/Stellabill/stellabill-frontend/issues` | Overrides the external support URL |
| `VITE_STELLAR_WALLETS_DOCS_URL` | `https://docs.stellar.org/wallets` | Overrides the Stellar wallets documentation URL |
| `VITE_DOCS_URL` | `https://github.com/Stellabill/stellabill-frontend/tree/main/docs` | Overrides the project documentation URL |

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
