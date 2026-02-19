#!/bin/bash

# Interactive build script for Retire app
# Prompts user for build scenario and executes appropriate commands

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "================================"
echo "Retire App Build Tool"
echo "================================"
echo ""

# Display menu
show_menu() {
    echo "Select a build scenario:"
    echo ""
    echo "  1) Development Server (with hot reload)"
    echo "  2) Production Build Only"
    echo "  3) Production Build + Preview"
    echo "  4) Run All Tests"
    echo "  5) Run Scenario Tests (spreadsheet parity)"
    echo "  6) Type Check"
    echo "  7) Clean Build (delete dist/ and rebuild)"
    echo "  8) Full Build Pipeline (test + typecheck + build)"
    echo "  9) Full Build Pipeline + Start Server"
    echo "  10) Kill Existing Instance on Port 2222"
    echo ""
    read -p "Enter your choice (1-10): " choice
}

# Function to run dev server
run_dev() {
    kill_existing_instance
    echo ""
    echo "Starting development server on port 2222..."
    echo "Visit: http://localhost:2222"
    echo ""
    pnpm dev
}

# Function to build production
run_build() {
    echo ""
    echo "Building for production..."
    pnpm build
    echo ""
    echo "✓ Production build complete!"
    echo "  Output directory: dist/"
}

# Function to build and preview
run_build_and_preview() {
    kill_existing_instance
    echo ""
    echo "Building for production..."
    pnpm build
    echo "✓ Production build complete!"
    echo ""
    echo "Starting preview server on port 2222..."
    echo "Visit: http://localhost:2222"
    echo ""
    pnpm preview
}

# Function to run all tests
run_tests() {
    echo ""
    echo "Running all tests..."
    pnpm test
    echo ""
    echo "✓ All tests passed!"
}

# Function to run scenario tests
run_scenario_tests() {
    echo ""
    echo "Running scenario tests (spreadsheet parity)..."
    pnpm test:scenarios
    echo ""
    echo "✓ Scenario tests complete!"
}

# Function to typecheck
run_typecheck() {
    echo ""
    echo "Running TypeScript type check..."
    pnpm typecheck
    echo ""
    echo "✓ Type check passed!"
}

# Function to clean and rebuild
run_clean_build() {
    echo ""
    echo "Cleaning dist/ directory..."
    rm -rf dist/
    echo "✓ Cleaned"
    echo ""
    echo "Building for production..."
    pnpm build
    echo ""
    echo "✓ Clean production build complete!"
}

# Function to run full pipeline
run_full_pipeline() {
    echo ""
    echo "Starting full build pipeline..."
    echo ""

    echo "[1/3] Running tests..."
    pnpm test
    echo "✓ Tests passed"
    echo ""

    echo "[2/3] Type checking..."
    pnpm typecheck
    echo "✓ Type check passed"
    echo ""

    echo "[3/3] Building for production..."
    pnpm build
    echo "✓ Production build complete"
    echo ""

    echo "================================"
    echo "✓ Full build pipeline complete!"
    echo "================================"
    echo "Output directory: dist/"
}

# Function to kill existing instance
kill_existing_instance() {
    echo ""
    echo "Checking for existing instances on port 2222..."

    local pid=""

    # Try lsof first (most reliable)
    if command -v lsof &> /dev/null; then
        pid=$(lsof -ti :2222 2>/dev/null | head -1)
    # Fallback to ss if available (Linux)
    elif command -v ss &> /dev/null; then
        pid=$(ss -ltnp 2>/dev/null | grep :2222 | grep -oP 'pid=\K[0-9]+' | head -1)
    # Fallback to netstat (older systems)
    elif command -v netstat &> /dev/null; then
        pid=$(netstat -ltnp 2>/dev/null | grep :2222 | awk '{print $NF}' | cut -d/ -f1 | head -1)
    fi

    if [ -z "$pid" ] || [ "$pid" = "-" ]; then
        echo "✓ No existing instance found on port 2222"
    else
        echo "Found existing process (PID: $pid) on port 2222"
        echo "Killing process..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
        echo "✓ Process killed successfully"
    fi
}

# Function to run full pipeline and start server
run_full_pipeline_and_serve() {
    kill_existing_instance
    echo ""
    run_full_pipeline
    echo ""
    echo "Starting preview server on port 2222..."
    echo "Visit: http://localhost:2222"
    echo ""
    pnpm preview
}

# Main logic
show_menu

case $choice in
    1)
        run_dev
        ;;
    2)
        run_build
        ;;
    3)
        run_build_and_preview
        ;;
    4)
        run_tests
        ;;
    5)
        run_scenario_tests
        ;;
    6)
        run_typecheck
        ;;
    7)
        run_clean_build
        ;;
    8)
        run_full_pipeline
        ;;
    9)
        run_full_pipeline_and_serve
        ;;
    10)
        kill_existing_instance
        ;;
    *)
        echo "Invalid choice. Please enter a number between 1-10."
        exit 1
        ;;
esac

echo ""
echo "Done!"
