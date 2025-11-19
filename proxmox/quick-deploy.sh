#!/bin/bash
# Quick deployment script for updating existing deployment
# This script updates code, dependencies, and restarts services
# Run this script on the VM where you want to update

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect deployment type
if [ -d "/opt/yametee" ] && systemctl list-units | grep -q "yametee-web"; then
    DEPLOYMENT_TYPE="web"
    APP_DIR="/opt/yametee"
    SERVICE_NAME="yametee-web"
    SERVICE_USER="yametee"
elif [ -d "/opt/yametee-worker" ] && systemctl list-units | grep -q "yametee-worker"; then
    DEPLOYMENT_TYPE="worker"
    APP_DIR="/opt/yametee-worker"
    SERVICE_NAME="yametee-worker"
    SERVICE_USER="yametee-worker"
else
    echo -e "${RED}Error: Could not detect deployment type${NC}"
    echo "Please run the full deployment script: deploy-web-direct.sh or deploy-worker-direct.sh"
    exit 1
fi

echo -e "${GREEN}=========================================="
echo "Quick Update: $DEPLOYMENT_TYPE"
echo "==========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Check if in git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Warning: Not in a git repository${NC}"
    echo "Please navigate to the repository directory first"
    exit 1
fi

# Get current directory
CURRENT_DIR=$(pwd)

# Pull latest changes
echo -e "${GREEN}Pulling latest changes...${NC}"
git pull

# Copy files to deployment directory
echo -e "${GREEN}Copying files to $APP_DIR...${NC}"
if command -v rsync &> /dev/null; then
    rsync -av --exclude='.git' --exclude='node_modules' --exclude='.next' "$CURRENT_DIR/" "$APP_DIR/"
else
    find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'node_modules' ! -name '.next' -exec cp -r {} "$APP_DIR/" \;
fi

# Set ownership
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

# Update dependencies
echo -e "${GREEN}Updating dependencies...${NC}"
cd "$APP_DIR"
sudo -u "$SERVICE_USER" npm ci --production=false

# Generate Prisma Client
echo -e "${GREEN}Generating Prisma Client...${NC}"
sudo -u "$SERVICE_USER" npx prisma generate

# Run migrations (web only)
if [ "$DEPLOYMENT_TYPE" = "web" ]; then
    echo -e "${GREEN}Running database migrations...${NC}"
    sudo -u "$SERVICE_USER" npx prisma migrate deploy || echo -e "${YELLOW}Warning: Migration failed or no migrations to run${NC}"
    
    # Rebuild application
    echo -e "${GREEN}Rebuilding Next.js application...${NC}"
    sudo -u "$SERVICE_USER" npm run build
fi

# Restart service
echo -e "${GREEN}Restarting service...${NC}"
systemctl restart "$SERVICE_NAME"

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✓ Service restarted successfully${NC}"
    
    # Check health endpoint (web only)
    if [ "$DEPLOYMENT_TYPE" = "web" ]; then
        echo -e "${GREEN}Checking health endpoint...${NC}"
        sleep 3
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Health check passed${NC}"
        else
            echo -e "${YELLOW}Warning: Health check failed${NC}"
        fi
    fi
    
    echo -e "${GREEN}=========================================="
    echo "Update completed successfully!"
    echo ""
    echo "Useful commands:"
    echo "  View logs: journalctl -u $SERVICE_NAME -f"
    echo "  Status: systemctl status $SERVICE_NAME"
    echo "==========================================${NC}"
else
    echo -e "${RED}Error: Service failed to start${NC}"
    systemctl status "$SERVICE_NAME" --no-pager -l
    journalctl -u "$SERVICE_NAME" -n 50 --no-pager
    exit 1
fi
