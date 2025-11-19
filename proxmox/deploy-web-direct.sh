#!/bin/bash
# Direct deployment script for Web Platform VM/CT (192.168.120.50)
# This script deploys the application without Docker
# Run this script on the web-platform VM/CT

set -e

echo "=========================================="
echo "Yametee Web Platform Direct Deployment"
echo "=========================================="

# Configuration
APP_NAME="yametee-web"
APP_DIR="/opt/yametee"
SERVICE_USER="yametee"
PORT=3000

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Running setup script...${NC}"
    if [ -f "$(dirname "$0")/setup-nodejs.sh" ]; then
        bash "$(dirname "$0")/setup-nodejs.sh"
    else
        echo -e "${RED}setup-nodejs.sh not found. Please install Node.js manually.${NC}"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your configuration before continuing${NC}"
        echo -e "${YELLOW}Press Enter to continue after editing .env file...${NC}"
        read -r
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Create service user if it doesn't exist
if ! id "$SERVICE_USER" &>/dev/null; then
    echo -e "${GREEN}Creating service user: $SERVICE_USER${NC}"
    useradd -r -s /bin/bash -d "$APP_DIR" -m "$SERVICE_USER"
fi

# Create application directory
echo -e "${GREEN}Setting up application directory...${NC}"
mkdir -p "$APP_DIR"
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Copy application files
echo -e "${GREEN}Copying application files...${NC}"
if [ -d .git ]; then
    # If in a git repository, copy everything
    if command -v rsync &> /dev/null; then
        rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' . "$APP_DIR/"
    else
        # Fallback to cp if rsync is not available
        echo -e "${YELLOW}rsync not found, using cp instead...${NC}"
        find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'node_modules' ! -name '.next' -exec cp -r {} "$APP_DIR/" \;
    fi
else
    # Otherwise, copy current directory
    cp -r . "$APP_DIR/"
fi

# Set ownership
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Copy .env file
if [ -f .env ]; then
    cp .env "$APP_DIR/.env"
    chown "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
fi

# Switch to service user context for npm operations
echo -e "${GREEN}Installing dependencies...${NC}"
cd "$APP_DIR"
sudo -u "$SERVICE_USER" npm ci --production=false

# Generate Prisma Client
echo -e "${GREEN}Generating Prisma Client...${NC}"
sudo -u "$SERVICE_USER" npx prisma generate

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
sudo -u "$SERVICE_USER" npx prisma migrate deploy || echo -e "${YELLOW}Warning: Migration failed or no migrations to run${NC}"

# Build Next.js application
echo -e "${GREEN}Building Next.js application...${NC}"
sudo -u "$SERVICE_USER" npm run build

# Create systemd service file
echo -e "${GREEN}Creating systemd service...${NC}"

# Determine the correct server.js path based on Next.js standalone output
# Standalone output structure: .next/standalone/server.js
SERVER_JS_PATH="$APP_DIR/.next/standalone/server.js"
if [ ! -f "$SERVER_JS_PATH" ]; then
    # Fallback: check if it's in the root after build
    SERVER_JS_PATH="$APP_DIR/server.js"
    if [ ! -f "$SERVER_JS_PATH" ]; then
        echo -e "${RED}Error: Could not find server.js. Build may have failed.${NC}"
        exit 1
    fi
fi

cat > /etc/systemd/system/yametee-web.service <<EOF
[Unit]
Description=Yametee Web Platform
After=network.target postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR/.next/standalone
Environment="NODE_ENV=production"
Environment="PORT=$PORT"
Environment="HOSTNAME=0.0.0.0"
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=yametee-web

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Stop existing service if running
if systemctl is-active --quiet yametee-web; then
    echo -e "${YELLOW}Stopping existing service...${NC}"
    systemctl stop yametee-web
fi

# Start and enable service
echo -e "${GREEN}Starting service...${NC}"
systemctl enable yametee-web
systemctl start yametee-web

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet yametee-web; then
    echo -e "${GREEN}Service is running${NC}"
    
    # Check health endpoint
    echo -e "${GREEN}Checking health endpoint...${NC}"
    sleep 5
    if curl -f http://localhost:${PORT}/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${YELLOW}Warning: Health check failed, but service is running${NC}"
    fi
    
    # Show service status
    echo -e "${GREEN}Service status:${NC}"
    systemctl status yametee-web --no-pager -l
else
    echo -e "${RED}Error: Service failed to start${NC}"
    systemctl status yametee-web --no-pager -l
    journalctl -u yametee-web -n 50 --no-pager
    exit 1
fi

echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "Web platform is available at: http://0.0.0.0:${PORT}"
echo ""
echo "Useful commands:"
echo "  View logs: journalctl -u yametee-web -f"
echo "  Restart: systemctl restart yametee-web"
echo "  Status: systemctl status yametee-web"
echo "==========================================${NC}"
