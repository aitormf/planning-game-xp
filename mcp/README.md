# Planning Game MCP Server

MCP (Model Context Protocol) server for **Planning Game XP** — an agile project management system following eXtreme Programming practices.

Integrates with Claude Code, Cline, and any MCP-compatible AI client to manage sprints, tasks, bugs, epics, proposals, ADRs, and development plans via natural language.

## Requirements

- **Node.js** >= 20.0.0
- A **Firebase project** with Planning Game data structure
- A **Service Account Key** (`serviceAccountKey.json`) for that Firebase project

## Quick Start

### 1. Get the MCP server

**Option A: Standalone build (recommended)**

```bash
# From the Planning Game repo
node scripts/build-mcp-standalone.js
cd dist-mcp
npm install
```

**Option B: From the repo directly**

```bash
cd mcp
npm install
```

### 2. Set up credentials

You need a `serviceAccountKey.json` from your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com) > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the file somewhere safe (never commit it to git)

### 3. Register in Claude Code

```bash
claude mcp add planning-game \
  -e GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://your-project-default-rtdb.region.firebasedatabase.app \
  -- node /absolute/path/to/index.js
```

### 4. First run — set up your identity

Once Claude Code starts with the MCP connected, run:

```
> Use setup_mcp_user to configure my identity
```

This creates a `mcp.user.json` file with your developer ID, used to track who creates/updates cards.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes* | Absolute path to `serviceAccountKey.json` |
| `FIREBASE_DATABASE_URL` | No | RTDB URL (auto-derived from service account if not set) |
| `MCP_INSTANCE_DIR` | No | Directory for instance-specific config (enables multi-instance) |

\* Either this env var or a `serviceAccountKey.json` file in the MCP directory.

## Available Tools (34)

### Project Management
| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `get_project` | Get project details (team, repos, guidelines) |
| `update_project` | Update project settings |
| `create_project` | Create a new project |

### Cards (Tasks, Bugs, Epics, Proposals, QA)
| Tool | Description |
|------|-------------|
| `list_cards` | List cards with filters (type, status, sprint, developer, year) |
| `get_card` | Get full card details + available transitions |
| `create_card` | Create a new card with auto-generated ID |
| `update_card` | Update card fields (status, developer, points, etc.) |
| `relate_cards` | Create relations between cards (related, blocks/blockedBy) |
| `get_transition_rules` | Get valid status transitions for a card type |

### Sprints
| Tool | Description |
|------|-------------|
| `list_sprints` | List sprints by year |
| `get_sprint` | Get sprint details |
| `create_sprint` | Create a new sprint |
| `update_sprint` | Update sprint fields |

### Team
| Tool | Description |
|------|-------------|
| `list_developers` | List project developers |
| `list_stakeholders` | List project stakeholders/validators |

### Architecture Decision Records (ADRs)
| Tool | Description |
|------|-------------|
| `list_adrs` / `get_adr` / `create_adr` / `update_adr` / `delete_adr` | Full CRUD |

### Development Plans
| Tool | Description |
|------|-------------|
| `list_plans` / `get_plan` / `create_plan` / `update_plan` / `delete_plan` | Development plans |
| `list_plan_proposals` / `get_plan_proposal` / `create_plan_proposal` / `update_plan_proposal` / `delete_plan_proposal` | Plan proposals |

### Global Configuration
| Tool | Description |
|------|-------------|
| `list_global_config` / `get_global_config` / `create_global_config` / `update_global_config` / `delete_global_config` | Shared instructions, prompts, agent configs |

### System
| Tool | Description |
|------|-------------|
| `setup_mcp_user` | Configure your developer identity |
| `get_mcp_status` | Server status, version, Firebase project |
| `update_mcp` | Pull latest changes from git |

## Multi-Instance Setup

To connect to multiple Firebase projects simultaneously, register each as a separate MCP server:

```bash
# Instance 1
claude mcp add planning-game-teamA \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/teamA/serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://team-a-default-rtdb.firebasedatabase.app \
  -e MCP_INSTANCE_DIR=/path/to/teamA/config \
  -- node /path/to/index.js

# Instance 2
claude mcp add planning-game-teamB \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/teamB/serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://team-b-default-rtdb.firebasedatabase.app \
  -e MCP_INSTANCE_DIR=/path/to/teamB/config \
  -- node /path/to/index.js
```

Each instance maintains its own `mcp.user.json` in its `MCP_INSTANCE_DIR`.

## Docker

```bash
docker build -t planning-game-mcp .
docker run -it \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json \
  -e FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebasedatabase.app \
  -v /path/to/serviceAccountKey.json:/app/serviceAccountKey.json:ro \
  planning-game-mcp
```

## Building Standalone Distribution

From the main repo:

```bash
node scripts/build-mcp-standalone.js
```

This generates `dist-mcp/` — a self-contained directory with all dependencies internalized. Distribute this folder to users who don't need the full Planning Game web app.

## License

MIT
