#!/usr/bin/env node

/**
 * Seed Demo Data Script
 * Populates the demo Firebase RTDB with a realistic project:
 *   - 1 project ("TaskFlow" — a task management SaaS)
 *   - 4 sprints (1 completed, 1 active, 1 planned, 1 future)
 *   - 5 epics
 *   - 25 tasks (various statuses)
 *   - 5 bugs
 *   - 3 proposals
 *
 * Run: node scripts/seed-demo-data.cjs
 * Requires: demo instance active (npm run instance:use -- demo)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ── Firebase connection (reuse pattern from update-firebase-version.cjs) ──

function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env.prod');
  if (!fs.existsSync(envPath)) {
    throw new Error('No .env.prod found. Run: npm run instance:use -- demo');
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(/^PUBLIC_FIREBASE_DATABASE_URL=(.+)$/m);
  if (!match) {
    throw new Error('PUBLIC_FIREBASE_DATABASE_URL not found in .env.prod');
  }
  const url = match[1].trim();
  const regionMatch = url.match(/^(https:\/\/[^.]+)\.[^.]+\.firebasedatabase\.app\/?$/);
  if (regionMatch) return `${regionMatch[1]}.firebaseio.com`;
  return url;
}

function initFirebase() {
  const DATABASE_URL = getDatabaseUrl();
  const saPath = path.join(__dirname, '../serviceAccountKey.json');
  if (!fs.existsSync(saPath)) {
    throw new Error('serviceAccountKey.json not found');
  }
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(sa),
    databaseURL: DATABASE_URL,
  });
  console.log(`✅ Connected to ${DATABASE_URL}`);
}

// ── Helpers ──

const now = new Date();
const year = now.getFullYear();
const iso = (d) => d.toISOString();
const ymd = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

const PROJECT_ID = 'TaskFlow';
const ABBR = 'TFL';
const CREATED_BY = 'demo@planninggame.app';

// ── Data definitions ──

const developers = [
  { id: 'dev_001', name: 'Ana García', email: 'ana@taskflow.dev' },
  { id: 'dev_002', name: 'Carlos Ruiz', email: 'carlos@taskflow.dev' },
  { id: 'dev_003', name: 'Lucía Martín', email: 'lucia@taskflow.dev' },
  { id: 'dev_004', name: 'Pablo Torres', email: 'pablo@taskflow.dev' },
];

const stakeholders = [
  { id: 'stk_001', name: 'Elena Vidal', email: 'elena@taskflow.dev' },
  { id: 'stk_002', name: 'Marcos López', email: 'marcos@taskflow.dev' },
];

const sprints = [
  {
    cardId: `${ABBR}-SPR-0001`,
    title: 'Sprint 1 — Foundation',
    startDate: ymd(daysAgo(42)),
    endDate: ymd(daysAgo(28)),
    status: 'Completed',
    devPoints: 18,
    businessPoints: 22,
  },
  {
    cardId: `${ABBR}-SPR-0002`,
    title: 'Sprint 2 — Core Features',
    startDate: ymd(daysAgo(28)),
    endDate: ymd(daysAgo(14)),
    status: 'Completed',
    devPoints: 22,
    businessPoints: 26,
  },
  {
    cardId: `${ABBR}-SPR-0003`,
    title: 'Sprint 3 — Polish & UX',
    startDate: ymd(daysAgo(14)),
    endDate: ymd(daysFromNow(0)),
    status: 'Active',
    devPoints: 20,
    businessPoints: 24,
  },
  {
    cardId: `${ABBR}-SPR-0004`,
    title: 'Sprint 4 — Launch Prep',
    startDate: ymd(daysFromNow(1)),
    endDate: ymd(daysFromNow(15)),
    status: 'Planning',
    devPoints: 0,
    businessPoints: 0,
  },
];

const epics = [
  { cardId: `${ABBR}-PCS-0001`, title: 'User Authentication', description: 'Login, registration, password recovery, OAuth integration' },
  { cardId: `${ABBR}-PCS-0002`, title: 'Task Management', description: 'CRUD operations for tasks, status transitions, assignments' },
  { cardId: `${ABBR}-PCS-0003`, title: 'Dashboard & Analytics', description: 'Project overview, charts, velocity metrics, burndown' },
  { cardId: `${ABBR}-PCS-0004`, title: 'Notifications & Real-time', description: 'Push notifications, real-time updates, email digests' },
  { cardId: `${ABBR}-PCS-0005`, title: 'Team Collaboration', description: 'Comments, mentions, file attachments, activity log' },
];

const tasks = [
  // ── Sprint 1 (completed) ──
  {
    cardId: `${ABBR}-TSK-0001`, title: 'Set up Firebase Auth with email/password',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0001`, sprint: `${ABBR}-SPR-0001`,
    devPoints: 2, businessPoints: 5, developer: 'dev_001', validator: 'stk_001',
    startDate: ymd(daysAgo(41)), endDate: ymd(daysAgo(39)),
    desc: { role: 'As a new user', goal: 'I want to register with email and password', benefit: 'To access the platform securely' },
    ac: [{ given: 'A visitor on the registration page', when: 'they fill in email and password and click register', then: 'their account is created and they are logged in' }],
  },
  {
    cardId: `${ABBR}-TSK-0002`, title: 'Implement Google OAuth login',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0001`, sprint: `${ABBR}-SPR-0001`,
    devPoints: 3, businessPoints: 4, developer: 'dev_002', validator: 'stk_001',
    startDate: ymd(daysAgo(40)), endDate: ymd(daysAgo(37)),
    desc: { role: 'As a user', goal: 'I want to log in with my Google account', benefit: 'To avoid creating yet another password' },
    ac: [{ given: 'A visitor on the login page', when: 'they click "Sign in with Google"', then: 'they are authenticated via Google OAuth and redirected to the dashboard' }],
  },
  {
    cardId: `${ABBR}-TSK-0003`, title: 'Create task list view with filtering',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0001`,
    devPoints: 3, businessPoints: 5, developer: 'dev_003', validator: 'stk_002',
    startDate: ymd(daysAgo(39)), endDate: ymd(daysAgo(35)),
    desc: { role: 'As a project member', goal: 'I want to see all tasks in a filterable list', benefit: 'To quickly find the tasks I need to work on' },
    ac: [
      { given: 'A logged-in user on the tasks page', when: 'they select a filter by status', then: 'only tasks matching that status are shown' },
      { given: 'A user viewing the task list', when: 'they type in the search box', then: 'results are filtered in real-time by title' },
    ],
  },
  {
    cardId: `${ABBR}-TSK-0004`, title: 'Implement task creation form',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0001`,
    devPoints: 2, businessPoints: 5, developer: 'dev_001', validator: 'stk_001',
    startDate: ymd(daysAgo(38)), endDate: ymd(daysAgo(36)),
    desc: { role: 'As a project manager', goal: 'I want to create new tasks with title, description, and priority', benefit: 'To plan work for the team' },
    ac: [{ given: 'A user with create permissions', when: 'they fill the form and click Save', then: 'the task appears in the list with the correct data' }],
  },
  {
    cardId: `${ABBR}-TSK-0005`, title: 'Build password recovery flow',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0001`, sprint: `${ABBR}-SPR-0001`,
    devPoints: 2, businessPoints: 3, developer: 'dev_004', validator: 'stk_002',
    startDate: ymd(daysAgo(37)), endDate: ymd(daysAgo(34)),
    desc: { role: 'As a user who forgot their password', goal: 'I want to reset it via email', benefit: 'To regain access to my account' },
    ac: [{ given: 'A user on the "Forgot password" page', when: 'they enter their email and click Reset', then: 'they receive an email with a reset link that works' }],
  },

  // ── Sprint 2 (completed) ──
  {
    cardId: `${ABBR}-TSK-0006`, title: 'Implement Kanban board view',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0002`,
    devPoints: 4, businessPoints: 5, developer: 'dev_003', validator: 'stk_001',
    startDate: ymd(daysAgo(27)), endDate: ymd(daysAgo(22)),
    desc: { role: 'As a team member', goal: 'I want to see tasks organized by status in a Kanban board', benefit: 'To visualize workflow and identify bottlenecks' },
    ac: [
      { given: 'A user on the Kanban view', when: 'tasks exist in different statuses', then: 'each status has its own column with the correct tasks' },
      { given: 'A user viewing the Kanban', when: 'they drag a task to another column', then: 'the task status is updated in real-time' },
    ],
  },
  {
    cardId: `${ABBR}-TSK-0007`, title: 'Add project dashboard with summary cards',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0003`, sprint: `${ABBR}-SPR-0002`,
    devPoints: 3, businessPoints: 4, developer: 'dev_001', validator: 'stk_002',
    startDate: ymd(daysAgo(26)), endDate: ymd(daysAgo(22)),
    desc: { role: 'As a project manager', goal: 'I want a dashboard with task counts and sprint progress', benefit: 'To have a high-level overview of project health' },
    ac: [{ given: 'A user on the dashboard page', when: 'the project has active tasks', then: 'summary cards show counts per status and sprint completion percentage' }],
  },
  {
    cardId: `${ABBR}-TSK-0008`, title: 'Create burndown chart component',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0003`, sprint: `${ABBR}-SPR-0002`,
    devPoints: 3, businessPoints: 3, developer: 'dev_002', validator: 'stk_001',
    startDate: ymd(daysAgo(25)), endDate: ymd(daysAgo(21)),
    desc: { role: 'As a scrum master', goal: 'I want to see a burndown chart for the active sprint', benefit: 'To track if the team is on pace to complete the sprint' },
    ac: [{ given: 'An active sprint with tasks', when: 'tasks are completed over time', then: 'the burndown chart shows actual progress against the ideal line' }],
  },
  {
    cardId: `${ABBR}-TSK-0009`, title: 'Implement task assignment with developer selector',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0002`,
    devPoints: 2, businessPoints: 4, developer: 'dev_004', validator: 'stk_001',
    startDate: ymd(daysAgo(24)), endDate: ymd(daysAgo(20)),
    desc: { role: 'As a project manager', goal: 'I want to assign tasks to specific developers', benefit: 'To distribute work effectively across the team' },
    ac: [{ given: 'A task in "To Do" status', when: 'the manager selects a developer from the dropdown', then: 'the developer appears assigned and receives a notification' }],
  },
  {
    cardId: `${ABBR}-TSK-0010`, title: 'Set up push notification infrastructure',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0004`, sprint: `${ABBR}-SPR-0002`,
    devPoints: 3, businessPoints: 4, developer: 'dev_002', validator: 'stk_002',
    startDate: ymd(daysAgo(22)), endDate: ymd(daysAgo(18)),
    desc: { role: 'As a developer', goal: 'I want to receive push notifications when assigned a task', benefit: 'To react quickly to new assignments' },
    ac: [{ given: 'A user with notifications enabled', when: 'a task is assigned to them', then: 'they receive a browser push notification within 5 seconds' }],
  },

  // ── Sprint 3 (active) ──
  {
    cardId: `${ABBR}-TSK-0011`, title: 'Add comment thread to tasks',
    status: 'Done&Validated', epic: `${ABBR}-PCS-0005`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 3, businessPoints: 4, developer: 'dev_003', validator: 'stk_001',
    startDate: ymd(daysAgo(13)), endDate: ymd(daysAgo(9)),
    desc: { role: 'As a team member', goal: 'I want to add comments to tasks', benefit: 'To discuss implementation details within context' },
    ac: [
      { given: 'A user viewing a task', when: 'they type a comment and click Send', then: 'the comment appears in the thread with author and timestamp' },
      { given: 'Multiple comments on a task', when: 'a user opens the task', then: 'comments are shown in chronological order' },
    ],
  },
  {
    cardId: `${ABBR}-TSK-0012`, title: 'Implement @mentions in comments',
    status: 'To Validate', epic: `${ABBR}-PCS-0005`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 2, businessPoints: 3, developer: 'dev_001', validator: 'stk_002',
    startDate: ymd(daysAgo(8)), endDate: ymd(daysAgo(6)),
    desc: { role: 'As a collaborator', goal: 'I want to mention teammates in comments using @', benefit: 'To get their attention on specific discussions' },
    ac: [{ given: 'A user writing a comment', when: 'they type @ followed by a name', then: 'an autocomplete shows matching team members and the mention is highlighted' }],
  },
  {
    cardId: `${ABBR}-TSK-0013`, title: 'Build email digest for daily summary',
    status: 'In Progress', epic: `${ABBR}-PCS-0004`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 3, businessPoints: 4, developer: 'dev_002', validator: 'stk_001',
    startDate: ymd(daysAgo(5)),
    desc: { role: 'As a manager', goal: 'I want to receive a daily email with task updates', benefit: 'To stay informed without checking the app constantly' },
    ac: [
      { given: 'Tasks that changed status during the day', when: 'the scheduled function runs at 8am', then: 'an email is sent listing all changes grouped by project' },
    ],
  },
  {
    cardId: `${ABBR}-TSK-0014`, title: 'Add velocity chart to dashboard',
    status: 'In Progress', epic: `${ABBR}-PCS-0003`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 2, businessPoints: 3, developer: 'dev_004', validator: 'stk_002',
    startDate: ymd(daysAgo(3)),
    desc: { role: 'As a scrum master', goal: 'I want to see the team velocity over the last sprints', benefit: 'To estimate capacity for upcoming sprints' },
    ac: [{ given: 'At least 2 completed sprints', when: 'the user views the velocity chart', then: 'a bar chart shows devPoints delivered per sprint' }],
  },
  {
    cardId: `${ABBR}-TSK-0015`, title: 'Implement file attachment upload',
    status: 'To Do', epic: `${ABBR}-PCS-0005`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 3, businessPoints: 3, developer: 'dev_003', validator: 'stk_001',
    desc: { role: 'As a user', goal: 'I want to attach files (screenshots, documents) to tasks', benefit: 'To provide visual context for issues and requirements' },
    ac: [
      { given: 'A user editing a task', when: 'they click "Attach file" and select a file', then: 'the file is uploaded and shown as a thumbnail/link' },
      { given: 'An attached file', when: 'the user clicks on it', then: 'the file opens in a new tab or downloads' },
    ],
  },
  {
    cardId: `${ABBR}-TSK-0016`, title: 'Add activity log to tasks',
    status: 'To Do', epic: `${ABBR}-PCS-0005`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 2, businessPoints: 2, developer: '', validator: '',
    desc: { role: 'As a project manager', goal: 'I want to see a history of changes on each task', benefit: 'To understand who changed what and when' },
    ac: [{ given: 'A task that has been modified multiple times', when: 'the user opens the activity tab', then: 'a chronological list shows each change with field, old value, new value, and author' }],
  },
  {
    cardId: `${ABBR}-TSK-0017`, title: 'Create sprint planning view',
    status: 'Blocked', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0003`,
    devPoints: 4, businessPoints: 5, developer: 'dev_001', validator: 'stk_001',
    startDate: ymd(daysAgo(2)),
    desc: { role: 'As a scrum master', goal: 'I want a dedicated view for planning sprints with drag & drop', benefit: 'To efficiently assign tasks from backlog to sprints' },
    ac: [
      { given: 'A user on the sprint planning page', when: 'they drag a task from backlog to a sprint', then: 'the task is assigned to that sprint and the points update' },
    ],
  },

  // ── Sprint 4 (planned — backlog for next sprint) ──
  {
    cardId: `${ABBR}-TSK-0018`, title: 'Implement role-based access control',
    status: 'To Do', epic: `${ABBR}-PCS-0001`, sprint: `${ABBR}-SPR-0004`,
    devPoints: 4, businessPoints: 5, developer: '', validator: '',
    desc: { role: 'As an admin', goal: 'I want to assign roles (admin, member, viewer) to users', benefit: 'To control who can create, edit, or only view tasks' },
    ac: [
      { given: 'An admin on the settings page', when: 'they change a user role to "viewer"', then: 'that user can only view tasks but not edit or create' },
    ],
  },
  {
    cardId: `${ABBR}-TSK-0019`, title: 'Add export to CSV/PDF',
    status: 'To Do', epic: `${ABBR}-PCS-0003`, sprint: `${ABBR}-SPR-0004`,
    devPoints: 2, businessPoints: 3, developer: '', validator: '',
    desc: { role: 'As a manager', goal: 'I want to export task data as CSV or PDF', benefit: 'To share reports with stakeholders who do not use the platform' },
    ac: [{ given: 'A user on the task list', when: 'they click "Export" and choose CSV', then: 'a CSV file is downloaded with all visible tasks and their fields' }],
  },
  {
    cardId: `${ABBR}-TSK-0020`, title: 'Build onboarding wizard for new projects',
    status: 'To Do', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0004`,
    devPoints: 3, businessPoints: 4, developer: '', validator: '',
    desc: { role: 'As a new user', goal: 'I want a guided setup when creating my first project', benefit: 'To understand how to configure sprints, team, and epics' },
    ac: [{ given: 'A new user with no projects', when: 'they log in for the first time', then: 'a step-by-step wizard walks them through creating a project, adding team members, and configuring their first sprint' }],
  },
  {
    cardId: `${ABBR}-TSK-0021`, title: 'Implement mobile responsive layout',
    status: 'To Do', epic: `${ABBR}-PCS-0002`, sprint: `${ABBR}-SPR-0004`,
    devPoints: 4, businessPoints: 4, developer: '', validator: '',
    desc: { role: 'As a mobile user', goal: 'I want to use the app comfortably on my phone', benefit: 'To check tasks and update status while on the go' },
    ac: [
      { given: 'A user on a mobile device', when: 'they view the task list', then: 'the layout adjusts to a single column with touch-friendly controls' },
      { given: 'A mobile user on the Kanban', when: 'they swipe a task', then: 'they can change its status with a swipe gesture' },
    ],
  },

  // ── Backlog (no sprint) ──
  {
    cardId: `${ABBR}-TSK-0022`, title: 'Add keyboard shortcuts for power users',
    status: 'To Do', epic: `${ABBR}-PCS-0002`, sprint: '',
    devPoints: 2, businessPoints: 2, developer: '', validator: '',
    desc: { role: 'As a power user', goal: 'I want keyboard shortcuts (N for new task, / for search)', benefit: 'To navigate faster without using the mouse' },
    ac: [{ given: 'A user on any page', when: 'they press / ', then: 'the search bar is focused' }],
  },
  {
    cardId: `${ABBR}-TSK-0023`, title: 'Integrate with Slack for notifications',
    status: 'To Do', epic: `${ABBR}-PCS-0004`, sprint: '',
    devPoints: 3, businessPoints: 3, developer: '', validator: '',
    desc: { role: 'As a team using Slack', goal: 'I want task updates posted to a Slack channel', benefit: 'To keep everyone informed in their existing communication tool' },
    ac: [{ given: 'A Slack integration configured for a project', when: 'a task changes status', then: 'a message is posted to the configured Slack channel with task details' }],
  },
  {
    cardId: `${ABBR}-TSK-0024`, title: 'Add dark mode theme',
    status: 'To Do', epic: `${ABBR}-PCS-0002`, sprint: '',
    devPoints: 2, businessPoints: 2, developer: '', validator: '',
    desc: { role: 'As a user', goal: 'I want a dark mode option', benefit: 'To reduce eye strain during night-time use' },
    ac: [{ given: 'A user in settings', when: 'they toggle dark mode', then: 'the entire UI switches to a dark color scheme and the preference is saved' }],
  },
  {
    cardId: `${ABBR}-TSK-0025`, title: 'Build API for third-party integrations',
    status: 'To Do', epic: `${ABBR}-PCS-0004`, sprint: '',
    devPoints: 5, businessPoints: 4, developer: '', validator: '',
    desc: { role: 'As a developer', goal: 'I want a REST API to automate task management', benefit: 'To integrate TaskFlow with CI/CD pipelines and other tools' },
    ac: [
      { given: 'An authenticated API request', when: 'a GET /api/tasks is sent', then: 'it returns a JSON array of tasks for the project' },
      { given: 'An API request with a valid token', when: 'a POST /api/tasks is sent with task data', then: 'a new task is created and the response contains its ID' },
    ],
  },
];

const bugs = [
  {
    cardId: `${ABBR}-BUG-0001`,
    title: 'Login button unresponsive on Safari mobile',
    status: 'Fixed',
    priority: 'INDIVIDUAL BLOCKER',
    sprint: `${ABBR}-SPR-0002`,
    description: 'On Safari iOS 17, the "Log in" button does not respond to taps. Users have to double-tap or use a long press. Reproduced on iPhone 15 and iPad Air.',
    developer: 'dev_001',
    registerDate: ymd(daysAgo(25)),
    startDate: ymd(daysAgo(24)),
    endDate: ymd(daysAgo(22)),
    rootCause: 'CSS touch-action: manipulation was missing on the button container, causing Safari to wait for potential double-tap zoom.',
    resolution: 'Added touch-action: manipulation to all interactive elements. Verified on Safari iOS 17.2.',
  },
  {
    cardId: `${ABBR}-BUG-0002`,
    title: 'Kanban drag & drop fails when card has long title',
    status: 'Assigned',
    priority: 'USER EXPERIENCE ISSUE',
    sprint: `${ABBR}-SPR-0003`,
    description: 'When a task card title exceeds 80 characters, the drag handle overlaps with the title text and the drop zones become misaligned. Reproduced in Chrome and Firefox.',
    developer: 'dev_003',
    registerDate: ymd(daysAgo(10)),
    startDate: ymd(daysAgo(8)),
  },
  {
    cardId: `${ABBR}-BUG-0003`,
    title: 'Dashboard chart data not updating after sprint change',
    status: 'Created',
    priority: 'WORKFLOW IMPROVEMENT',
    sprint: `${ABBR}-SPR-0003`,
    description: 'When switching the active sprint in the dashboard dropdown, the burndown chart still shows data from the previous sprint until the page is manually refreshed.',
    registerDate: ymd(daysAgo(5)),
  },
  {
    cardId: `${ABBR}-BUG-0004`,
    title: 'Notification bell shows wrong count after reading all',
    status: 'Created',
    priority: 'WORKAROUND AVAILABLE ISSUE',
    sprint: `${ABBR}-SPR-0003`,
    description: 'After clicking "Mark all as read" in the notification panel, the badge count resets to 0 briefly but then shows the old count again. Refreshing the page fixes it.',
    registerDate: ymd(daysAgo(3)),
  },
  {
    cardId: `${ABBR}-BUG-0005`,
    title: 'Task creation fails silently when no sprint selected',
    status: 'Assigned',
    priority: 'INDIVIDUAL BLOCKER',
    sprint: `${ABBR}-SPR-0003`,
    description: 'If a user attempts to create a task without selecting a sprint, the form appears to submit but no task is created. No error message is shown. Console shows a Firebase validation error.',
    developer: 'dev_004',
    registerDate: ymd(daysAgo(2)),
    startDate: ymd(daysAgo(1)),
  },
];

const proposals = [
  {
    cardId: `${ABBR}-PRP-0001`,
    title: 'Add Gantt chart view for project timeline',
    status: 'Proposed',
    desc: { role: 'As a project manager', goal: 'I want a Gantt chart showing task dependencies and timelines', benefit: 'To visualize the project schedule and identify critical paths' },
  },
  {
    cardId: `${ABBR}-PRP-0002`,
    title: 'Implement time tracking per task',
    status: 'Proposed',
    desc: { role: 'As a developer', goal: 'I want to log hours spent on each task', benefit: 'To track productivity and improve estimation accuracy over time' },
  },
  {
    cardId: `${ABBR}-PRP-0003`,
    title: 'Add multi-project view',
    status: 'Accepted',
    desc: { role: 'As a user managing multiple projects', goal: 'I want a unified view across all my projects', benefit: 'To see all my tasks in one place regardless of the project' },
  },
];

// ── Seed functions ──

async function seedProject(db) {
  console.log('📦 Creating project...');
  await db.ref(`/projects/${PROJECT_ID}`).set({
    name: 'TaskFlow',
    abbreviation: ABBR,
    scoringSystem: '1-5',
    description: 'TaskFlow is a modern task management SaaS for agile teams. Built with real-time collaboration, Kanban boards, sprint planning, and analytics to help teams ship faster.',
    developers,
    stakeholders,
    iaEnabled: true,
    repoUrl: 'https://github.com/taskflow/taskflow-app',
    agentsGuidelines: 'TaskFlow follows standard agile XP practices. All tasks must have acceptance criteria in Given/When/Then format. Use conventional commits. Test coverage minimum 80%.',
    createdAt: iso(daysAgo(50)),
    createdBy: CREATED_BY,
    updatedAt: iso(now),
  });
}

async function seedSprints(db) {
  console.log('🏃 Creating sprints...');
  for (const s of sprints) {
    const ref = db.ref(`/cards/${PROJECT_ID}/SPRINTS_${PROJECT_ID}`).push();
    await ref.set({
      cardId: s.cardId,
      id: ref.key,
      firebaseId: ref.key,
      cardType: 'sprint-card',
      group: 'sprints',
      section: 'sprints',
      projectId: PROJECT_ID,
      title: s.title,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      devPoints: s.devPoints,
      businessPoints: s.businessPoints,
      year,
      createdBy: CREATED_BY,
      createdAt: iso(daysAgo(50)),
      updatedAt: iso(now),
    });
  }
}

async function seedEpics(db) {
  console.log('📚 Creating epics...');
  for (const e of epics) {
    const ref = db.ref(`/cards/${PROJECT_ID}/EPICS_${PROJECT_ID}`).push();
    await ref.set({
      cardId: e.cardId,
      id: ref.key,
      firebaseId: ref.key,
      cardType: 'epic-card',
      group: 'epics',
      section: 'epics',
      projectId: PROJECT_ID,
      title: e.title,
      description: e.description,
      year,
      createdBy: CREATED_BY,
      createdAt: iso(daysAgo(50)),
      updatedAt: iso(now),
    });
  }
}

async function seedTasks(db) {
  console.log('📋 Creating tasks...');
  for (const t of tasks) {
    const ref = db.ref(`/cards/${PROJECT_ID}/TASKS_${PROJECT_ID}`).push();
    const card = {
      cardId: t.cardId,
      id: ref.key,
      firebaseId: ref.key,
      cardType: 'task-card',
      group: 'tasks',
      section: 'tasks',
      projectId: PROJECT_ID,
      title: t.title,
      status: t.status,
      description: '',
      descriptionStructured: t.desc,
      acceptanceCriteriaStructured: (t.ac || []).map(a => ({
        given: a.given, when: a.when, then: a.then, raw: '',
      })),
      sprint: t.sprint,
      epic: t.epic,
      developer: t.developer || '',
      validator: t.validator || '',
      devPoints: t.devPoints,
      businessPoints: t.businessPoints,
      startDate: t.startDate || '',
      endDate: t.endDate || '',
      year,
      createdBy: CREATED_BY,
      createdAt: iso(daysAgo(50)),
      updatedAt: iso(now),
    };
    await ref.set(card);
  }
}

async function seedBugs(db) {
  console.log('🐛 Creating bugs...');
  for (const b of bugs) {
    const ref = db.ref(`/cards/${PROJECT_ID}/BUGS_${PROJECT_ID}`).push();
    const card = {
      cardId: b.cardId,
      id: ref.key,
      firebaseId: ref.key,
      cardType: 'bug-card',
      group: 'bugs',
      section: 'bugs',
      projectId: PROJECT_ID,
      title: b.title,
      status: b.status,
      priority: b.priority,
      description: b.description,
      sprint: b.sprint,
      developer: b.developer || '',
      registerDate: b.registerDate,
      startDate: b.startDate || '',
      endDate: b.endDate || '',
      rootCause: b.rootCause || '',
      resolution: b.resolution || '',
      year,
      createdBy: CREATED_BY,
      createdAt: iso(daysAgo(30)),
      updatedAt: iso(now),
    };
    await ref.set(card);
  }
}

async function seedProposals(db) {
  console.log('💡 Creating proposals...');
  for (const p of proposals) {
    const ref = db.ref(`/cards/${PROJECT_ID}/PROPOSALS_${PROJECT_ID}`).push();
    await ref.set({
      cardId: p.cardId,
      id: ref.key,
      firebaseId: ref.key,
      cardType: 'proposal-card',
      group: 'proposals',
      section: 'proposals',
      projectId: PROJECT_ID,
      title: p.title,
      status: p.status,
      description: '',
      descriptionStructured: p.desc,
      year,
      createdBy: CREATED_BY,
      createdAt: iso(daysAgo(20)),
      updatedAt: iso(now),
    });
  }
}

async function seedCounters(db) {
  console.log('🔢 Setting up card counters...');
  const counters = {
    [`cardCounters/${PROJECT_ID}/task`]: 25,
    [`cardCounters/${PROJECT_ID}/bug`]: 5,
    [`cardCounters/${PROJECT_ID}/epic`]: 5,
    [`cardCounters/${PROJECT_ID}/sprint`]: 4,
    [`cardCounters/${PROJECT_ID}/proposal`]: 3,
  };
  for (const [path, val] of Object.entries(counters)) {
    await db.ref(path).set(val);
  }
}

async function seedAppPerms(db) {
  console.log('🔑 Setting up demo permissions...');
  // Give demo user access to the project
  await db.ref('/data/appPerms').update({
    'demo|planninggame!app': {
      projects: [PROJECT_ID],
      updatedAt: iso(now),
    },
  });
}

// ── Main ──

async function main() {
  console.log('\n🌱 Seeding demo data for TaskFlow project\n');

  initFirebase();
  const db = admin.database();

  // Check if data already exists
  const existing = await db.ref(`/projects/${PROJECT_ID}`).once('value');
  if (existing.exists()) {
    console.log(`⚠️  Project "${PROJECT_ID}" already exists. Overwriting...\n`);
    // Clean up old data
    await db.ref(`/cards/${PROJECT_ID}`).remove();
    await db.ref(`/projects/${PROJECT_ID}`).remove();
    await db.ref(`/cardCounters/${PROJECT_ID}`).remove();
  }

  await seedProject(db);
  await seedSprints(db);
  await seedEpics(db);
  await seedTasks(db);
  await seedBugs(db);
  await seedProposals(db);
  await seedCounters(db);
  await seedAppPerms(db);

  console.log('\n✅ Demo data seeded successfully!');
  console.log(`   Project: ${PROJECT_ID} (${ABBR})`);
  console.log(`   Sprints: ${sprints.length}`);
  console.log(`   Epics:   ${epics.length}`);
  console.log(`   Tasks:   ${tasks.length}`);
  console.log(`   Bugs:    ${bugs.length}`);
  console.log(`   Proposals: ${proposals.length}`);
  console.log('');

  await db.goOffline();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error seeding demo data:', err);
  process.exit(1);
});
