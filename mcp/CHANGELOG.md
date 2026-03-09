# Changelog

All notable changes to the Planning Game MCP server will be documented in this file.

## [1.14.0] - 2026-03-10

### Added
- **Pre-flight checks**: `initFirebase()` now validates `serviceAccountKey.json` exists, is valid JSON, and contains `project_id` before attempting to initialize. Clear error messages with fix instructions are emitted to stderr on failure.
- **`pg_doctor` tool**: Comprehensive diagnostic tool that runs 8 checks — Node.js version, Firebase credentials, database connectivity, npm dependencies, user configuration, MCP version, instance configuration, and git availability. Returns structured HEALTHY/DEGRADED/UNHEALTHY report.
- **`pg_config` tool**: View MCP server configuration including instance name, Firebase project ID, credentials path, user config, and environment variables. Supports `action: "get"` with a specific key for targeted queries.
- **Startup error handling**: `index.js` now wraps `initFirebase()` and `server.connect()` in try-catch blocks, exits with code 1 and actionable error messages instead of crashing silently.

## [1.13.1] - 2026-03-09

### Fixed
- Minor bug fixes and stability improvements.

## [1.13.0] - 2026-03-01

### Added
- User provisioning tool (`provision_user`)
- User deletion tool (`delete_user`)
- Plan proposals tools (full CRUD)
- Development plans tools (full CRUD)

## [1.12.0] - 2026-02-15

### Added
- Multi-instance support via `MCP_INSTANCE_DIR`
- Version checking and `update_mcp` tool
- `publish_mcp_version` for Firebase-based update notifications
- `discover_project` tool for repo URL-based project lookup

## [1.11.0] - 2026-02-01

### Added
- ADR tools (Architecture Decision Records)
- Global configuration tools
- Fuzzy project ID resolution
- Pipeline status tracking enforcement

## [1.10.0] - 2026-01-15

### Added
- Initial public release
- 25+ tools for project, card, sprint, and team management
- Firebase Realtime Database integration
- Status transition validation
- WIP limit enforcement
