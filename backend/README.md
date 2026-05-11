# Backend - License Portal

REST API built with **Node.js**, **Express**, and **PostgreSQL** (via Knex).
 Handles authentication, license applications, document uploads, and configurable multi-stage review workflows.

## Tech stack

| Layer | Library |
|---|---|
| HTTP server | Express 4 |
| Database | PostgreSQL 16 + Knex 3 |
| Auth | JWT in httpOnly cookies - `jsonwebtoken` |
| Validation | Joi |
| File uploads | Multer |
| Password hashing | bcryptjs |
| API docs | Swagger UI Express |
| Tests | Jest + Supertest |

---

## Project structure

```
src/
├--- app.js                  # Express app - middleware, routes, Swagger mount
├--- server.js               # HTTP server entry point
│
├--- routes/                 # Route definitions (path + method + middleware wiring)
├--- controllers/            # Extract request data, call service, send response
├--- services/               # Business logic and transaction coordination
├--- repositories/           # All SQL queries via Knex
│
├--- middleware/
│   ├--- auth.js             # JWT cookie verification
│   ├--- rbac.js             # Role-based access control
│   ├--- upload.js           # Multer file upload config
│   ├--- errorHandler.js     # Centralised error responses
│   └--- requestId.js        # Attaches X-Request-ID to every request
│
├--- dto/                    # Joi validation schemas per resource
├--- utils/
│   ├--- errors.js           # Custom error classes (NotFoundError, ValidationError, etc.)
│   ├--- jwt.js              # Token sign/verify helpers
│   ├--- password.js         # bcrypt hash/compare helpers
│   ├--- validate.js         # Joi middleware factory
│   └--- logger.js           # Console logger
│
├--- db/
│   ├--- knex.js             # Knex connection instance
│   ├--- migrations/         # Schema migrations (run in timestamp order)
│   └--- seeds/              # Initial data: application types, workflows, admin account
│
├--- swagger/
│   └--- index.js            # OpenAPI 3.0 spec (served at GET /)
│
└--- tests/
    ├--- unit/               # Pure logic tests — no database required
    ├--- integration/        # Full request/response tests against a real test database
    └--- __mocks__/          # Knex mock used by unit tests
```

---

## Getting started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your local values. Key variables:

| Variable | Example |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_NAME` | `bnr_portal` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `JWT_SECRET` | any 32+ char string |

Full variable reference: [../docs/setup.md](../docs/setup.md)

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE bnr_portal;"
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Seed initial data

```bash
npm run seed
```

The seed script is idempotent safe to re-run. It creates application types, default workflows, and a test admin account.

### 6. Start the dev server

```bash
npm run dev
```

Server starts at `http://localhost:5000`. 
Nodemon restarts on file changes.

---

## API documentation

Swagger UI is served at the root:

```
http://localhost:5000
```

Full endpoint reference: [../docs/api.md](../docs/api.md)

---

## NPM scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start without nodemon |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:rollback` | Roll back the last migration batch |
| `npm run seed` | Run seed files |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Authentication

The API is **cookie-only** - no `Authorization` header. 
Two cookies are set on login:

| Cookie | TTL | Purpose |
|---|---|---|
| `access_token` | 15 min | Sent with every authenticated request |
| `refresh_token` | 7 days | Used only by `POST /api/auth/refresh` |

In `production` mode both cookies have the `Secure` flag, which requires HTTPS.

---

## Roles

**System roles** — stored on the user record:

| Role | Access |
|---|---|
| `APPLICANT` | Submit and track own applications |
| `STAFF` | Review applications per assigned workflow roles |
| `ADMIN` | Full access — manage users, types, and workflows |

**Workflow roles** — assigned per-workflow to STAFF users, control which transitions they can trigger:
`INTAKE_OFFICER`, `REVIEWER`, `LEGAL_OFFICER`, `FINANCIAL_OFFICER`, `APPROVER`

---

## Database schema

All tables live inside the `bnr_licensing` schema.

| Table | Description |
|---|---|
| `users` | Applicant and staff accounts |
| `institutions` | Applicant institution records |
| `application_types` | License categories |
| `document_requirements` | Required documents per application type |
| `workflows` | Review workflow definitions |
| `workflow_states` | States within a workflow |
| `workflow_transitions` | Allowed transitions between states |
| `user_workflow_roles` | Per-workflow role assignments for staff |
| `applications` | License applications |
| `application_documents` | Uploaded files per application |
| `application_stage_reviews` | Timeline of states an application has passed through |
| `audit_logs` | Append-only audit trail |

---

## Tests

```bash
npm test                 # run all tests once
npm run test:watch       # re-run on file changes
npm run test:coverage    # with coverage report
```

- `tests/unit/` - pure logic (RBAC rules, state machine, stage decision validation). 
  Uses a Knex mock; no database needed.
- `tests/integration/` - full HTTP request/response tests (auth flow, concurrent access). 
  Requires a running PostgreSQL instance pointed to by `.env`.
