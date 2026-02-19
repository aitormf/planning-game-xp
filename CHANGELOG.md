# Changelog

All notable changes to this project will be documented in this file.
Auto-generated from git commits on each build.

## [Unreleased]

### Added

- Add Trash tab to admin page for viewing deleted cards
- Lock project name and abbreviation when cards exist
- Show notification when deep link cardId not found
- Default table sort by priority (highest first)

### Testing

- Add E2E dark theme tests (toggle, persistence, contrast)
- Add ThemeManagerService unit tests (34 tests)

## [1.121.0] - 2026-02-18

### Added

- Auto-generate changelog from git commits on each build

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


---

> Versions below were recovered from Planning Game task history.
> Git history was lost when the repository was reset (Feb 2026).

## [1.60.0 - 1.116.0] - 2026-01 / 2026-02

### Added

- PLN-TSK-0003: Markdown support in card descriptions
- PLN-TSK-0031: Mention users in task notes (@user)
- PLN-TSK-0037: Developer backlog view in WIP page
- PLN-TSK-0040: AI-optimized descriptions for tasks
- PLN-TSK-0043: Upload tasks and bugs from documents via AI
- PLN-TSK-0046: Email + push notification to validator on "To Validate"
- PLN-TSK-0048: Real-time reactivity in task and bug lists
- PLN-TSK-0049: Assigned bugs appear in developer backlog
- PLN-TSK-0053: Mandatory field validation when blocking a task
- PLN-TSK-0055: Weekly email digest - single email per user
- PLN-TSK-0058: Stakeholder column in proposals table view
- PLN-TSK-0063: Descriptive priority visualization
- PLN-TSK-0064: Save implementation plan in task via MCP
- PLN-TSK-0065: Auto-assign BecarIA as co-developer via MCP
- PLN-TSK-0066: MCP list_developers returns global developer IDs
- PLN-TSK-0067: Co-developer field in Bug cards
- PLN-TSK-0068: Reorganize fields in Bug expanded view
- PLN-TSK-0069: Notify bug creator when bug moves to Fixed
- PLN-TSK-0071: Prominent "Improve with AI" button in ProposalCard
- PLN-TSK-0072: Cloud Function to validate task status transitions
- PLN-TSK-0075: implementationNotes field for development summary
- PLN-TSK-0077: Copy task and bug IDs to clipboard
- PLN-TSK-0078: Type validation in MCP server
- PLN-TSK-0079: Automated dev environment setup (MCPs, SonarQube, DevTools)
- PLN-TSK-0080: Allow developers to create and edit documentation
- PLN-TSK-0081: Allow developers and stakeholders to use Uploads section
- PLN-TSK-0082: Documentation buttons in Tasks view
- PLN-TSK-0083: Separate MCP server into independent repository
- PLN-TSK-0084: Markdown description summary in projects table
- PLN-TSK-0085: Remove Project column, add Notes column in table view
- PLN-TSK-0086: Co-developer and co-validator badges
- PLN-TSK-0087: Immutable startDate for task traceability
- PLN-TSK-0088: Optimized Firebase views to reduce data traffic
- PLN-TSK-0089: Migration to populate optimized views with existing data
- PLN-TSK-0090: Frontend uses optimized Firebase views
- PLN-TSK-0093: Centralize card schemas to eliminate field duplication
- PLN-TSK-0099: Friendly message when OAuth credentials expire
- PLN-TSK-0100: Search tasks and bugs by number or title
- PLN-TSK-0101: Real-time new version notification
- PLN-TSK-0102: Date fields and reopen cycle in tasks
- PLN-TSK-0103: Strict mandatory field validation when leaving To Do
- PLN-TSK-0104: Automated installation and setup system
- PLN-TSK-0106: AppEventBus - centralized event system (Phase 1)
- PLN-TSK-0107: Refactor ViewFactory - eliminate setTimeout (Phase 2)
- PLN-TSK-0108: Refactor BaseFilters - eliminate setTimeout (Phase 3)
- PLN-TSK-0109: Refactor AppController - eliminate setTimeout (Phase 4)
- PLN-TSK-0110: Audit Lit components - eliminate setTimeout (Phase 5)
- PLN-TSK-0111: AI Code Review with configurable prompt from Planning Game
- PLN-TSK-0114: Replace agents textarea with business context field
- PLN-TSK-0117: Specs & Plan tab in each task card
- PLN-TSK-0119: rulesync-geniova repo with team base rules
- PLN-TSK-0121: rulesync init-project command for Claude Code
- PLN-TSK-0122: Implementation plan badge on task cards
- PLN-TSK-0125: Refactor admin.astro with tabs/sections system
- PLN-TSK-0126: Move admin.astro content to Firebase section
- PLN-TSK-0127: Reports section with date filters
- PLN-TSK-0128: ReportService for development statistics
- PLN-TSK-0129: Average task development time calculation
- PLN-TSK-0130: Average bug resolution time calculation
- PLN-TSK-0131: DeveloperReportCard component for statistics
- PLN-TSK-0132: Summary statistics table by project
- PLN-TSK-0133: PDF report generator for ISO audits
- PLN-TSK-0134: Multi-project selector in report filters
- PLN-TSK-0136: Dark Theme - Phase 0: Toggle button + CSS infrastructure
- PLN-TSK-0137: Dark Theme - Phase 1: Critical components
- PLN-TSK-0138: Dark Theme - Phase 2: Secondary cards
- PLN-TSK-0139: Dark Theme - Phase 3: UI components
- PLN-TSK-0140: Dark Theme - Phase 4: Astro pages
- PLN-TSK-0145: Automatic timestamps on task and bug status changes
- PLN-TSK-0148: Auto-assign startDate when moving task to In Progress
- PLN-TSK-0149: Implementation plan validation flow when creating tasks
- PLN-TSK-0150: List available epics when task has no epic or invalid epic
- PLN-TSK-0151: Auto-assign validator when creating tasks via MCP
- PLN-TSK-0152: Auto-assign base team when creating projects via MCP
- PLN-TSK-0153: Identify MCP user via mcp.user.json, create MAINTENANCE epic
- PLN-TSK-0154: setup_mcp_user tool to auto-generate mcp.user.json
- PLN-TSK-0157: Notify Portal de Incidencias when portal-created bug is resolved
- PLN-TSK-0158: Fix on-card-to-validate tests (missing PUBLIC_APP_URL env var)
- PLN-TSK-0162: Developer selection checkboxes for ISO PDF export

