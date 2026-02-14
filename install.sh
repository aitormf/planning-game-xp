#!/bin/bash
# ============================================================================
# Planning GameXP - Quick Install Script
# ============================================================================
# Verifies prerequisites, installs dependencies, and runs the setup wizard.
#
# Usage:
#   chmod +x install.sh && ./install.sh
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "============================================"
echo "  Planning GameXP - Installation"
echo "============================================"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────────

info "Checking prerequisites..."

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        error "Node.js 18+ required (found $NODE_VERSION)"
    fi
    success "Node.js $NODE_VERSION"
else
    error "Node.js not found. Install Node.js 18+ from https://nodejs.org"
fi

# npm
if command -v npm &> /dev/null; then
    success "npm $(npm -v)"
else
    error "npm not found"
fi

# Firebase CLI (optional but recommended)
if command -v firebase &> /dev/null; then
    success "Firebase CLI $(firebase --version 2>/dev/null | head -1)"
else
    warning "Firebase CLI not found. Install with: npm install -g firebase-tools"
    echo "  (Required for deployment and emulators, not for initial setup)"
fi

# Java (needed for emulators)
if command -v java &> /dev/null; then
    success "Java $(java --version 2>&1 | head -1)"
else
    warning "Java not found. Required for Firebase emulators."
    echo "  Install with: sudo apt install openjdk-11-jdk (Linux)"
fi

echo ""

# ── Install dependencies ─────────────────────────────────────────────────────

info "Installing project dependencies..."
npm install
success "Project dependencies installed"

if [ -d "functions" ]; then
    info "Installing Cloud Functions dependencies..."
    cd functions && npm install && cd ..
    success "Cloud Functions dependencies installed"
fi

echo ""

# ── Run setup wizard ─────────────────────────────────────────────────────────

info "Starting setup wizard..."
echo ""
echo "  The wizard will guide you through:"
echo "  1. Firebase project configuration"
echo "  2. Environment variables (.env files)"
echo "  3. Microsoft Graph API setup (optional, for email notifications)"
echo "  4. First admin user"
echo ""

node scripts/setup.js

echo ""

# ── Verify build ─────────────────────────────────────────────────────────────

if [ -f ".env.dev" ]; then
    info "Verifying build..."
    if npm run build 2>/dev/null; then
        success "Build successful!"
    else
        warning "Build failed. Check your .env configuration."
    fi
fi

echo ""

# ── Summary ──────────────────────────────────────────────────────────────────

echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Start Firebase emulators (Terminal 1):"
echo "     npm run emulator"
echo ""
echo "  2. Start dev server (Terminal 2):"
echo "     npm run dev"
echo ""
echo "  3. Open http://localhost:4321"
echo ""
echo "  For more details, see:"
echo "  - README.md"
echo "  - INSTALL.md"
echo "  - NEWUSER.md (adding users)"
echo ""
