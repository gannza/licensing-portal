# API Documentation

## Interactive explorer

Start the backend and open the Swagger UI in your browser:

```
http://localhost:5000
```

All endpoints can be tested directly from the browser. Authenticate first via **POST /api/auth/login** — the server sets an `access_token` cookie that Swagger will include automatically on subsequent requests.

---

## Base URL

```
http://localhost:5000
```

---

## Authentication

All endpoints (except those marked *public*) require a valid `access_token` cookie. The cookie is set automatically on login and registration. There is no `Authorization` header — the API is cookie-only.

| Cookie | TTL | Description |
|---|---|---|
| `access_token` | 15 min | Short-lived JWT for authenticated requests |
| `refresh_token` | 7 days | Used by `POST /api/auth/refresh` to issue a new access token |

---

## Roles

### System roles

| Role | Description |
|---|---|
| `APPLICANT` | External user who submits license applications |
| `STAFF` | Staff officer who reviews applications |
| `ADMIN` | Full administrative access |

### Workflow roles

Assigned per-workflow to STAFF users. Determine which transitions a staff member can trigger.

| Role |
|---|
| `APPLICANT` |
| `INTAKE_OFFICER` |
| `REVIEWER` |
| `LEGAL_OFFICER` |
| `FINANCIAL_OFFICER` |
| `APPROVER` |

---

## Application states

```
SUBMITTED → UNDER_INITIAL_REVIEW → PENDING_INFORMATION
                                 → UNDER_LEGAL_REVIEW
                                 → UNDER_FINANCIAL_REVIEW
                                 → UNDER_REVIEW
                                 → PENDING_APPROVAL
                                 → APPROVED
                                 → REJECTED
```

---

## Error envelope

