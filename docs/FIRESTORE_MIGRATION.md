# Firestore Migration Architecture

## Overview

Migration from Firebase Realtime Database (RTDB) to Firestore using a Data Access Layer (DAL) abstraction pattern. Enables zero-downtime migration with rollback capability at each phase.

## Data Model Mapping

| RTDB Path | Firestore Path |
|-----------|---------------|
| `/projects/{projectId}` | `projects/{projectId}` |
| `/cards/{projectId}/TASKS_{projectId}/{id}` | `projects/{projectId}/tasks/{id}` |
| `/cards/{projectId}/BUGS_{projectId}/{id}` | `projects/{projectId}/bugs/{id}` |
| `/cards/{projectId}/EPICS_{projectId}/{id}` | `projects/{projectId}/epics/{id}` |
| `/cards/{projectId}/PROPOSALS_{projectId}/{id}` | `projects/{projectId}/proposals/{id}` |
| `/cards/{projectId}/SPRINTS_{projectId}/{id}` | `projects/{projectId}/sprints/{id}` |
| `/cards/{projectId}/QA_{projectId}/{id}` | `projects/{projectId}/qa/{id}` |
| `/projectCounters/{key}` | `projectCounters/{key}` (already in Firestore) |

## DAL Architecture

```
shared/dal/
  index.js                          # Public API
  base-repository.js                # Abstract base (read/write/subscribe)
  card-repository.js                # Card CRUD interface
  project-repository.js             # Project CRUD interface
  counter-service.js                # Atomic ID generation interface
  repository-factory.js             # Registry-based factory
  dual-write-card-repository.js     # Writes to both backends
  dual-write-project-repository.js
  read-switch-card-repository.js    # Reads from Firestore, fallback RTDB
  read-switch-project-repository.js
  rtdb/                             # RTDB implementation (DEPRECATED)
    base-rtdb-repository.js
    rtdb-card-repository.js
    rtdb-project-repository.js
    rtdb-counter-service.js
  firestore/                        # Firestore implementation
    base-firestore-repository.js
    firestore-card-repository.js
    firestore-project-repository.js
```

## Factory Modes

| Mode | Factory Function | Reads | Writes | Use Case |
|------|-----------------|-------|--------|----------|
| RTDB-only | `createRepositories('rtdb')` | RTDB | RTDB | Current production |
| Dual-write | `createDualWriteRepositories()` | RTDB | RTDB + Firestore | Phase 1: sync data |
| Read-switch | `createReadSwitchRepositories()` | Firestore (fallback RTDB) | RTDB + Firestore | Phase 2: verify Firestore |
| Firestore-only | `createFirestoreOnlyRepositories()` | Firestore | Firestore | Phase 3: target state |

## Migration Phases

### Phase 1: Infrastructure (COMPLETE)
- [x] DAL abstract interfaces
- [x] RTDB backend implementation
- [x] Firestore backend implementation
- [x] Cloud Function sync triggers (`syncCardToFirestore`, `syncProjectToFirestore`)
- [x] Backfill script (`scripts/backfill-rtdb-to-firestore.js`)

### Phase 2: Dual Write (COMPLETE)
- [x] DualWriteCardRepository / DualWriteProjectRepository
- [x] Shadow write error handling (logged, non-blocking)
- [x] Factory function `createDualWriteRepositories()`

### Phase 3: Read Switch (COMPLETE)
- [x] ReadSwitchCardRepository / ReadSwitchProjectRepository
- [x] Optional migration fallback (disabled by default)
- [x] Factory function `createReadSwitchRepositories()`

### Phase 4: Deprecation (COMPLETE)
- [x] `createFirestoreOnlyRepositories()` factory
- [x] RTDB backends marked as deprecated

### Phase 5: Web Client Integration (PENDING)
- [ ] Refactor `firebase-service.js` to use DAL
- [ ] Update components to use DAL repositories
- [ ] E2E testing with Playwright

### Phase 6: Production Cutover (PENDING)
- [ ] Run backfill script with `--verify`
- [ ] Enable dual-write mode in production
- [ ] Monitor shadow write errors
- [ ] Switch to read-switch mode
- [ ] Verify data consistency
- [ ] Switch to Firestore-only mode
- [ ] Decommission RTDB

## Execution Commands

```bash
# Backfill historical data
node scripts/backfill-rtdb-to-firestore.js --dry-run          # Preview
node scripts/backfill-rtdb-to-firestore.js                     # Execute
node scripts/backfill-rtdb-to-firestore.js --verify            # Verify counts
node scripts/backfill-rtdb-to-firestore.js --project PlanningGame  # Single project
```

## Rollback Strategy

Each phase is independently reversible by changing the factory mode:
- If Firestore reads fail: disable `migrationFallback` or revert to dual-write mode
- If dual-write causes issues: revert to RTDB-only mode
- Factory configuration is the single point of control

## Related Tasks

| Task | Status | Description |
|------|--------|-------------|
| PLN-TSK-0193 | To Validate | DAL abstract interfaces |
| PLN-TSK-0194 | To Validate | RTDB backend implementation |
| PLN-TSK-0195 | To Validate | Firestore backend implementation |
| PLN-TSK-0209 | To Validate | Cloud Function sync triggers |
| PLN-TSK-0197 | To Validate | Backfill migration script |
| PLN-TSK-0196 | To Validate | Dual-write repositories |
| PLN-TSK-0198 | To Validate | Read-switch repositories |
| PLN-TSK-0199 | To Validate | RTDB deprecation markers |
| PLN-TSK-0192 | In Progress | Migration planning (this doc) |
| PLN-TSK-0189 | To Do | Web client DAL integration |
