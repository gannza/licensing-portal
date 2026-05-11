# Frontend - License Portal

React single-page application built with **Vite**, **TypeScript**, **Redux Toolkit**, and **Tailwind CSS**. Provides separate dashboards for applicants, staff reviewers, and administrators.

## Tech stack

| Layer | Library |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Language | TypeScript 5 |
| State management | Redux Toolkit + React-Redux |
| Routing | React Router v6 |
| Styling | Tailwind CSS 3 |
| Notifications | react-hot-toast |

---

## Project structure

```
src/
├--- main.tsx                # App entry point
├--- App.tsx                 # Root component - Redux Provider + Router
├--- store.ts                # Redux store setup
│
├--- routes/
│   └--- index.tsx           # Route definitions and protected route wrappers
│
├--- pages/
│   ├--- auth/               # LoginPage, RegisterPage, ChangePasswordPage
│   ├--- applicant/          # Dashboard, ApplicationCreate, ApplicationDetail
│   ├--- staff/              # Dashboard, ApplicationDetail (with stage decision)
│   └--- admin/              # Dashboard, ApplicationTypes, ApplicationTypeDetail,
│                           #   UserManagement, UserCreate, AuditLogs
│
├--- components/
│   ├--- auth/               # RequireAuth (route guard), RoleDashboard (role switcher)
│   ├--- layout/             # AppLayout, Header, Sidebar
│   ├--- common/             # StatusBadge, LoadingSpinner
│   └--- applications/       # WorkflowProgress, Timeline, StageDecisionModal
│
├--- api/                    # Axios-based API clients per resource
│   ├--- baseApi.ts          # Axios instance with credentials and base URL
│   ├--- authApi.ts
│   ├--- applicationsApi.ts
│   ├--- applicationTypesApi.ts
│   ├--- documentsApi.ts
│   ├--- adminApi.ts
│   └--- utils.ts            # Shared response helpers
│
├--- slices/
│   └--- authSlice.ts        # Auth state (current user, loading, errors)
│
├--- hooks/
│   └--- useAuth.ts          # Typed selector for auth state
│
├--- types/
│   └--- index.ts            # Shared TypeScript types and interfaces
│
└--- utils/
    └--- apiError.ts         # Extract error messages from API responses
```

---

## Getting started

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env   # or create .env manually
```

| Variable | Value |
|---|---|
| `VITE_API_TARGET` | `http://localhost:5000` |
| `VITE_APP_NAME` | `Licensing System` |
| `VITE_APP_COMPANY_NAME` | `National Bank of Rwanda` |

### 3. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`. Vite proxies API requests to `VITE_API_TARGET`.

---

## NPM scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | Type-check then bundle for production (`dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Routing and access control

Routes are defined in `src/routes/index.tsx`. The `RequireAuth` component redirects unauthenticated users to `/login` and enforces system role requirements.

| Path | Role | Page |
|---|---|---|
| `/login` | public | Login |
| `/register` | public | Register |
| `/change-password` | any | Change password |
| `/` | any | Role-based dashboard redirect |
| `/applications/new` | APPLICANT | Create application |
| `/applications/:id` | APPLICANT | Application detail |
| `/staff/applications/:id` | STAFF | Application detail + stage decisions |
| `/admin/application-types` | ADMIN | Manage license types |
| `/admin/application-types/:id` | ADMIN | Type detail + document requirements |
| `/admin/users` | ADMIN | Staff user list |
| `/admin/users/new` | ADMIN | Create staff user |
| `/admin/audit-logs` | ADMIN | Audit log viewer |

---

## State management

Redux Toolkit is used only for **auth state** (current user, loading flag, error). Everything else uses local component state and direct API calls - no global store for application data.

The auth slice (`src/slices/authSlice.ts`) is the single source of truth for who is logged in and what role they hold.

---

## Styling

Tailwind CSS with a custom brand palette defined in `tailwind.config.js`:

| Token | Hex | Usage |
|---|---|---|
| `brand-base` | `#753918` | Sidebar background, page headers |
| `brand-primary` | `#f7c35f` | Primary buttons, highlights |
| `brand-secondary` | `#ebcf8a` | Hover states, badges |
| `brand-special` | `#5366c2` | Status indicators, links |
| `brand-muted` | `#68686f` | Secondary text, placeholders |

Font: **Inter** (loaded via CSS). No third-party UI component library - all components use Tailwind utility classes directly.

---

## API communication

All API calls go through the Axios instance in `src/api/baseApi.ts`, which sets `withCredentials: true` so cookies are included automatically. 
The base URL is read from `VITE_API_TARGET`.

Error responses from the server follow the shape `{ success: false, error: { code, message } }`. 
The `src/utils/apiError.ts` helper extracts the human-readable message for display.
