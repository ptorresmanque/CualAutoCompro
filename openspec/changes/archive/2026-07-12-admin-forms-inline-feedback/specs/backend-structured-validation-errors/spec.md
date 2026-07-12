## ADDED Requirements

### Requirement: validation() helper accepts optional ZodIssue array
The system SHALL make `validation(msg, fields?)` in `apps/backend/src/shared/errors.ts` accept an optional second argument that, when present and non-empty, is exposed as `fields` on the resulting `AppError`. The error handler in `app.ts` MUST spread `fields` into the response payload under `error.fields`.

#### Scenario: validation() without fields returns same shape as before
- **WHEN** a controller calls `validation("Bad input")` with no second argument
- **THEN** the response error is `{ code: "VALIDATION", message: "Bad input" }` (no `fields` key)

#### Scenario: validation() with fields spreads fields into the response
- **WHEN** a controller calls `validation("Datos inválidos", [{ path: ["name"], message: "Required" }])`
- **THEN** the response body is `{ data: null, error: { code: "VALIDATION", message: "Datos inválidos", fields: [{ path: ["name"], message: "Required" }] } }`

### Requirement: Controllers using safeParse propagate ZodIssue arrays
Every controller that calls `schema.safeParse(req.body)` SHALL, when validation fails, call `validation("Datos inválidos", parsed.error.issues)` instead of concatenating `parsed.error.issues.map(i => i.message).join("; ")`.

#### Scenario: Brand controller returns structured error on invalid input
- **WHEN** the brand controller receives a POST with `{}` (missing `name`)
- **THEN** the response body is `{ data: null, error: { code: "VALIDATION", message: "Datos inválidos", fields: [{ path: ["name"], message: "..." }, ...] } }`

#### Scenario: Version controller returns structured error on invalid year
- **WHEN** the version controller receives a POST with `year: 1500`
- **THEN** the response body's `error.fields` includes an entry with `path: ["year"]` and a message about the minimum constraint

### Requirement: error.fields is preserved through the response chain
The system SHALL propagate `fields` from `AppError.fields` (or its `details.fields`) through the JSON response in `app.ts` so the client receives the structured data without losing fields due to spread or serialization issues.

#### Scenario: Fields with nested arrays serialize correctly
- **WHEN** the backend sends `fields: [{ path: ["x", "y", 0], message: "..." }]`
- **THEN** the JSON response preserves the array structure as `path: ["x", "y", 0]`

#### Scenario: Empty fields array is omitted
- **WHEN** `validation("...", [])` is called with an empty array
- **THEN** the response error does NOT include a `fields` key (omitted via the `&& fields.length > 0` guard)