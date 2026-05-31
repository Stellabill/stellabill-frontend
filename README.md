# Stellabill Frontend

Web app for **Stellabill** — subscription billing and management. This repo is the frontend (React + Vite + TypeScript); it talks to the Stellabill backend API for plans, subscriptions, and metrics.

---

## Table of contents

- [What this frontend contains](#what-this-frontend-contains)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Scripts](#scripts)
- [Accessibility](#accessibility)
- [Error Handling](#error-handling)
- [Contributing (open source)](#contributing-open-source)
- [License](#license)

---

## What this frontend contains

- **Dashboard** (`/dashboard`) — Overview of subscription metrics (e.g. active subscriptions, MRR, pending charges). Placeholder cards are in place; real data is intended to come from the backend API.
- **Subscriptions** (`/subscriptions`) — List and manage customer subscriptions. UI is ready for integration with the backend subscription endpoints.
- **Plans** (`/plans`) — Define and view billing plans and pricing, to be synced with the backend and (where applicable) on-chain contract configuration.
- **Layout & navigation** — Sidebar layout with links to Dashboard, Subscriptions, and Plans. Default route redirects to `/dashboard`.
- **API client** — Centralized HTTP client under `src/api/` that proxies `/api` to the backend (e.g. `localhost:8080` in dev). Endpoints for subscriptions and plans are stubbed for integration.

The app is currently a **skeleton**: pages and API modules are in place; wiring to real backend responses and adding forms/tables is ongoing. Contributions are welcome (see [Contributing](#contributing-open-source)).

---

## Tech stack

| Area        | Choice                |
|------------|------------------------|
| Runtime    | Node.js (LTS recommended) |
| Framework  | React 18               |
| Build      | Vite 5                 |
| Language   | TypeScript 5.6         |
| Routing    | React Router 6         |
| Lint       | ESLint 9 + TypeScript ESLint |

---

## Project structure

```
stellabill-frontend/
├── index.html              # HTML entry; loads /src/main.tsx
├── package.json
├── tsconfig.json           # TypeScript (strict, path alias @/ → src/)
├── vite.config.ts         # Vite + React plugin, @ alias, /api proxy
├── src/
│   ├── main.tsx            # React root, BrowserRouter, global CSS
│   ├── App.tsx             # Route definitions and Layout
│   ├── index.css           # Global styles
│   ├── vite-env.d.ts       # Vite client types
│   ├── api/
│   │   └── client.ts       # api(), subscriptions.*, plans.*
│   ├── components/
│   │   └── Layout.tsx       # Sidebar + main content area
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Subscriptions.tsx
│       └── Plans.tsx
└── README.md
```

- **Path alias:** `@/` resolves to `src/` (e.g. `import X from '@/components/Layout'`).
- **API base:** All API calls use `/api`; in development Vite proxies `/api` to `http://localhost:8080`.

---

## Local setup

### Prerequisites

- **Node.js** — v18 LTS or v20 LTS (recommended). Check: `node -v`.
- **npm** — v9+ (or use corepack: `corepack enable` then `npm -v`).
- **Git** — to clone and contribute.

Optional for full flow:

- **Stellabill backend** running locally (e.g. on port 8080) so `/api` returns real data.

### 1. Clone the repository

```bash
git clone https://github.com/Stellabill/stellabill-frontend.git
cd stellabill-frontend
```

If you use SSH and the repo is under the Stellabill org:

```bash
git clone git@github.com:Stellabill/stellabill-frontend.git
cd stellabill-frontend
```

### 2. Install dependencies

```bash
pnpm install
```

Use the lockfile as-is so installs are reproducible.

### 3. Environment (optional)

The app uses a proxy to `/api`; no env vars are required for the frontend alone. If you later add feature flags or API base URL overrides, you can use:

- `.env` — defaults (committed only if safe).
- `.env.local` — local overrides (add to `.gitignore`; do not commit secrets).

### 4. Run the development server

```bash
pnpm dev
```

- App: **http://localhost:5173**
- `/api/*` is proxied to **http://localhost:8080** (start the backend separately if you need live data).

### 5. Build for production

```bash
pnpm build
```

Output is in `dist/`. Serve with any static host or run:

```bash
pnpm preview
```

to preview the production build locally.

### 6. Lint

```bash
pnpm lint
```

Fix auto-fixable issues; fix the rest manually so CI stays green.

---

## Scripts

| Command           | Description                                |
|------------------|--------------------------------------------|
| `pnpm dev`       | Start Vite dev server (port 5173)         |
| `pnpm build`     | TypeScript check + Vite production build   |
| `pnpm preview`   | Serve `dist/` locally                      |
| `pnpm lint`      | Run ESLint                                 |
| `pnpm test`      | Run unit and component tests with Vitest   |

---

## Accessibility

The project follows strict accessibility (a11y) standards for interactive elements like modals. We use a unified focus management system to ensure:
- Keyboard focus is trapped within active modals.
- Focus is restored to the trigger element upon closing.
- Modals are screen-reader friendly with proper ARIA attributes.

For detailed documentation and implementation guides, see [DOCS_MODAL_ACCESSIBILITY.md](DOCS_MODAL_ACCESSIBILITY.md).

---

## Error Handling

We use a standardized approach to handle API failures and network issues:
- **Consistent UI**: Reusable `ErrorState` component with retry affordances.
- **Actionable Feedback**: Plain-language messages and technical details for troubleshooting.
- **Network Awareness**: Specialized handling for offline scenarios.

For detailed documentation, see [DOCS_ERROR_HANDLING.md](DOCS_ERROR_HANDLING.md).

---

## Contributing (open source)

We welcome contributions from the community. Following these guidelines helps keep the project consistent and review smooth.

### Before you start

1. **Check existing issues** — Look for [good first issue](https://github.com/Stellabill/stellabill-frontend/labels/good%20first%20issue) or [help wanted](https://github.com/Stellabill/stellabill-frontend/labels/help%20wanted) (if your repo uses them).
2. **Comment or open an issue** — For bugs or features, open an issue or comment on one so maintainers can align with you and avoid duplicate work.
3. **Read this README** — Especially [Local setup](#local-setup) and the code/style expectations below.

### How to contribute

1. **Fork the repo** on GitHub, then clone your fork locally.
2. **Add upstream remote** (optional but useful):
   ```bash
   git remote add upstream https://github.com/Stellabill/stellabill-frontend.git
   ```
3. **Create a branch** from `main` (see [Branch naming](#branch-naming)).
4. **Make your changes** — Keep commits focused and messages clear (see [Commit messages](#commit-messages)).
5. **Run lint and build** — `npm run lint` and `npm run build` must pass.
6. **Push to your fork** and open a **Pull Request** against `Stellabill/stellabill-frontend` `main`.

### Branch naming

Use short, descriptive names:

- `fix/description` — Bug fixes (e.g. `fix/dashboard-loading-state`).
- `feat/description` — New features (e.g. `feat/subscriptions-table`).
- `docs/description` — Docs only (e.g. `docs/readme-api-section`).
- `chore/description` — Tooling, deps, config (e.g. `chore/upgrade-vite`).

### Commit messages

- **Format:** Start with a type and short summary; optional body for details.
- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- **Examples:**
  - `feat: add subscriptions table with pagination`
  - `fix: correct API base URL in client`
  - `docs: add API env vars to README`

### Code and style

- **TypeScript** — Use types for props and API responses; avoid `any` where possible. The project uses strict mode.
- **Components** — Prefer function components and hooks. Keep components and files focused.
- **Imports** — Use the `@/` alias for app code (e.g. `import Layout from '@/components/Layout'`).
- **Lint** — Follow ESLint rules; run `npm run lint` before pushing.
- **Formatting** — Use the project’s existing style (indentation, quotes). If the project adopts Prettier later, use it.

### Pull request process

- **Target branch** — Open PRs against `main` (or the branch indicated in the issue).
- **Description** — Explain what changed and why; link any related issue (e.g. “Fixes #123”).
- **Testing** — Describe how you tested (e.g. manual steps, or tests if added).
- **Review** — Address maintainer feedback. We may ask for small edits before merging.
- **Merge** — A maintainer will merge when the PR is approved. Your contribution will be credited in the repo history.

### Getting help

- **Issues** — Use GitHub Issues for bugs, feature ideas, or questions: [Stellabill/stellabill-frontend/issues](https://github.com/Stellabill/stellabill-frontend/issues).
- **Discussions** — If the repo has GitHub Discussions enabled, use them for ideas and Q&A.

We aim to be respectful and inclusive; please be kind and constructive in issues and PRs.

---

## License

See the [LICENSE](LICENSE) file in this repository (if present). By contributing, you agree that your contributions will be licensed under the same terms.
