# Component Catalog

## Base Classes & Mixins

| Component | File | Description |
|-----------|------|-------------|
| `BaseCard` | `base-card.js` | Base class for all card components. Provides common functionality: modals, permissions, notifications, overlay loading. |
| `BaseFilters` | `BaseFilters.js` | Base class for filter components. |
| `NotesManagerMixin` | `mixins/notes-manager-mixin.js` | Mixin for managing notes in cards. |

**BaseCard key methods:**
- `_showNotification(message, type)` - Show toast notification (type: 'info', 'success', 'warning', 'error')
- `_showSavingOverlay(message = 'Guardando...')` - Show loading overlay with spinner and custom message
- `_hideSavingOverlay()` - Hide loading overlay
- `showDeleteModal()` - Show delete confirmation modal

## Card Components (extend BaseCard)

| Component | Tag | File | Extends | Description |
|-----------|-----|------|---------|-------------|
| `TaskCard` | `<task-card>` | `TaskCard.js` | `NotesManagerMixin(BaseCard)` | Task card with user story format (Como/Quiero/Para) |
| `BugCard` | `<bug-card>` | `BugCard.js` | `NotesManagerMixin(BaseCard)` | Bug card with plain description |
| `ProposalCard` | `<proposal-card>` | `ProposalCard.js` | `BaseCard` | Proposal card with user story format |
| `EpicCard` | `<epic-card>` | `EpicCard.js` | `BaseCard` | Epic card |
| `SprintCard` | `<sprint-card>` | `SprintCard.js` | `BaseCard` | Sprint card |
| `QACard` | `<qa-card>` | `QACard.js` | `BaseCard` | QA item card |
| `EditableCard` | `<editable-card>` | `editable-card.js` | `BaseCard` | Generic editable card |

## Filter Components (extend BaseFilters)

| Component | Tag | File | Extends |
|-----------|-----|------|---------|
| `TaskFilters` | `<task-filters>` | `TaskFilters.js` | `BaseFilters` |
| `BugFilters` | `<bug-filters>` | `BugFilters.js` | `BaseFilters` |

## UI Components (extend LitElement)

| Component | Tag | File | Description |
|-----------|-----|------|-------------|
| `ColorTabs` | `<color-tabs>` | `ColorTabs.js` | Tabbed interface with colored borders |
| `ColorTab` | `<color-tab>` | `ColorTabs.js` | Individual tab for ColorTabs |
| `MultiSelect` | `<multi-select>` | `MultiSelect.js` | Multi-select dropdown |
| `SlideNotification` | `<slide-notification>` | `SlideNotification.js` | Slide-in toast notifications |
| `NotificationBell` | `<notification-bell>` | `NotificationBell.js` | Notification bell icon with badge |
| `YearSelector` | `<year-selector>` | `YearSelector.js` | Year picker for filtering |
| `ProjectSelector` | `<project-selector>` | `ProjectSelector.js` | Project dropdown selector |
| `GanttChart` | `<gantt-chart>` | `GanttChart.js` | Gantt chart visualization |
| `SprintPointsChart` | `<sprint-points-chart>` | `SprintPointsChart.js` | Sprint burndown/points chart |
| `CardHistoryViewer` | `<card-history-viewer>` | `card-history-viewer.js` | Card change history viewer |
| `FirebaseStorageUploader` | `<firebase-storage-uploader>` | `FirebaseStorageUploader.js` | File upload to Firebase Storage |
| `AiDocumentUploader` | `<ai-document-uploader>` | `AiDocumentUploader.js` | AI-powered document upload for generating cards |
| `GlobalProposalsList` | `<global-proposals-list>` | `GlobalProposalsList.js` | Cross-project proposals list |

## App-Level Components (extend LitElement)

| Component | Tag | File | Description |
|-----------|-----|------|-------------|
| `AppManager` | `<app-manager>` | `AppManager.js` | Main application manager |
| `AppFooter` | `<app-footer>` | `AppFooter.js` | Application footer |
| `MenuNav` | `<menu-nav>` | `MenuNav.js` | Navigation menu |
| `UpdateManager` | `<update-manager>` | `UpdateManager.js` | App update notifications |
| `ProjectForm` | `<project-form>` | `ProjectForm.js` | Project creation/edit form |
| `ProjectCardUpload` | `<project-card-upload>` | `ProjectCardUpload.js` | Card upload interface |
| `StoryUpload` | `<story-upload>` | `StoryUpload.js` | Story upload interface |

## Native Web Components (extend HTMLElement)

| Component | Tag | File | Description |
|-----------|-----|------|-------------|
| `PushNotification` | `<push-notification>` | `PushNotification.js` | Push notification handler |

## Style Files

Each component may have a separate styles file: `*-styles.js` (e.g., `task-card-styles.js`, `bug-card-styles.js`)

## Astro Components

| Component | File | Description |
|-----------|------|-------------|
| `AppFooter` | `src/components/AppFooter.astro` | Server-rendered footer |
| `MenuNav` | `src/components/MenuNav.astro` | Server-rendered navigation |
| `BacklogStyles` | `src/components/BacklogStyles.astro` | Backlog CSS styles |
| `DocLayout` | `src/components/doc/DocLayout.astro` | Documentation page layout |
| `DocSidebar` | `src/components/doc/DocSidebar.astro` | Documentation sidebar |
| `DocBreadcrumbs` | `src/components/doc/DocBreadcrumbs.astro` | Documentation breadcrumbs |
