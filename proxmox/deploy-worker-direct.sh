#!/bin/bash
# Direct deployment script for Background Worker VM/CT (192.168.120.45)
# This script deploys the worker process without Docker
# Run this script on the background-worker VM/CT

set -e

echo "=========================================="
echo "Yametee Background Worker Direct Deployment"
echo "=========================================="

# Configuration
APP_NAME="yametee-worker"
APP_DIR="/opt/yametee-worker"
SERVICE_USER="yametee-worker"
WORKER_SCRIPT="scripts/worker.ts"

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
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm ci --production=false"

# Generate Prisma Client
echo -e "${GREEN}Generating Prisma Client...${NC}"
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npx prisma generate"

# Determine tsx path (check after dependencies are installed)
TSX_PATH=""
if [ -f "$APP_DIR/node_modules/.bin/tsx" ]; then
    TSX_PATH="$APP_DIR/node_modules/.bin/tsx"
    echo -e "${GREEN}Using local tsx at: $TSX_PATH${NC}"
elif command -v tsx &> /dev/null; then
    TSX_PATH=$(command -v tsx)
    echo -e "${GREEN}Found global tsx at: $TSX_PATH${NC}"
else
    echo -e "${GREEN}Installing tsx globally...${NC}"
    npm install -g tsx
    TSX_PATH=$(command -v tsx)
    if [ -z "$TSX_PATH" ]; then
        # Fallback to npx if tsx still not found
        echo -e "${YELLOW}tsx not found in PATH, will use npx${NC}"
        TSX_PATH="npx"
    fi
fi

# Create systemd service file
echo -e "${GREEN}Creating systemd service...${NC}"
cat > /etc/systemd/system/yametee-worker.service <<EOF
[Unit]
Description=Yametee Background Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
EnvironmentFile=$APP_DIR/.env
ExecStart=$TSX_PATH $APP_DIR/$WORKER_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=yametee-worker

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
if systemctl is-active --quiet yametee-worker; then
    echo -e "${YELLOW}Stopping existing service...${NC}"
    systemctl stop yametee-worker
fi

# Start and enable service
echo -e "${GREEN}Starting service...${NC}"
systemctl enable yametee-worker
systemctl start yametee-worker

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet yametee-worker; then
    echo -e "${GREEN}Service is running${NC}"
    
    # Show service status
    echo -e "${GREEN}Service status:${NC}"
    systemctl status yametee-worker --no-pager -l
else
    echo -e "${RED}Error: Service failed to start${NC}"
    echo -e "${YELLOW}Checking service status...${NC}"
    systemctl status yametee-worker --no-pager -l
    echo ""
    echo -e "${YELLOW}Recent logs:${NC}"
    journalctl -u yametee-worker -n 50 --no-pager
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "  1. Check if DATABASE_URL is set in $APP_DIR/.env"
    echo "  2. Verify database is accessible: su -s /bin/bash $SERVICE_USER -c 'psql \$DATABASE_URL -c \"SELECT 1\"'"
    echo "  3. Check Redis connection (if used): redis-cli -h 192.168.120.44 ping"
    echo "  4. Test worker manually: su -s /bin/bash $SERVICE_USER -c '$TSX_PATH $APP_DIR/$WORKER_SCRIPT'"
    echo "  5. Check file permissions: ls -la $APP_DIR"
    exit 1
fi

echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "Worker is running and processing jobs"
echo ""
echo "Useful commands:"
echo "  View logs: journalctl -u yametee-worker -f"
echo "  Restart: systemctl restart yametee-worker"
echo "  Status: systemctl status yametee-worker"
echo "==========================================${NC}"
