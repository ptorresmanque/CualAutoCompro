## ADDED Requirements

### Requirement: FieldMeta supports an optional help text
The system SHALL extend `FieldMeta` in `entity-schemas.ts` with an optional `help?: string` field. When present, the dialog SHALL render the help text as a discreet line between the field label and the input.

#### Scenario: Field with help shows the help text
- **WHEN** a `FieldMeta` has `help: 'Capacidad del estanque en litros'`
- **THEN** the dialog renders the help text between the label and the input element, in a smaller and lower-contrast style than the label

#### Scenario: Field without help shows nothing extra
- **WHEN** a `FieldMeta` has no `help` property
- **THEN** the dialog renders the field normally with no help line

### Requirement: Help text is purely informational, not interactive
The system SHALL render the help text as static text (no input, no link). Help text MUST NOT be confused with the label or with an error message.

#### Scenario: Help text is visually distinct from label and error
- **WHEN** the dialog renders a field with both `help` and an active error
- **THEN** the help text remains visible above the input, and the error message renders below the input, both with different styling

#### Scenario: Help text disappears when the field has an active error
- **WHEN** the field is `invalid && touched` and has a `help` configured
- **THEN** the help text is hidden by the field's error state to avoid visual clutter; it reappears when the error is cleared

### Requirement: Help text is configurable per field without dialog changes
The system SHALL derive the help text exclusively from `FieldMeta.help`. Adding `help` to an existing field MUST NOT require changes to `AdminEditDialogComponent`, the field components, or the test suite.

#### Scenario: Adding help to a field automatically renders it
- **WHEN** `version.circulationPermitClp` is updated to include `help: 'Permiso de circulación anual'`
- **THEN** the version form renders the help text below the label without further code changes