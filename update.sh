#!/bin/bash
# ============================================================================
# Planning GameXP - Update Script
# ============================================================================
# Pulls latest changes, installs dependencies, and preserves local config.
#
# Usage:
#   chmod +x update.sh && ./update.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "============================================"
echo "  Planning GameXP - Update"
echo "============================================"
echo ""

# ── Stash local changes ─────────────────────────────────────────────────────

HAS_CHANGES=false
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    HAS_CHANGES=true
    info "Stashing local changes..."
    git stash push -m "pre-update-$(date +%Y%m%d-%H%M%S)"
    success "Changes stashed"
fi

# ── Pull latest ──────────────────────────────────────────────────────────────

info "Pulling latest changes..."
BEFORE=$(git rev-parse HEAD)
git pull origin main
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
    success "Already up to date!"
else
    success "Updated to $(git rev-parse --short HEAD)"
    echo ""
    info "Recent changes:"
    git log --oneline "$BEFORE".."$AFTER" | head -20
fi

echo ""

# ── Install dependencies ─────────────────────────────────────────────────────

info "Installing dependencies..."
npm install
success "Project dependencies updated"

if [ -d "functions" ]; then
    cd functions && npm install && cd ..
    success "Cloud Functions dependencies updated"
fi

echo ""

# ── Restore stashed changes ─────────────────────────────────────────────────

if [ "$HAS_CHANGES" = true ]; then
    info "Restoring local changes..."
    if git stash pop; then
        success "Local changes restored"
    else
        warning "Merge conflict while restoring changes."
        echo "  Your changes are still in git stash. Resolve conflicts manually."
        echo "  Use 'git stash list' and 'git stash pop' when ready."
    fi
fi

# ── Build ────────────────────────────────────────────────────────────────────

if [ -f ".env.dev" ] || [ -f ".env.pro" ]; then
    info "Building..."
    if npm run build 2>/dev/null; then
        success "Build successful!"
    else
        warning "Build failed. Check for breaking changes in the update."
    fi
fi

echo ""
echo "============================================"
echo "  Update Complete!"
echo "============================================"
echo ""
