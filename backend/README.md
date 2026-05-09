## Backend

### Layer responsibilities

```
src/
|---- routes/         HTTP method + path + middleware wiring
|---- controllers/    Extract request data, call service, send response
|---- services/       Business logic and transaction coordination
|---- repositories/   All SQL queries (via Knex query builder)
|---- middleware/     auth, rbac, upload, errorHandler
|---  utils/          jwt, password hashing, custom error classes, validate helper
└---  test/           unit test, integration test
```