#!/bin/bash

# UPS EcoShip Backend Deployment Script
# This script sets up and runs the FastAPI backend server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    log_info "Found Python $PYTHON_VERSION"
    
    # Convert version to comparable format (e.g., 3.11 -> 311, 3.8 -> 38)
    PYTHON_VERSION_NUM=$(echo "$PYTHON_VERSION" | sed 's/\.//')
    REQUIRED_VERSION_NUM="38"
    
    if [ "$PYTHON_VERSION_NUM" -lt "$REQUIRED_VERSION_NUM" ]; then
        log_error "Python 3.8 or higher is required. Found: $PYTHON_VERSION"
        exit 1
    fi
}

# Create virtual environment if it doesn't exist
setup_venv() {
    if [ ! -d "venv" ]; then
        log_info "Creating virtual environment..."
        python3 -m venv venv
        log_success "Virtual environment created"
    else
        log_info "Virtual environment already exists"
    fi
}

# Activate virtual environment and install dependencies
install_dependencies() {
    log_info "Activating virtual environment and installing dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    log_success "Dependencies installed"
}

# Create .env file if it doesn't exist
setup_env() {
    if [ ! -f ".env" ]; then
        log_info "Creating .env file from template..."
        cp .env.template .env
        log_warning "Please edit .env file with your configuration before running the server"
    else
        log_info ".env file already exists"
    fi
}

# Run the FastAPI server
run_server() {
    log_info "Starting UPS EcoShip Backend Server..."
    source venv/bin/activate
    
    if [ "$1" = "dev" ]; then
        log_info "Running in development mode with auto-reload"
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    else
        log_info "Running in production mode"
        uvicorn main:app --host 0.0.0.0 --port 8000
    fi
}

# Run tests
run_tests() {
    log_info "Running backend tests..."
    source venv/bin/activate
    python -m pytest tests/ -v
    log_success "All tests completed"
}

# Verify setup
verify_setup() {
    log_info "Verifying backend setup..."
    source venv/bin/activate
    python verify_setup.py
    log_success "Setup verification completed"
}

# Main script logic
case "$1" in
    "setup")
        log_info "Setting up UPS EcoShip Backend..."
        check_python
        setup_venv
        install_dependencies
        setup_env
        verify_setup
        log_success "Backend setup completed!"
        log_info "Run './deploy.sh start' to start the server"
        ;;
    "start")
        log_info "Starting server..."
        run_server
        ;;
    "dev")
        log_info "Starting server in development mode..."
        run_server dev
        ;;
    "test")
        run_tests
        ;;
    "verify")
        verify_setup
        ;;
    "docker")
        log_info "Starting with Docker Compose..."
        docker-compose up --build
        ;;
    "docker-bg")
        log_info "Starting with Docker Compose in background..."
        docker-compose up -d --build
        ;;
    *)
        echo "UPS EcoShip Backend Deployment Script"
        echo ""
        echo "Usage: $0 {setup|start|dev|test|verify|docker|docker-bg}"
        echo ""
        echo "Commands:"
        echo "  setup     - Set up the backend environment and dependencies"
        echo "  start     - Start the backend server in production mode"
        echo "  dev       - Start the backend server in development mode"
        echo "  test      - Run all backend tests"
        echo "  verify    - Verify the backend setup"
        echo "  docker    - Start with Docker Compose"
        echo "  docker-bg - Start with Docker Compose in background"
        echo ""
        echo "Example:"
        echo "  $0 setup   # First time setup"
        echo "  $0 start   # Start the server"
        exit 1
        ;;
esac
