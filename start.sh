#!/bin/bash

echo "════════════════════════════════════════════════"
echo "       🎬 Zeloz Streaming Platform 🎬           "
echo "       Starting your private Netflix...         "
echo "════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo "Recommended version: 16.x or higher"
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "On macOS, you can install it with:"
        echo "  brew install node"
    fi
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} detected${NC}"

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed!${NC}"
    echo ""
    echo "Please install npm (comes with Node.js)"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION} detected${NC}"
echo ""

# Check if dependencies need to be installed
NEED_INSTALL=0

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}ℹ Root dependencies not found${NC}"
    NEED_INSTALL=1
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}ℹ Backend dependencies not found${NC}"
    NEED_INSTALL=1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}ℹ Frontend dependencies not found${NC}"
    NEED_INSTALL=1
fi

if [ $NEED_INSTALL -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚙ Installing dependencies...${NC}"
    echo -e "${BLUE}This may take 2-5 minutes on first run...${NC}"
    echo ""

    echo -e "${BLUE}[1/3] Installing root dependencies...${NC}"
    npm install --silent
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install root dependencies${NC}"
        echo "Try running: npm install"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo -e "${GREEN}✓ Root dependencies installed${NC}"

    echo -e "${BLUE}[2/3] Installing backend dependencies...${NC}"
    cd backend && npm install --silent
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install backend dependencies${NC}"
        echo "Try running: cd backend && npm install"
        read -p "Press Enter to exit..."
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"

    echo -e "${BLUE}[3/3] Installing frontend dependencies...${NC}"
    cd frontend && npm install --silent
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        echo "Try running: cd frontend && npm install"
        read -p "Press Enter to exit..."
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

    echo ""
    echo -e "${GREEN}✓ All dependencies installed successfully!${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙ Creating .env file from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}⚠ Remember to update JWT_SECRET in .env for production!${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠ .env.example not found, creating default .env${NC}"
        cat > .env << 'EOF'
PORT=5000
JWT_SECRET=change-this-to-a-random-string-in-production
MAX_FILE_SIZE=10737418240
EOF
        echo -e "${GREEN}✓ Default .env file created${NC}"
        echo ""
    fi
fi

# Check if port 5000 is available
if command_exists lsof; then
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}✗ Port 5000 is already in use!${NC}"
        echo ""
        echo "Please close the application using port 5000 or change PORT in .env"
        echo ""
        read -p "Press Enter to exit..."
        exit 1
    fi

    # Check if port 5173 is available (frontend dev server)
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠ Port 5173 is already in use, frontend may not start${NC}"
        echo ""
    fi
fi

echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""

# Get local network IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

# If we couldn't get IP, use localhost
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
fi

echo -e "${BLUE}Starting servers...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Access on this computer:${NC}"
echo -e "  Frontend: http://localhost:5173"
echo -e "  Backend:  http://localhost:5000"
echo ""
echo -e "${GREEN}Access from other devices:${NC}"
echo -e "  Frontend: ${BLUE}http://${LOCAL_IP}:5173${NC}"
echo -e "  Backend:  http://${LOCAL_IP}:5000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to gracefully exit
trap 'echo -e "\n${YELLOW}Shutting down servers...${NC}"; kill 0; exit' INT

# Start the application
npm run dev

# This runs when the servers are stopped
echo ""
echo "════════════════════════════════════════════════"
echo "       Servers stopped. Goodbye! 👋             "
echo "════════════════════════════════════════════════"
