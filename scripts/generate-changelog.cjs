#!/usr/bin/env node

/**
 * Auto-generates CHANGELOG.md from git commits grouped by version bumps.
 * Runs as part of the build pipeline, before astro build.
 *
 * Conventional commit types are mapped to Keep a Changelog sections:
 *   feat → Added, fix → Fixed, refactor → Changed, perf → Performance,
 *   test → Testing, docs → Documentation, style → Style
 *
 * Noise commits (bump, pre-build, merge, changelog updates) are filtered out.
 * Versions with no meaningful commits are omitted entirely.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

const SECTION_MAP = {
  feat: 'Added',
  fix: 'Fixed',
  refactor: 'Changed',
  perf: 'Performance',
  test: 'Testing',
  docs: 'Documentation',
  style: 'Style'
};

const SECTION_ORDER = ['Added', 'Changed', 'Fixed', 'Performance', 'Testing', 'Documentation', 'Style', 'Other'];

const SKIP_PATTERNS = [
  /^chore: bump client version/,
  /^chore: pre-build/,
  /^chore\(release\)/,
  /^Merge /,
  /^Initial commit/,
  /^docs: update CHANGELOG/
];

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function getGitLog() {
  try {
    const raw = execSync('git log --format="%H|%s|%ad" --date=short', {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    }).trim();

    if (!raw) return [];

    return raw.split('\n').map(line => {
      const pipeIdx1 = line.indexOf('|');
      const pipeIdx2 = line.lastIndexOf('|');
      return {
        hash: line.slice(0, pipeIdx1),
        subject: line.slice(pipeIdx1 + 1, pipeIdx2),
        date: line.slice(pipeIdx2 + 1)
      };
    });
  } catch (error) {
    console.error('Error reading git log:', error.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseVersionFromBump(subject) {
  const match = subject.match(/^chore: bump client version to (.+)$/);
  return match ? match[1] : null;
}

function parseConventionalCommit(subject) {
  const match = subject.match(/^(\w+)(?:\([^)]*\))?\s*:\s*(.+)$/);
  if (!match) return { type: 'other', message: subject };
  return { type: match[1], message: match[2].trim() };
}

function shouldSkip(subject) {
  return SKIP_PATTERNS.some(p => p.test(subject));
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

function groupCommitsByVersion(commits) {
  const versions = [];
  let currentVersion = null;
  let currentDate = null;
  let currentCommits = [];
  let unreleased = [];

  for (const commit of commits) {
    const ver = parseVersionFromBump(commit.subject);

    if (ver) {
      if (currentVersion) {
        versions.push({ version: currentVersion, date: currentDate, commits: currentCommits });
      } else if (unreleased.length > 0) {
        // Commits before first version bump → unreleased
        versions.unshift({ version: 'Unreleased', date: '', commits: unreleased });
        unreleased = [];
      }
      currentVersion = ver;
      currentDate = commit.date;
      currentCommits = [];
    } else if (!shouldSkip(commit.subject)) {
      if (currentVersion) {
        currentCommits.push(commit);
      } else {
        unreleased.push(commit);
      }
    }
  }

  // Last group (oldest version)
  if (currentVersion && currentCommits.length > 0) {
    versions.push({ version: currentVersion, date: currentDate, commits: currentCommits });
  }

  return versions;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function categorize(commits) {
  const cats = {};
  for (const commit of commits) {
    const { type, message } = parseConventionalCommit(commit.subject);
    const section = SECTION_MAP[type] || 'Other';
    if (!cats[section]) cats[section] = [];
    cats[section].push(message);
  }
  return cats;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatVersion({ version, date, commits }) {
  if (commits.length === 0) return '';

  const cats = categorize(commits);
  const datePart = date ? ` - ${date}` : '';
  let md = `## [${version}]${datePart}\n`;

  for (const section of SECTION_ORDER) {
    const items = cats[section];
    if (!items || items.length === 0) continue;

    md += `\n### ${section}\n\n`;
    for (const msg of items) {
      md += `- ${capitalize(msg)}\n`;
    }
  }

  return md;
}

// ---------------------------------------------------------------------------
// Historical changelog (pre-git, cannot be auto-generated)
// ---------------------------------------------------------------------------

const HISTORICAL = `
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
`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generate() {
  const commits = getGitLog();
  if (commits.length === 0) {
    console.log('⚠️  No git commits found, skipping changelog generation.');
    return;
  }

  const versions = groupCommitsByVersion(commits);

  let md = '# Changelog\n\n';
  md += 'All notable changes to this project will be documented in this file.\n';
  md += 'Auto-generated from git commits on each build.\n\n';

  let count = 0;
  for (const vg of versions) {
    const block = formatVersion(vg);
    if (block) {
      md += block + '\n';
      count++;
    }
  }

  md += HISTORICAL;

  fs.writeFileSync(CHANGELOG_PATH, md);
  console.log(`📝 Changelog generated: ${count} versions from commits`);
}

generate();
