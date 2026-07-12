## ADDED Requirements

### Requirement: AdminEditDialogComponent groups fields into sections by FieldMeta.group
The system SHALL divide the fields rendered by `AdminEditDialogComponent` into sections based on the `group` property of each `FieldMeta`. Fields with the same `group` value SHALL appear under the same section. Fields without a `group` SHALL appear under an unlabeled "default" section (rendered without a section header).

#### Scenario: Version form renders one section per unique group
- **WHEN** the dialog renders a `version` form whose `FIELD_METAS` define groups "Identificación", "Motor", "Consumo"
- **THEN** the dialog renders three sections, each with a header containing the group label, containing the corresponding fields in order

#### Scenario: Brand form with no groups renders as a single unlabeled section
- **WHEN** the dialog renders a `brand` form whose `FIELD_METAS` have no `group` property
- **THEN** the dialog renders all fields in one section without a section header (identical visual to the current single-grid layout)

### Requirement: Section order is deterministic and follows first appearance
The system SHALL order sections in the dialog by the first occurrence of each `group` value in the `FIELD_METAS` array. A field's position within a section SHALL follow its position in the original `FIELD_METAS` order.

#### Scenario: Sections appear in FIELD_METAS order
- **WHEN** `FIELD_METAS.version` lists fields in order [modelId, name, transmission, fuel, ...]
- **THEN** the dialog renders sections "Identificación" (modelId, name) before "Motor" (transmission, fuel), regardless of alphabetical group name

### Requirement: Each section uses its own grid layout
The system SHALL render each section's fields in an independent 1-2 column grid, matching the visual density of the current single-grid dialog.

#### Scenario: Version section with many fields uses 2-column grid
- **WHEN** the "Motor" section contains 5 fields
- **THEN** the fields render in a 2-column grid on viewports >= 640px (3 rows × 2 cols) and 1-column on mobile

### Requirement: Adding a group to a field requires no dialog changes
The system SHALL derive section membership exclusively from `FieldMeta.group`. Adding a `group` to a field in `FIELD_METAS` MUST be sufficient to move it to a new section without touching `AdminEditDialogComponent`.

#### Scenario: Adding a group to a field moves it to a new section
- **WHEN** `version.trunkLiters` is updated from no `group` to `group: 'Dimensiones'`
- **THEN** the dialog renders `trunkLiters` under a "Dimensiones" header instead of in the default unlabeled section