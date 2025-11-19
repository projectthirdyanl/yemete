#!/bin/bash
# Setup script for Node.js installation on Ubuntu/Debian systems
# Run this script first on each VM/CT before deploying the application

set -e

echo "=========================================="
echo "Node.js Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo -e "${RED}Cannot detect OS${NC}"
    exit 1
fi

echo -e "${GREEN}Detected OS: $OS $VER${NC}"

# Update system
echo -e "${GREEN}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install required system dependencies
echo -e "${GREEN}Installing system dependencies...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js 20.x using NodeSource repository
echo -e "${GREEN}Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo -e "${YELLOW}Node.js version is less than 20, upgrading...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    else
        echo -e "${GREEN}Node.js $(node -v) is already installed${NC}"
    fi
fi

# Verify installation
echo -e "${GREEN}Verifying installation...${NC}"
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}npm: $NPM_VERSION${NC}"

# Install PM2 globally for process management (optional, but recommended)
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}Installing PM2...${NC}"
    npm install -g pm2
    echo -e "${GREEN}PM2 installed successfully${NC}"
else
    echo -e "${GREEN}PM2 is already installed${NC}"
fi

# Install global npm packages that might be needed
echo -e "${GREEN}Installing global npm packages...${NC}"
npm install -g tsx prisma

echo -e "${GREEN}=========================================="
echo "Node.js setup completed successfully!"
echo "Node.js: $NODE_VERSION"
echo "npm: $NPM_VERSION"
echo "==========================================${NC}"
