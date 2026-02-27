#!/usr/bin/env bash
# Deploy all instances to Firebase
# Usage: npm run deploy:all [-- --only hosting|functions]
#
# By default deploys both hosting and functions.
# Use --only hosting  to deploy only hosting (requires build:all first)
# Use --only functions to deploy only Cloud Functions (no build needed)
#
# For hosting deploy, each instance in dist-all/:
#   1. Activates the instance (symlinks .firebaserc etc.)
#   2. Symlinks dist/ → dist-all/<instance>/
#   3. Deploys to Firebase hosting
#   4. Updates Firebase version notification
#
# For functions deploy, each instance in planning-game-instances/:
#   1. Activates the instance
#   2. Deploys Cloud Functions
#
# After completion, restores the last active instance.
# Deploy output per instance saved to /tmp/deploy-all-<instance>.log

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTANCES_DIR="$ROOT_DIR/planning-game-instances"
DIST_ALL_DIR="$ROOT_DIR/dist-all"

# Parse --only flag
DEPLOY_HOSTING=true
DEPLOY_FUNCTIONS=true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --only)
      shift
      case "$1" in
        hosting)
          DEPLOY_HOSTING=true
          DEPLOY_FUNCTIONS=false
          ;;
        functions)
          DEPLOY_HOSTING=false
          DEPLOY_FUNCTIONS=true
          ;;
        *)
          echo "Error: --only accepts 'hosting' or 'functions'"
          exit 1
          ;;
      esac
      shift
      ;;
    *)
      shift
      ;;
  esac
done

timestamp() {
  date "+%H:%M:%S"
}

log() {
  echo "  [$(timestamp)] $1"
}

# Determine instances list
if [ "$DEPLOY_HOSTING" = true ]; then
  # Check dist-all/ exists with builds
  if [ ! -d "$DIST_ALL_DIR" ]; then
    echo ""
    echo "Error: dist-all/ directory not found."
    echo "Run 'npm run build:all' first to build all instances."
    echo ""
    exit 1
  fi

  INSTANCES=$(ls -d "$DIST_ALL_DIR"/*/ 2>/dev/null | xargs -I {} basename {})

  if [ -z "$INSTANCES" ]; then
    echo ""
    echo "Error: No builds found in dist-all/"
    echo "Run 'npm run build:all' first."
    echo ""
    exit 1
  fi
else
  # For functions-only deploy, enumerate instances from planning-game-instances/
  INSTANCES=$(ls -d "$INSTANCES_DIR"/*/ 2>/dev/null | xargs -I {} basename {})

  if [ -z "$INSTANCES" ]; then
    echo ""
    echo "Error: No instances found in planning-game-instances/"
    echo ""
    exit 1
  fi
fi

# Save current instance to restore later
ORIGINAL_INSTANCE=""
if [ -f "$ROOT_DIR/.last-instance" ]; then
  ORIGINAL_INSTANCE=$(cat "$ROOT_DIR/.last-instance" | tr -d '[:space:]')
fi

TOTAL=$(echo "$INSTANCES" | wc -w)
CURRENT=0
FAILED=()
SUCCEEDED=()
START_TIME=$(date +%s)

# Build deploy targets label
DEPLOY_TARGETS=""
[ "$DEPLOY_HOSTING" = true ] && DEPLOY_TARGETS="hosting"
[ "$DEPLOY_FUNCTIONS" = true ] && DEPLOY_TARGETS="${DEPLOY_TARGETS:+$DEPLOY_TARGETS + }functions"

echo ""
echo "=========================================="
echo "  Deploy ALL instances ($TOTAL found)"
echo "  Targets: $DEPLOY_TARGETS"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

