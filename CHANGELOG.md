# Changelog

All notable changes to this project will be documented in this file.
Auto-generated from git commits on each build.

## [1.120.2] - 2026-02-17

### Fixed

- Improve prompt save UX with overwrite option and auto-assign validator

## [1.120.0] - 2026-02-17

### Added

- Add prompt persistence in Tasks Generator with autosave and named saves

## [1.119.1] - 2026-02-17

### Testing

- Add unit tests for email-sanitizer, workday-utils, cache-manager, developer-normalizer

## [1.119.0] - 2026-02-17

### Added

- Version button in footer opens changelog modal

## [1.118.1] - 2026-02-17

### Fixed

- Dark mode in Tasks Generator by removing ThemeVariables from shadow DOM

## [1.118.0] - 2026-02-17

### Added

- Rename Uploads tab to Tasks Generator with text input support

## [1.117.8] - 2026-02-17

### Changed

- Remove unauthorized Tickets section


## [1.2.0] - 2025-09

### Added

- Architectural refactoring v1.2.0 with centralized services
- Event delegation system replacing scattered event listeners
- Permission service eliminating code duplication across components
- Filter service with generic filtering for all card types
- Modal service with stacking, confirmation, and form modals

### Changed

- Migrated from individual event listeners to event delegation pattern
- Service-oriented architecture with dependency injection
- Unified filter logic across all card types

## [1.1.0] - 2025-06

### Added

- Project management system with admin permissions
- Real-time notification system via Firebase Realtime Database
- Developer name-to-email mapping for selects
- Point recalculation when scoring system changes
- Stakeholder management with name and email support

### Fixed

- "[object Object]" display in validator select
- Notification overflow with infinite lists

## [1.0.0] - 2025-03

### Added

- Complete card system: Tasks, Bugs, Epics, Sprints, Proposals, QA
- Multiple views: List, Kanban, Table, Gantt, Sprint
- Firebase Realtime Database integration with real-time updates
- Role-based permissions (Admin, User, Consultant)
- Push notifications via Firebase Cloud Messaging
- File attachments via Firebase Storage
- Advanced filtering and search
- Sprint management with point tracking
- Microsoft authentication integration
- PWA with service worker