### Changed

- PLN-TSK-0050: Automatic date updates in Bugs
- PLN-TSK-0051: WIP history saved to /wipHistory

## [1.3.0 - 1.59.0] - 2025

### Added

- PLN-TSK-0001: Notification bell component
- PLN-TSK-0004: Support developers field in tasks
- PLN-TSK-0006: Detect unsaved changes in Card edit mode
- PLN-TSK-0009: Deep links with card IDs
- PLN-TSK-0010: Task view filters
- PLN-TSK-0012: File uploads to Firebase Storage in Bugs
- PLN-TSK-0013: Card change history viewer
- PLN-TSK-0014: Sprint statistics dashboard
- PLN-TSK-0015: Task dependency field (related tasks)
- PLN-TSK-0018: Trash/recycle bin view
- PLN-TSK-0019: Convert proposals to Tasks
- PLN-TSK-0022: Push notifications via FCM
- PLN-TSK-0023: Card IDs system
- PLN-TSK-0024: Display card-id attribute on cards
- PLN-TSK-0029: Project switcher from title
- PLN-TSK-0030: File attachments in Bug cards
- PLN-TSK-0032: Direct link to task from notifications
- PLN-TSK-0033: Table view with sortable columns and filters
- PLN-TSK-0034: WIP (Work In Progress) section
- PLN-TSK-0036: Global proposals list across all projects
- PLN-TSK-0039: App download statistics

## [1.2.0] - 2025-09

### Added

- Architectural refactoring with centralized services
- Event delegation system replacing scattered event listeners
- PermissionService, FilterService, ModalService
- Factory patterns for card creation and filtering

### Changed

- Service-oriented architecture with dependency injection
- Unified filter logic across all card types

## [1.1.0] - 2025-06

### Added

- Project management system with admin permissions
- Real-time notification system via Firebase RTDB
- Developer name-to-email mapping
- Point recalculation when scoring system changes
- Stakeholder management

### Fixed

- "[object Object]" display in validator select
- Notification overflow with infinite lists

## [1.0.0] - 2025-03

### Added

- Complete card system: Tasks, Bugs, Epics, Sprints, Proposals, QA
- Multiple views: List, Kanban, Table, Gantt, Sprint
- Firebase Realtime Database with real-time updates
- Role-based permissions (Admin, User, Consultant)
- Push notifications via FCM
- File attachments via Firebase Storage
- Sprint management with point tracking
- Microsoft authentication
- PWA with service worker
