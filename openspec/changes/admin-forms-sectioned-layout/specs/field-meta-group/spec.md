## ADDED Requirements

### Requirement: FieldMeta supports an optional group string
The system SHALL extend `FieldMeta` in `entity-schemas.ts` with an optional `group?: string` field. When present, the value identifies the section the field belongs to. When absent, the field belongs to the default unlabeled section.

#### Scenario: Field with group "Motor" is classified under that section
- **WHEN** a `FieldMeta` entry has `group: 'Motor'`
- **THEN** the dialog renders that field under a section labeled "Motor"

#### Scenario: Field without group is in the default section
- **WHEN** a `FieldMeta` entry has no `group` property
- **THEN** the dialog renders that field without a section label, mixed with other ungrouped fields

### Requirement: Group is a free-form string, not an enum
The system SHALL treat `group` as an opaque string with no predefined set of valid values. Each entity's `FIELD_METAS` defines its own set of group labels.

#### Scenario: Two entities can have different group names
- **WHEN** `FIELD_METAS.version` uses groups like "Motor" and "Consumo", while `FIELD_METAS.brand` has no groups
- **THEN** both entities render correctly without sharing or conflicting group definitions

### Requirement: Group labels are rendered verbatim
The system SHALL display the `group` string exactly as configured in `FIELD_METAS`, without transformation. Capitalization, accents, and spacing are preserved.

#### Scenario: Accented group label renders correctly
- **WHEN** a `FieldMeta` has `group: 'Identificación'`
- **THEN** the section header shows "Identificación" (with accent and capital I) as configured