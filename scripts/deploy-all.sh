#!/usr/bin/env bash
# Deploy to all configured instances
# Usage: npm run deploy:all
#
# For each instance in planning-game-instances/:
#   1. Activates the instance (symlinks config)
#   2. Builds production bundle
#   3. Deploys to Firebase hosting
#   4. Moves to next instance
#
# After completion, restores the last active instance.
# Build/deploy output is saved to /tmp/deploy-all-<instance>.log

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTANCES_DIR="$ROOT_DIR/planning-game-instances"

timestamp() {
  date "+%H:%M:%S"
}

log() {
  echo "  [$(timestamp)] $1"
}

# Save current instance to restore later
ORIGINAL_INSTANCE=""
if [ -f "$ROOT_DIR/.last-instance" ]; then
  ORIGINAL_INSTANCE=$(cat "$ROOT_DIR/.last-instance" | tr -d '[:space:]')
fi

# Get all instance directories
INSTANCES=$(ls -d "$INSTANCES_DIR"/*/ 2>/dev/null | xargs -I {} basename {})

if [ -z "$INSTANCES" ]; then
  echo "Error: No instances found in $INSTANCES_DIR"
  exit 1
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

  # Get project ID for display
  PROJECT_ID=$(node -e "
    const fs = require('fs');
    try {
      const rc = JSON.parse(fs.readFileSync('$INSTANCES_DIR/$INSTANCE/.firebaserc','utf8'));
      console.log(rc.projects?.default || '?');
    } catch { console.log('?'); }
  " 2>/dev/null)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  [$CURRENT/$TOTAL] $INSTANCE → $PROJECT_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # 1. Activate instance
  log "Activating instance..."
  node "$ROOT_DIR/scripts/instance-manager.cjs" use "$INSTANCE" >> "$LOGFILE" 2>&1
  log "Instance activated ✓"

  # 2. Build
  STEP_START=$(date +%s)
  log "Building production... (output → $LOGFILE)"
  if npm run build-prod --prefix "$ROOT_DIR" >> "$LOGFILE" 2>&1; then
    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log "Build OK ✓ (${STEP_DURATION}s)"
  else
    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log "Build FAILED ✗ (${STEP_DURATION}s) — see $LOGFILE"
    FAILED+=("$INSTANCE (build)")
    echo ""
    continue
  fi

  # 3. Deploy
  STEP_START=$(date +%s)
  log "Deploying to Firebase hosting..."
  if npm run deploy:no-notify --prefix "$ROOT_DIR" >> "$LOGFILE" 2>&1; then
    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log "Deploy OK ✓ (${STEP_DURATION}s) → https://${PROJECT_ID}.web.app"
    SUCCEEDED+=("$INSTANCE")
  else
    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log "Deploy FAILED ✗ (${STEP_DURATION}s) — see $LOGFILE"
    FAILED+=("$INSTANCE (deploy)")
  fi

  echo ""
done

# Restore original instance
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
  echo "  ✓ $INST"
done

for INST in "${FAILED[@]}"; do
  echo "  ✗ $INST"
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
