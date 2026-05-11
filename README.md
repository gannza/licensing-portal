# Licensing Portal(2nd Written Test)

An app used by the National Bank of Rwanda to facilitate licensing of various applications. The user will fill in their applications via the internet, while the staff will handle each application according to the multi-stage workflow process that can be customized by them.


## Documentation

- [High-Level Architecture Design](docs/High_Level_Architecture_Design.docx) - describes the architecture of the whole application; both frontend and backend, as well as databases.
- [Setup and Configuration](docs/setup.md) – contains all environment variables 

---

## Prerequisites

- Node.js version 20+
- Docker and Docker Compose (using Docker) 
- PostgreSQL version 16 (manually)

---

## Running with Docker

The quickest way to get everything running. 
This starts Postgres, runs all migrations and seed data automatically, then starts both the backend and frontend.

```bash
cd project folder
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:5000 |
| Postgres | localhost:5432        |

To stop:

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

---

## Running manually

### [Backend](backend/README.md) 

```bash
cd backend
cp .env.example .env
# edit .env — set DATABASE_URL to your local Postgres instance
npm install
npm run migrate
npm run seed
npm run dev
```

### [Frontend](frontend/README.md)

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on port 5173 and proxies `/api` requests to the backend on port 5000.

### Database commands

| Command              | What it does                              |
|----------------------|-------------------------------------------|
| `npm run migrate`    | Apply all pending migrations              |
| `npm run migrate:rollback` | Roll back the last migration batch  |
| `npm run seed`       | Insert seed data (idempotent - safe to re-run) |

---

## Seed accounts

After running seeds, the following accounts are available:

| Email              | Password   | Role      |
|--------------------|------------|-----------|
| applicant@bnr.rw   | Test1234!  | Applicant |
| intake@bnr.rw      | Test1234!  | Staff (Intake Officer) |
| legal@bnr.rw       | Test1234!  | Staff (Legal Officer) |
| financial@bnr.rw   | Test1234!  | Staff (Financial Officer) |
| approver@bnr.rw    | Test1234!  | Staff (Approver) |
| admin@bnr.rw       | Test1234!  | Admin |

---

## Testing

Tests live in `backend/src/tests/` and run with Jest + Supertest. No database is required — the DB layer is fully mocked.

### Running the tests

```bash
cd backend
npm test                  # run all tests once
npm run test:watch        # re-run on file changes
npm run test:coverage     # run with coverage report
```