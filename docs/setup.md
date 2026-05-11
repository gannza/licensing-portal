# Configuration & Setup

## Prerequisites

### Node.js v24.11.0

**Step 1 — Check if Node.js is already installed**

```bash
node -v
```

- If the command is not found, Node.js is not installed — follow **Step 2**.
- If you see `v24.11.0`, you are good — skip to [Installing dependencies](#installing-dependencies).
- If you see any other version, you need to switch — follow **Step 2**.

---

**Step 2 — Install nvm**

nvm lets you install and switch between Node.js versions without touching your system installation.

On macOS / Linux:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Then restart your terminal (or run `source ~/.bashrc` / `source ~/.zshrc`) and verify:

```bash
nvm --version
```

On Windows, download and run the **nvm-windows** installer from:
https://github.com/coreybutler/nvm-windows/releases

Then open a new terminal and verify:

```powershell
nvm version
```

---

**Step 3 — Install and use Node.js v24.11.0**

```bash
nvm install 24.11.0
nvm use 24.11.0
node -v   # should print v24.11.0
```

To make this version the default for all future terminals:

```bash
nvm alias default 24.11.0
```

---

## Installing dependencies

The project has two separate packages — backend (Express) and frontend (React + Vite). Install them independently.

### Backend

```bash
cd backend
npm install
```

### Frontend

The frontend was scaffolded with Vite's React TypeScript template:

```bash
npx create-vite@latest frontend -- --template react-ts
```

To install its dependencies:

```bash
cd frontend
npm install
```

---

## Running locally

```bash
# terminal 1 — API server (http://localhost:5000)
cd backend
npm run dev

# terminal 2 — Vite dev server (http://localhost:5173)
cd frontend
npm run dev
```

---

## Backend environment variables

Copy `backend/.env.example` to `backend/.env` and fill in the values below.

Example `.env`:

```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bnr_portal
DB_USER=postgres
DB_PASSWORD=postgres
DB_SCHEMA=bnr_licensing

JWT_SECRET=change-this-in-production-must-be-32-chars
JWT_REFRESH_SECRET=change-this-refresh-in-production-123
JWT_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800

UPLOAD_DIR=uploads

CLIENT_URL=http://localhost:5173
```

---

## Local PostgreSQL setup

If you are not using Docker, create the database manually:

```sql
CREATE DATABASE bnr_portal;
```

Then run migrations from the backend directory:

```bash
npm run migrate
```

To seed the database with workflows, document requirements, and test accounts:

```bash
npm run seed
```

The seed script is idempotent. It uses `ON CONFLICT ... IGNORE` throughout, so re-running it will not create duplicates.

To roll back the last migration batch:

```bash
npm run migrate:rollback
```

---

## Docker setup

When using `docker compose up`, the backend container waits for Postgres to be healthy before starting. Once Postgres is ready, the entrypoint runs migrations and seeds automatically, then starts the server.

The database volume (`pgdata`) persists between restarts. To do a clean reset:

```bash
docker compose down -v
docker compose up --build
```

The `uploads` volume stores user-uploaded files and is also persisted separately.

---

## File uploads

Uploaded documents are stored on disk under `UPLOAD_DIR` (default: `uploads/` inside the backend directory). In Docker, this maps to the `uploads` named volume so files survive container restarts.

Allowed file types and maximum sizes per document requirement are stored in the `document_requirements` table and enforced at upload time by the backend. The frontend does not pre-validate these — the API is the source of truth.

---

## Production checklist

- Set `NODE_ENV=production` — this enables the `secure` flag on both auth cookies (`access_token` and `refresh_token`), which requires HTTPS.
- Use strong, randomly generated values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (at least 64 characters each).
- Put the backend behind a reverse proxy (nginx, Caddy, etc.) for TLS termination.
- Set `CLIENT_URL` to the actual frontend domain, not localhost.
