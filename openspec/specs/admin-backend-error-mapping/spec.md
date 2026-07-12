# admin-backend-error-mapping

Map structured backend `VALIDATION` errors (`error.fields[].path`) to the corresponding `FormControl` in `AdminEditDialogComponent` so errors render inline per field.

## Purpose

When the backend rejects a save with field-level validation errors, those errors should highlight the offending fields in the dialog — not just appear in a generic banner. Build on the structured error format from `backend-structured-validation-errors`.

## Requirements

### Requirement: ApiService exposes typed backend errors with structured fields
The system SHALL make `ApiService` (`apps/frontend/src/app/core/api.service.ts`) throw an `ApiCallError` when the backend response has `error !== null`. The `ApiCallError.backend.fields` SHALL be a typed array of `{ path: (string | number)[]; message: string }` when the backend includes them.

#### Scenario: Successful response resolves with data
- **WHEN** the backend returns `{ data: { id: 1 }, error: null }`
- **THEN** the corresponding `ApiService.get/post/patch/delete` method resolves with the data (not the wrapper)

#### Scenario: Error response throws ApiCallError with fields
- **WHEN** the backend returns `{ data: null, error: { code: "VALIDATION", message: "Datos inválidos", fields: [{ path: ["name"], message: "Required" }] } }`
- **THEN** the method throws `ApiCallError` with `backend.fields = [{ path: ["name"], message: "Required" }]`

#### Scenario: Error response without fields still throws ApiCallError
- **WHEN** the backend returns `{ data: null, error: { code: "NOT_FOUND", message: "No encontrado" } }` (no `fields`)
- **THEN** the method throws `ApiCallError` with `backend.fields = undefined`

### Requirement: Admin components map backend fields to FormControls on submit failure
When an admin component's `onSave` (or equivalent) catches an `ApiCallError` with `code === 'VALIDATION'`, the system SHALL call a shared helper that applies each `fields[i]` to the corresponding `FormControl` via `setErrors({ backend: msg })` and `markAsTouched()`.

#### Scenario: Single-field error maps to its control
- **WHEN** the backend returns `fields: [{ path: ["name"], message: "Required" }]` for a brand save
- **THEN** the `name` `FormControl` has `errors.backend = "Required"` and `touched = true`, and the inline error "Required" appears under the name input

#### Scenario: Multi-field errors map to all affected controls
- **WHEN** the backend returns `fields: [{ path: ["name"], message: "Required" }, { path: ["year"], message: "Out of range" }]`
- **THEN** both `name` and `year` controls are marked with their respective backend errors

#### Scenario: Unknown field path is ignored
- **WHEN** the backend returns `fields: [{ path: ["nonexistent"], message: "..." }]`
- **THEN** the helper skips the field without throwing; the form remains usable

#### Scenario: Nested path is skipped (only first segment is used)
- **WHEN** the backend returns `fields: [{ path: ["address", "street"], message: "..." }]`
- **THEN** the helper logs a warning and does not crash; the field is not mapped (current dialog has no nested objects)

### Requirement: Successful save clears all backend errors
After a successful save in an admin component, the system SHALL clear any backend error markers from the form so the next time the dialog opens, it starts clean.

#### Scenario: Errors cleared after successful save
- **WHEN** the user corrects a field that had a backend error and saves successfully
- **THEN** the dialog closes and the next time it opens for the same entity, no backend errors are present on the form