## Backend

```bash
cd backend
cp .env.example .env
# edit .env — set DATABASE_URL to your local Postgres instance
npm install
npm run migrate
npm run seed
npm run dev
```

### Layer responsibilities

```
src/
|---- routes/         HTTP method + path + middleware wiring
|---- controllers/    Extract request data, call service, send response
|---- services/       Business logic and transaction coordination
|---- repositories/   All SQL queries (via Knex query builder)
|---- controller/     Handle request and response
|---- middleware/     auth, rbac, upload, errorHandler
|---  utils/          jwt, password hashing, custom error classes, validate helper
└---  test/           unit test, integration test
```

## Testing

Tests live in `backend/src/tests/` and run with Jest + Supertest. No database is required — the DB layer is fully mocked.

### Running the tests

```bash
cd backend
npm test                  # run all tests once
npm run test:watch        # re-run on file changes
npm run test:coverage     # run with coverage report
```