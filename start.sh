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
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js from https://nodejs.org/"
    echo "Recommended version: 16.x or higher"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
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

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚙ Installing dependencies...${NC}"
    echo "This may take a few minutes on first run..."
    echo ""

    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install root dependencies${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi

    cd backend && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install backend dependencies${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
    cd ..

    cd frontend && npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
    cd ..

    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
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
        echo -e "${YELLOW}⚠ Please update JWT_SECRET in .env for production!${NC}"
        echo ""
    else
        echo -e "${RED}✗ .env.example not found${NC}"
    fi
fi

# Check if port 5000 is available
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

echo -e "${GREEN}✓ All checks passed!${NC}"
echo ""
echo "Starting servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the application
npm run dev

# This runs when the servers are stopped
echo ""
echo "════════════════════════════════════════════════"
echo "       Servers stopped. Goodbye! 👋             "
echo "════════════════════════════════════════════════"
