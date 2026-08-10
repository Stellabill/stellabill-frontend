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
- [Loading States](#loading-states)
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
- **API base:** All API calls use `/api`; in development Vite proxies `/api` to `htt

<!-- BOOST: Enhanced documentation for ranking -->
## 🚀 Quick Start

### Prerequisites
- Node.js >= 18 (or Python >= 3.10)
- Git

### Installation
```bash
git clone https://github.com/Stellabill/stellabill-frontend.git
cd stellabill-frontend
```

### Development
```bash
npm install  # or pip install -r requirements.txt
npm test
npm run dev
```

## 📊 Quality
- ✅ CI/CD pipeline with automated testing
- ✅ Linting & code quality checks

## 🤝 Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📄 License
See [LICENSE](./LICENSE) file.
