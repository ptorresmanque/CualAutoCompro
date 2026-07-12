# admin-confirm-dialog

Reusable confirmation dialog used by destructive admin actions (replaces `window.confirm()`).
Lives at `apps/frontend/src/app/shared/ui/confirm-dialog.component`.

## Purpose

Provide a consistent, accessible confirmation dialog for admin destructive actions (delete, discard, etc.) that aligns with the Material Design language used throughout the admin panel, replacing the browser-native `window.confirm()` dialog.

## Requirements

### Requirement: Confirm dialog renders title, message and action labels
The system SHALL provide a reusable `ConfirmDialogComponent` opened via `MatDialog.open()` that renders a title, a message body, a confirm button and a cancel button. The confirm and cancel button labels MUST be configurable through `MAT_DIALOG_DATA`, defaulting to "Confirmar" and "Cancelar" respectively.

#### Scenario: Dialog renders with provided data
- **WHEN** the caller opens the dialog with `{ title: 'Eliminar marca', message: '¿Eliminar marca "Toyota"?', confirmLabel: 'Eliminar', cancelLabel: 'Cancelar' }`
- **THEN** the dialog shows the title "Eliminar marca", the message "¿Eliminar marca "Toyota"?", a confirm button labeled "Eliminar" and a cancel button labeled "Cancelar"

#### Scenario: Default labels are applied when omitted
- **WHEN** the caller opens the dialog with only `{ title: 'Confirmar', message: '¿Continuar?' }`
- **THEN** the confirm button is labeled "Confirmar" and the cancel button is labeled "Cancelar"

### Requirement: Confirm dialog returns true on confirm and false on cancel
The system SHALL close the dialog and resolve `afterClosed()` with `true` when the user clicks the confirm button, and with `false` when the user clicks the cancel button or presses the ESC key. The dialog MUST NOT close on backdrop click (to prevent accidental destructive confirms).

#### Scenario: User confirms the action
- **WHEN** the user clicks the confirm button
- **THEN** `afterClosed()` resolves with `true`

#### Scenario: User cancels the action
- **WHEN** the user clicks the cancel button
- **THEN** `afterClosed()` resolves with `false`

#### Scenario: User dismisses with ESC
- **WHEN** the dialog has focus and the user presses ESC
- **THEN** `afterClosed()` resolves with `false`

#### Scenario: Backdrop click does not close the dialog
- **WHEN** the user clicks the backdrop outside the dialog content
- **THEN** the dialog remains open and `afterClosed()` does not resolve

### Requirement: Confirm dialog supports danger styling for destructive actions
The system SHALL apply error-color styling to the confirm button when `data.danger === true`, so destructive actions (e.g. delete) are visually distinct from neutral confirmations.

#### Scenario: Danger styling applied when requested
- **WHEN** the caller opens the dialog with `danger: true`
- **THEN** the confirm button is rendered with the error color from the Material theme

#### Scenario: Default styling when danger is not requested
- **WHEN** the caller opens the dialog with `danger: false` or omitted
- **THEN** the confirm button uses the default primary color