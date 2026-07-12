## ADDED Requirements

### Requirement: Sticky section nav renders when there are 3 or more sections
The system SHALL render a sticky vertical navigation panel on the right side of the dialog body whenever the form has 3 or more sections. Each section SHALL appear as a button in the nav. Clicking a button SHALL scroll the corresponding section into view.

#### Scenario: Version form shows the section nav with 9 buttons
- **WHEN** the dialog renders a `version` form with 9 sections
- **THEN** the dialog shows a sticky nav with 9 buttons (one per section label) on viewports >= 640px

#### Scenario: Brand form with one section does not show the nav
- **WHEN** the dialog renders a `brand` form with a single section
- **THEN** the dialog does not render the section nav

### Requirement: Section nav highlights the currently visible section
The system SHALL use `IntersectionObserver` to detect which section is currently visible in the viewport and visually highlight the corresponding nav button. Only one button SHALL be highlighted at a time.

#### Scenario: Active section updates as the user scrolls
- **WHEN** the user scrolls so that the "Motor" section header is at the top of the dialog body
- **THEN** the "Motor" button in the section nav has the highlighted/active class

#### Scenario: Active state clears when no section is visible
- **WHEN** the user scrolls to a position where no section header is in the viewport
- **THEN** no nav button is highlighted

### Requirement: Clicking a nav button scrolls to that section
The system SHALL scroll the corresponding section into view (smooth scroll, aligned to top) when the user clicks a nav button.

#### Scenario: Click on "Motor" scrolls to the Motor section
- **WHEN** the user clicks the "Motor" button in the section nav
- **THEN** the dialog body scrolls so that the "Motor" section header is at the top of the visible area

### Requirement: Section nav is hidden on narrow viewports
The system SHALL hide the section nav on viewports narrower than 640px to avoid taking up horizontal space on mobile devices.

#### Scenario: Section nav hidden on mobile viewport
- **WHEN** the dialog is rendered at a viewport width of 480px
- **THEN** the section nav is not visible (display: none via CSS)