for INSTANCE in $INSTANCES; do
  CURRENT=$((CURRENT + 1))
  LOGFILE="/tmp/deploy-all-${INSTANCE}.log"
  > "$LOGFILE"

  INSTANCE_BUILD="$DIST_ALL_DIR/$INSTANCE"

  # Verify the build exists if deploying hosting
  if [ "$DEPLOY_HOSTING" = true ] && [ ! -f "$INSTANCE_BUILD/index.html" ]; then
    log "Skipping $INSTANCE — no index.html in dist-all/$INSTANCE/"
    FAILED+=("$INSTANCE (no build)")
    continue
  fi

  # Get project ID for display
  PROJECT_ID=$(node -e "
    const fs = require('fs');
    try {
      const rc = JSON.parse(fs.readFileSync('$INSTANCES_DIR/$INSTANCE/.firebaserc','utf8'));
      console.log(rc.projects?.default || '?');
    } catch { console.log('?'); }
  " 2>/dev/null)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  [$CURRENT/$TOTAL] Deploying: $INSTANCE → $PROJECT_ID ($DEPLOY_TARGETS)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # 1. Activate instance (symlinks .firebaserc, switches Firebase CLI account, etc.)
  log "Activating instance..."
  node "$ROOT_DIR/scripts/instance-manager.cjs" use "$INSTANCE" >> "$LOGFILE" 2>&1
  log "Instance activated"

  INSTANCE_FAILED=false

  # 2. Deploy hosting
  if [ "$DEPLOY_HOSTING" = true ]; then
    rm -rf "$ROOT_DIR/dist"
    ln -s "$INSTANCE_BUILD" "$ROOT_DIR/dist"
    log "Linked dist/ → dist-all/$INSTANCE/"

    STEP_START=$(date +%s)
    log "Deploying to Firebase hosting..."
    if firebase deploy --only=hosting >> "$LOGFILE" 2>&1; then
      STEP_END=$(date +%s)
      STEP_DURATION=$((STEP_END - STEP_START))
      log "Hosting OK (${STEP_DURATION}s) → https://${PROJECT_ID}.web.app"

      # Update Firebase version notification
      node "$ROOT_DIR/scripts/update-firebase-version.cjs" >> "$LOGFILE" 2>&1 || true
    else
      STEP_END=$(date +%s)
      STEP_DURATION=$((STEP_END - STEP_START))
      log "Hosting FAILED (${STEP_DURATION}s) — see $LOGFILE"
      INSTANCE_FAILED=true
    fi
  fi

  # 3. Deploy functions
  if [ "$DEPLOY_FUNCTIONS" = true ]; then
    STEP_START=$(date +%s)
    log "Deploying Cloud Functions..."
    if firebase deploy --only=functions >> "$LOGFILE" 2>&1; then
      STEP_END=$(date +%s)
      STEP_DURATION=$((STEP_END - STEP_START))
      log "Functions OK (${STEP_DURATION}s)"
    else
      STEP_END=$(date +%s)
      STEP_DURATION=$((STEP_END - STEP_START))
      log "Functions FAILED (${STEP_DURATION}s) — see $LOGFILE"
      INSTANCE_FAILED=true
    fi
  fi

  if [ "$INSTANCE_FAILED" = true ]; then
    FAILED+=("$INSTANCE")
  else
    SUCCEEDED+=("$INSTANCE")
  fi

  echo ""
done

# Remove dist symlink
rm -f "$ROOT_DIR/dist"

# Restore original instance (instance-manager also restores Firebase CLI account)
if [ -n "$ORIGINAL_INSTANCE" ]; then
  log "Restoring instance: $ORIGINAL_INSTANCE"
  node "$ROOT_DIR/scripts/instance-manager.cjs" use "$ORIGINAL_INSTANCE" > /dev/null 2>&1 || true
fi

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

echo "=========================================="
echo "  Deploy Summary (${TOTAL_DURATION}s total)"
echo "=========================================="
echo ""

for INST in "${SUCCEEDED[@]}"; do
  echo "  OK  $INST"
done

for INST in "${FAILED[@]}"; do
  echo "  XX  $INST"
done

echo ""

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "  ${#FAILED[@]} failed, ${#SUCCEEDED[@]} succeeded."
  echo "  Check logs at /tmp/deploy-all-*.log"
  echo ""
  exit 1
fi

echo "  All $TOTAL instances deployed successfully."
echo ""
