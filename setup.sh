#!/bin/bash

# UPS EcoShip - Quick Setup Script
# This script sets up both frontend and backend for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}"
echo "🚀 UPS EcoShip - Quick Setup"
echo "========================================="
echo -e "${NC}"

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js 18+ is required. Found: $(node --version)"
    exit 1
fi

log_success "Prerequisites check passed"

# Setup frontend
log_info "Setting up frontend..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    log_success "Created .env file from template"
else
    log_info ".env file already exists"
fi

if [ ! -d "node_modules" ]; then
    log_info "Installing frontend dependencies..."
    npm install
    log_success "Frontend dependencies installed"
else
    log_info "Frontend dependencies already installed"
fi

# Setup backend
log_info "Setting up backend..."
cd backend
./deploy.sh setup
cd ..

log_success "Backend setup completed"

echo -e "${GREEN}"
echo "✅ Setup Complete!"
echo "========================================="
echo -e "${NC}"

echo "To start the application:"
echo ""
echo -e "${YELLOW}Option 1: Full Backend Integration (Recommended)${NC}"
echo "Terminal 1: cd backend && ./deploy.sh start"
echo "Terminal 2: npm start"
echo ""
echo -e "${YELLOW}Option 2: Demo Mode Only${NC}"
echo "npm start"
echo ""
echo -e "${YELLOW}Option 3: Docker Backend${NC}"
echo "Terminal 1: cd backend && ./deploy.sh docker"
echo "Terminal 2: npm start"
echo ""
echo "📖 For more information, see README.md"