All error responses share this shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "\"email\" is required"
  }
}
```

| Code | HTTP |
|---|---|
| `VALIDATION_ERROR` | 400 |
| `UNAUTHORIZED` | 403 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `UNPROCESSABLE` | 422 |

---

## Endpoints

### Health

#### `GET /api/health` — public

Returns service status.

```json
{ "status": "ok", "uptime": 3600.5, "timestamp": "2026-05-11T08:00:00.000Z" }
```

---

### Auth

#### `POST /api/auth/register` — public

Creates an APPLICANT account and institution record. Sets auth cookies on success.

**Body**

| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `password` | string (min 8, 1 uppercase, 1 digit) | yes |
| `full_name` | string | yes |
| `phone` | string | no |
| `institution_name` | string | yes |
| `institution_registration_number` | string | yes |

**Responses:** `201 Created`, `400 Validation`, `409 Conflict`

---

#### `POST /api/auth/login` — public

Authenticates credentials and sets cookies.

If `must_change_password` is `true` in the response, the user must call `POST /api/auth/change-password` before accessing anything else.

**Body**

| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `password` | string | yes |

**Responses:** `200 OK`, `400 Validation`, `403 Unauthorized`

---

#### `POST /api/auth/refresh` — public

Uses the `refresh_token` cookie to issue a new `access_token` cookie. No body required.

**Responses:** `200 OK`, `403 Unauthorized`

---

#### `POST /api/auth/logout` — public

Clears auth cookies.

**Responses:** `200 OK`

---

#### `GET /api/auth/me`

Returns the currently authenticated user.

**Responses:** `200 OK`, `403 Unauthorized`

---

#### `POST /api/auth/change-password`

Changes the caller's password. `current_password` can be omitted when in the `must_change_password` flow (account just created by admin).

**Body**

| Field | Type | Required |
|---|---|---|
| `current_password` | string | no |
| `new_password` | string (min 8, 1 uppercase, 1 digit) | yes |

**Responses:** `200 OK`, `400 Validation`, `403 Unauthorized`

---

### Application Types

#### `GET /api/application-types`

Lists all application types. Available to all authenticated users.

**Responses:** `200 OK`, `403 Unauthorized`

---

#### `POST /api/application-types` — ADMIN only

Creates a new application type.

**Body**

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `code` | string (auto-uppercased) | yes |
| `description` | string | no |
| `is_active` | boolean (default `true`) | no |

**Responses:** `201 Created`, `400 Validation`, `403`, `403`

---

#### `GET /api/application-types/{id}` — ADMIN only

Returns a single application type by ID.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `PATCH /api/application-types/{id}` — ADMIN only

Partially updates an application type. All fields optional.

**Responses:** `200 OK`, `400 Validation`, `403`, `403`, `404`

---

#### `DELETE /api/application-types/{id}` — ADMIN only

Deletes an application type.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `POST /api/application-types/{typeId}/document-requirements` — ADMIN only

Adds a document requirement to an application type.

**Body**

| Field | Type | Required |
|---|---|---|
| `key` | string | yes |
| `label` | string | yes |
| `description` | string | no |
| `is_required` | boolean (default `true`) | no |
| `allowed_mime_types` | string[] | no |
| `max_size_bytes` | integer (default `5242880`) | no |
| `display_order` | integer (default `0`) | no |

**Responses:** `201 Created`, `400`, `403`, `403`, `404`

---

### Document Requirements

#### `PATCH /api/document-requirements/{id}` — ADMIN only

Partially updates a document requirement.

**Responses:** `200 OK`, `400`, `403`, `403`, `404`

---

#### `DELETE /api/document-requirements/{id}` — ADMIN only

Deletes a document requirement.

**Responses:** `200 OK`, `403`, `403`, `404`

---

### Applications

#### `POST /api/applications` — APPLICANT only

Submits a new license application in the initial workflow state.

**Body**

| Field | Type | Required |
|---|---|---|
| `application_type_id` | UUID | yes |

**Responses:** `201 Created`, `400`, `403`, `403`

---

#### `GET /api/applications`

Lists applications. APPLICANTs see only their own; STAFF and ADMIN see all. Supports pagination.

**Query params:** `page` (default 1), `limit` (default 20, max 100)

**Responses:** `200 OK`, `403`

---

#### `GET /api/applications/{id}`

Returns a single application. Access is enforced — applicants can only read their own.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `POST /api/applications/{id}/stage-decision`

Advances the application to the next workflow state. The caller must hold the workflow role required for the transition. `decisionType` is required when the transition has `requires_decision: true`.

**Body**

| Field | Type | Required |
|---|---|---|
| `toState` | ApplicationState | yes |
| `decisionType` | `APPROVED_STAGE` \| `REQUEST_INFO` | conditional |
| `decisionNote` | string | no |

**Responses:** `200 OK`, `400`, `403`, `403`, `404`, `422 Unprocessable`

---

#### `GET /api/applications/{id}/timeline`

Returns the ordered list of states the application has passed through.

**Responses:** `200 OK`, `403`, `404`

---

#### `GET /api/applications/{id}/stage-decisions`

Returns the full stage-decision history for an application.

**Responses:** `200 OK`, `403`, `404`

---

### Documents

#### `GET /api/applications/{id}/documents`

Lists all documents uploaded for an application. Accepts optional `?cycle=N` query to filter by submission cycle.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `POST /api/applications/{id}/documents/{requirement_key}`

Uploads a file for a specific document requirement. Uses `multipart/form-data`; the file field name must be `file`. MIME type and size are validated against the requirement record.

**Responses:** `201 Created`, `400`, `403`, `403`, `404`

---

#### `GET /api/applications/{id}/documents/{requirement_key}/history`

Returns all past uploads for a given requirement on this application.

**Responses:** `200 OK`, `403`, `403`, `404`

---

### Users

#### `POST /api/users` — ADMIN only

Creates a STAFF account. A temporary password is generated; the user must change it on first login. Workflow roles can be assigned at creation time.

**Body**

| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `full_name` | string | yes |
| `phone` | string | no |
| `workflow_roles` | `{ workflow_id, role }[]` (default `[]`) | no |

**Responses:** `201 Created`, `400`, `403`, `403`, `409`

---

#### `GET /api/users` — ADMIN only

Lists all staff users. Supports pagination.

**Query params:** `page`, `limit`

**Responses:** `200 OK`, `403`, `403`

---

#### `GET /api/users/workflow-roles/{id}` — ADMIN only

Returns a user with their assigned workflow roles.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `PATCH /api/users/{id}/status` — ADMIN only

Activates or deactivates a user account.

**Body**

| Field | Type | Required |
|---|---|---|
| `is_active` | boolean | yes |

**Responses:** `200 OK`, `403`, `403`, `404`

---

### Workflows

#### `GET /api/workflows` — ADMIN only

Lists all workflows.

**Responses:** `200 OK`, `403`, `403`

---

#### `POST /api/workflows` — ADMIN only

Creates a workflow. Automatically seeds default states (DRAFT → SUBMITTED → UNDER_REVIEW → PENDING_INFORMATION → PENDING_APPROVAL → APPROVED / REJECTED) and the initial DRAFT → SUBMITTED transition.

**Body**

| Field | Type | Required |
|---|---|---|
| `application_type_id` | UUID | yes |
| `name` | string | yes |
| `description` | string | no |

**Responses:** `201 Created`, `400`, `403`, `403`

---

#### `PATCH /api/workflows/{id}` — ADMIN only

Updates workflow name or description.

**Responses:** `200 OK`, `400`, `403`, `403`, `404`

---

#### `DELETE /api/workflows/{id}` — ADMIN only

Deletes a workflow.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `GET /api/workflows/{id}/states` — ADMIN only

Lists all states for a workflow.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `POST /api/workflows/{id}/states` — ADMIN only

Adds a state to a workflow. `key` is auto-uppercased.

**Body**

| Field | Type | Required |
|---|---|---|
| `key` | string | yes |
| `label` | string | yes |
| `description` | string | no |
| `is_initial` | boolean (default `false`) | no |
| `is_terminal` | boolean (default `false`) | no |
| `display_order` | integer (default `0`) | no |

**Responses:** `201 Created`, `400`, `403`, `403`

---

#### `PATCH /api/workflows/states/{id}` — ADMIN only

Partially updates a workflow state.

**Responses:** `200 OK`, `400`, `403`, `403`, `404`

---

#### `DELETE /api/workflows/states/{id}` — ADMIN only

Deletes a workflow state.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `GET /api/workflows/{id}/transitions` — ADMIN only

Lists all transitions for a workflow.

**Responses:** `200 OK`, `403`, `403`, `404`

---

#### `POST /api/workflows/{id}/transitions` — ADMIN only

Adds a transition to a workflow.

**Body**

| Field | Type | Required |
|---|---|---|
| `from_state_key` | string | yes |
| `to_state_key` | string | yes |
| `required_role` | WorkflowRole | yes |
| `requires_decision` | boolean (default `false`) | no |
| `label` | string | no |

**Responses:** `201 Created`, `400`, `403`, `403`

---

#### `PATCH /api/workflows/transitions/{id}` — ADMIN only

Partially updates a workflow transition.

**Responses:** `200 OK`, `400`, `403`, `403`, `404`

---

#### `DELETE /api/workflows/transitions/{id}` — ADMIN only

Deletes a workflow transition.

**Responses:** `200 OK`, `403`, `403`, `404`
