## ADDED Requirements

### Requirement: AdminEditDialogComponent autofocuses the first editable field on open
The system SHALL programmatically focus the first editable field of `AdminEditDialogComponent` once the template has hydrated (after `loading()` becomes `false`). The focused element SHALL be the first `.dialog-field` wrapper rendered in the form, and focus MUST NOT move to the close button or any toolbar element.

#### Scenario: First field receives focus after hydration
- **WHEN** the dialog finishes loading the template and renders the form fields
- **THEN** the first form field (typically `name`, `brandId`, `fuelType` or the first field in `FIELD_METAS`) receives DOM focus within the same microtask

#### Scenario: Focus is not applied during loading
- **WHEN** the dialog is in `loading() === true` state
- **THEN** no focus is moved; focus remains on the trigger element (e.g. the "+ Nueva" button or row action that opened the dialog)

#### Scenario: Focus is only applied once per open
- **WHEN** the user has interacted with the form and focus has moved away
- **THEN** the system MUST NOT re-focus the first field on subsequent state changes (e.g. JSON tab toggle)

### Requirement: Tab order follows the natural DOM order of fields
The system SHALL NOT override the default Tab traversal inside `AdminEditDialogComponent`. The tab order SHALL follow the visual order of fields in the form grid (top-to-bottom, left-to-right at the 2-column breakpoint).

#### Scenario: Tab traversal visits fields in visual order
- **WHEN** the user presses Tab repeatedly starting from the first field
- **THEN** focus moves through each field in the order they appear in the grid, then to the toolbar actions (tabs, close), then to the Cancel and Guardar buttons at the bottom

#### Scenario: Shift+Tab traverses in reverse
- **WHEN** the user presses Shift+Tab from any field
- **THEN** focus moves to the previous field in visual order

### Requirement: ESC closes the dialog through the unsaved-changes guard
The system SHALL listen for the `Escape` key while `AdminEditDialogComponent` is mounted and route the event through the same close path as the X and Cancel buttons. ESC MUST respect the unsaved-changes guard.

#### Scenario: ESC closes a pristine dialog immediately
- **WHEN** the dialog is pristine and the user presses ESC
- **THEN** the dialog closes immediately without prompting

#### Scenario: ESC prompts when there are unsaved changes
- **WHEN** the dialog is dirty and the user presses ESC
- **THEN** the unsaved-changes confirmation dialog opens