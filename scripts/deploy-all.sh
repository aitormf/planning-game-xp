#!/usr/bin/env bash
# Deploy all pre-built instances from dist-all/<instance>/
# Usage: npm run deploy:all
#
# Prerequisites: Run 'npm run build:all' first to populate dist-all/
#
# For each instance in dist-all/:
#   1. Activates the instance (symlinks .firebaserc etc.)
#   2. Symlinks dist/ → dist-all/<instance>/
#   3. Deploys to Firebase hosting
#   4. Updates Firebase version notification
#
# After completion, restores the last active instance.
# Deploy output per instance saved to /tmp/deploy-all-<instance>.log

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTANCES_DIR="$ROOT_DIR/planning-game-instances"
DIST_ALL_DIR="$ROOT_DIR/dist-all"

timestamp() {
  date "+%H:%M:%S"
}

log() {
  echo "  [$(timestamp)] $1"
}

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

echo ""
echo "=========================================="
echo "  Deploy ALL instances ($TOTAL found)"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

for INSTANCE in $INSTANCES; do
  CURRENT=$((CURRENT + 1))
  LOGFILE="/tmp/deploy-all-${INSTANCE}.log"
  > "$LOGFILE"

  INSTANCE_BUILD="$DIST_ALL_DIR/$INSTANCE"

  # Verify the build exists and has content
  if [ ! -f "$INSTANCE_BUILD/index.html" ]; then
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
  echo "  [$CURRENT/$TOTAL] Deploying: $INSTANCE → $PROJECT_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # 1. Activate instance (symlinks .firebaserc, switches Firebase CLI account, etc.)
  log "Activating instance..."
  node "$ROOT_DIR/scripts/instance-manager.cjs" use "$INSTANCE" >> "$LOGFILE" 2>&1
  log "Instance activated"

  # 2. Symlink dist/ → dist-all/<instance>/
  rm -rf "$ROOT_DIR/dist"
  ln -s "$INSTANCE_BUILD" "$ROOT_DIR/dist"
  log "Linked dist/ → dist-all/$INSTANCE/"

  # 3. Deploy
  STEP_START=$(date +%s)
  log "Deploying to Firebase hosting..."
  if firebase deploy --only=hosting >> "$LOGFILE" 2>&1; then
    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log "Deploy OK (${STEP_DURATION}s) → https://${PROJECT_ID}.web.app"

    # 4. Update Firebase version notification
    node "$ROOT_DIR/scripts/update-firebase-version.cjs" >> "$LOGFILE" 2>&1 || true
    SUCCEEDED+=("$INSTANCE")
  else
    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log "Deploy FAILED (${STEP_DURATION}s) — see $LOGFILE"
    FAILED+=("$INSTANCE (deploy)")
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
