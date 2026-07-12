## ADDED Requirements

### Requirement: Required fields display a red asterisk in the label
The system SHALL display a red asterisk (`*`) next to the field label in `AdminEditDialogComponent` for every field where `FieldMeta.optional` is `false` or unset. The asterisk MUST be visible to sighted users and exposed via `aria-label="requerido"` for screen readers.

#### Scenario: Required field shows asterisk
- **WHEN** the dialog renders a field with `meta.optional === false`
- **THEN** the field label includes a red asterisk immediately after the label text and the wrapper span has `aria-label="requerido"`

#### Scenario: Field with explicit required kind shows asterisk
- **WHEN** the dialog renders any field of kind `text`, `number`, `boolean`, `foreignKey`, `enumWithOther`, `imageUrl`, `gallery`, `multiSelect` or `array` whose `meta.optional` is not set
- **THEN** the field is treated as required and shows the asterisk

### Requirement: Optional fields display an "opcional" badge in the label
The system SHALL display a small uppercase "opcional" badge next to the field label in `AdminEditDialogComponent` for every field where `FieldMeta.optional` is `true`. The badge MUST be visually subordinate to the label and exposed via `aria-label="opcional"`.

#### Scenario: Optional field shows badge
- **WHEN** the dialog renders a field with `meta.optional === true`
- **THEN** the field label includes a small "opcional" badge after the label text and the wrapper span has `aria-label="opcional"`

#### Scenario: Required and optional markers are mutually exclusive
- **WHEN** the dialog renders any field
- **THEN** the field shows either the asterisk or the "opcional" badge, never both

### Requirement: Required marker derives from FieldMeta without per-entity logic
The system SHALL derive the required/optional marker exclusively from `FieldMeta.optional` in `entity-schemas.ts`. Adding a new required field MUST NOT require changes to `AdminEditDialogComponent`; setting `optional: true` MUST be sufficient to mark a field as optional.

#### Scenario: New required field is automatically marked
- **WHEN** a new field is added to `FIELD_METAS` without setting `optional`
- **THEN** the field is rendered with the asterisk in the dialog

#### Scenario: New optional field is automatically marked
- **WHEN** a new field is added to `FIELD_METAS` with `optional: true`
- **THEN** the field is rendered with the "opcional" badge in the dialog

### Requirement: Required fields expose aria-required to assistive technologies
The system SHALL set `aria-required="true"` on the input element of every required field so screen readers announce the field as required. The system SHALL NOT set `aria-required` on optional fields.

#### Scenario: Required input has aria-required set
- **WHEN** a screen reader focuses a required field input
- **THEN** the input is announced as required

#### Scenario: Optional input does not have aria-required set
- **WHEN** a screen reader focuses an optional field input
- **THEN** the input is announced without the "required" suffix