## ADDED Requirements

### Requirement: Unsaved-changes guard intercepts dialog close via X, Cancel and ESC
The system SHALL intercept any close attempt on `AdminEditDialogComponent` through the X button, the Cancel button or the ESC key. When the form has unsaved changes, the system SHALL open a `ConfirmDialogComponent` to confirm the discard before closing.

#### Scenario: Closing with no changes does not prompt
- **WHEN** the form is pristine (no fields modified since opening) and the user clicks X, Cancel or presses ESC
- **THEN** the dialog closes immediately without showing a confirmation

#### Scenario: Closing with changes prompts for confirmation
- **WHEN** the form is dirty (at least one field modified) and the user clicks X, Cancel or presses ESC
- **THEN** a confirmation dialog appears with title "Descartar cambios", message "Tienes cambios sin guardar. ¿Cerrar de todas formas?", confirm label "Descartar" and `danger: true`

#### Scenario: Confirming discard closes the dialog
- **WHEN** the confirmation dialog is open and the user clicks "Descartar"
- **THEN** the confirmation dialog closes and `AdminEditDialogComponent` emits `cancel`, allowing the parent to close the dialog

#### Scenario: Cancelling the discard keeps the dialog open
- **WHEN** the confirmation dialog is open and the user clicks "Cancelar" or presses ESC
- **THEN** the confirmation dialog closes and `AdminEditDialogComponent` remains open with all changes intact

#### Scenario: ESC inside the confirmation does not close the editor
- **WHEN** the confirmation dialog is open over `AdminEditDialogComponent` and the user presses ESC
- **THEN** only the confirmation dialog closes; `AdminEditDialogComponent` remains open

### Requirement: The guard uses Angular form dirty state as source of truth
The system SHALL determine dirty state from the reactive form's `dirty` property (`form.dirty`). The guard MUST NOT require an additional baseline snapshot or a custom tracking mechanism.

#### Scenario: Editing any field marks the form dirty
- **WHEN** the user modifies the value of any form control
- **THEN** `form.dirty` becomes true and the guard is armed

#### Scenario: Form hydration does not mark the form dirty
- **WHEN** the dialog loads an existing entity or template values into the form on open
- **THEN** `form.dirty` remains false until the user actually modifies a control

### Requirement: The guard does not intercept browser-level events
The system SHALL NOT register `beforeunload`, intercept tab close, or block navigation away from the page. The guard's scope is limited to `AdminEditDialogComponent` close actions.

#### Scenario: Browser refresh is not blocked
- **WHEN** the user presses F5 or closes the browser tab while the dialog is open with unsaved changes
- **THEN** the browser proceeds with the refresh/close without prompting; data loss is accepted