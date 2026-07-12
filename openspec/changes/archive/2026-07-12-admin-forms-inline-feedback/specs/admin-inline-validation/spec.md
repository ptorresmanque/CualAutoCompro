## ADDED Requirements

### Requirement: Field errors display inline after the control is touched
The system SHALL display validation error messages under each field of `AdminEditDialogComponent` once the control is `invalid && touched`. Errors MUST be rendered via `<mat-error>` inside the corresponding `<mat-form-field>`, so Material's error styling and positioning apply.

#### Scenario: Required field shows error after blur without value
- **WHEN** the dialog renders a required field, the user focuses it, blurs without entering a value
- **THEN** the field shows the message "Este campo es requerido" under the input

#### Scenario: Number field shows min/max error after blur with invalid value
- **WHEN** the dialog renders a number field with `Validators.min(1990)`, the user enters `1500` and blurs
- **THEN** the field shows a message about the minimum constraint under the input

#### Scenario: Errors do not appear while the user is typing
- **WHEN** the user focuses a required field and starts typing characters one by one without blurring
- **THEN** no error message appears under the input until blur occurs

### Requirement: Each field component exposes a MatError slot
The system SHALL make each custom field component (`app-text-field`, `app-number-field`, `app-toggle-field`, `app-select-search`, `app-image-upload-field`, `app-gallery-upload-field`, `app-multi-select-field`) project an `<ng-content>` slot for `<mat-error>` so the dialog can inject per-field error messages.

#### Scenario: Dialog injects a MatError inside a text field
- **WHEN** the dialog template renders `<app-text-field [control]="ctrl"><mat-error>Required</mat-error></app-text-field>`
- **THEN** the `<mat-error>` is rendered inside the field's `<mat-form-field>` and is visible when the control is invalid and touched

#### Scenario: Field without a MatError renders no error
- **WHEN** the dialog renders an `<app-number-field>` without injecting a `<mat-error>` slot
- **THEN** the field renders normally with no error slot

### Requirement: Submit re-evaluates all fields and shows their errors
The system SHALL call `markAllAsTouched()` on the form when the user clicks "Guardar" with an invalid form, so every invalid field shows its error inline (not only the one the user interacted with).

#### Scenario: Submitting an invalid form shows all invalid fields' errors
- **WHEN** the user opens a new dialog and clicks "Guardar" without filling any required field
- **THEN** every required field shows its "Este campo es requerido" error inline