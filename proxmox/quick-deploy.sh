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

# Get current directory (might be a hint)
CURRENT_DIR=$(pwd)

# Allow manual override via environment variables
if [ -n "$APP_DIR" ] && [ -n "$SERVICE_NAME" ] && [ -n "$SERVICE_USER" ]; then
    if [ -z "$DEPLOYMENT_TYPE" ]; then
        if echo "$SERVICE_NAME" | grep -q "worker"; then
            DEPLOYMENT_TYPE="worker"
        else
            DEPLOYMENT_TYPE="web"
        fi
    fi
    echo -e "${GREEN}Using manual configuration:${NC}"
    echo "  APP_DIR=$APP_DIR"
    echo "  SERVICE_NAME=$SERVICE_NAME"
    echo "  SERVICE_USER=$SERVICE_USER"
    echo "  DEPLOYMENT_TYPE=$DEPLOYMENT_TYPE"
elif systemctl list-units --type=service --all | grep -q "yametee-web.service"; then
    SERVICE_NAME="yametee-web"
    SERVICE_USER="yametee"
    DEPLOYMENT_TYPE="web"
    
    # Try to find app directory from systemd service file
    if [ -f "/etc/systemd/system/yametee-web.service" ]; then
        # Extract WorkingDirectory or EnvironmentFile path from service file
        WORK_DIR=$(grep "^WorkingDirectory=" /etc/systemd/system/yametee-web.service | sed 's/.*=//' | xargs)
        ENV_FILE=$(grep "^EnvironmentFile=" /etc/systemd/system/yametee-web.service | sed 's/.*=//' | xargs)
        
        # If WorkingDirectory contains .next/standalone, go up two levels
        if [ -n "$WORK_DIR" ]; then
            if echo "$WORK_DIR" | grep -q "\.next/standalone"; then
                APP_DIR=$(dirname $(dirname "$WORK_DIR"))
            else
                APP_DIR="$WORK_DIR"
            fi
        elif [ -n "$ENV_FILE" ]; then
            # Extract directory from .env file path
            APP_DIR=$(dirname "$ENV_FILE")
        fi
        
        # Validate and fallback to common locations if needed
        if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
            # Check if current directory looks like the app directory
            if [ -f "$CURRENT_DIR/package.json" ] && [ -f "$CURRENT_DIR/prisma/schema.prisma" ]; then
                APP_DIR="$CURRENT_DIR"
            else
                # Try common locations
                for dir in "/opt/yametee" "/opt/apps/yemete" "/opt/apps/yametee" "/home/yametee/yametee"; do
                    if [ -d "$dir" ]; then
                        APP_DIR="$dir"
                        break
                    fi
                done
            fi
        fi
    else
        # Check if current directory looks like the app directory
        if [ -f "$CURRENT_DIR/package.json" ] && [ -f "$CURRENT_DIR/prisma/schema.prisma" ]; then
            APP_DIR="$CURRENT_DIR"
        else
            # Try common locations
            for dir in "/opt/yametee" "/opt/apps/yemete" "/opt/apps/yametee" "/home/yametee/yametee"; do
                if [ -d "$dir" ]; then
                    APP_DIR="$dir"
                    break
                fi
            done
        fi
    fi
    
elif systemctl list-units --type=service --all | grep -q "yametee-worker.service"; then
    SERVICE_NAME="yametee-worker"
    SERVICE_USER="yametee-worker"
    DEPLOYMENT_TYPE="worker"
    
    # Try to find app directory from systemd service file
    if [ -f "/etc/systemd/system/yametee-worker.service" ]; then
        WORK_DIR=$(grep "^WorkingDirectory=" /etc/systemd/system/yametee-worker.service | sed 's/.*=//' | xargs)
        ENV_FILE=$(grep "^EnvironmentFile=" /etc/systemd/system/yametee-worker.service | sed 's/.*=//' | xargs)
        
        if [ -n "$WORK_DIR" ]; then
            APP_DIR="$WORK_DIR"
        elif [ -n "$ENV_FILE" ]; then
            APP_DIR=$(dirname "$ENV_FILE")
        fi
        
        # Validate and fallback to common locations if needed
        if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
            # Try common locations
            for dir in "/opt/yametee-worker" "/opt/apps/yemete-worker" "/opt/apps/yametee-worker" "/home/yametee-worker/yametee"; do
                if [ -d "$dir" ]; then
                    APP_DIR="$dir"
                    break
                fi
            done
        fi
    else
        # Try common locations
        for dir in "/opt/yametee-worker" "/opt/apps/yemete-worker" "/opt/apps/yametee-worker" "/home/yametee-worker/yametee"; do
            if [ -d "$dir" ]; then
                APP_DIR="$dir"
                break
            fi
        done
    fi
else
    echo -e "${RED}Error: Could not detect deployment type${NC}"
    echo ""
    echo "Available systemd services:"
    systemctl list-units --type=service --all | grep -i yametee || echo "  (none found)"
    echo ""
    echo "Please either:"
    echo "  1. Run the full deployment script: deploy-web-direct.sh or deploy-worker-direct.sh"
    echo "  2. Or specify manually:"
    echo "     DEPLOYMENT_TYPE=web APP_DIR=/opt/apps/yemete SERVICE_NAME=yametee-web SERVICE_USER=yametee bash quick-deploy.sh"
    exit 1
fi

# Validate detected values
if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Could not find application directory${NC}"
    echo "Detected service: $SERVICE_NAME"
    echo "Expected directory: $APP_DIR"
    echo ""
    echo "Please specify manually:"
    echo "  APP_DIR=/opt/apps/yemete bash quick-deploy.sh"
    exit 1
fi

# Verify service user exists
if ! id "$SERVICE_USER" &>/dev/null; then
    echo -e "${YELLOW}Warning: Service user '$SERVICE_USER' not found${NC}"
    echo "Trying to detect from service file..."
    if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
        SERVICE_USER=$(grep "^User=" "/etc/systemd/system/$SERVICE_NAME.service" | sed 's/User=//' | xargs)
        if [ -z "$SERVICE_USER" ]; then
            echo -e "${RED}Error: Could not determine service user${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: Service user '$SERVICE_USER' does not exist${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}=========================================="
echo "Quick Update: $DEPLOYMENT_TYPE"
echo "Service: $SERVICE_NAME"
echo "Directory: $APP_DIR"
echo "User: $SERVICE_USER"
echo "==========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Check if in git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Warning: Not in a git repository${NC}"
    echo "Please navigate to the repository directory first"
    exit 1
fi

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
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm ci --production=false"

# Generate Prisma Client
echo -e "${GREEN}Generating Prisma Client...${NC}"
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npx prisma generate"

# Run migrations (web only)
if [ "$DEPLOYMENT_TYPE" = "web" ]; then
    echo -e "${GREEN}Running database migrations...${NC}"
    su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npx prisma migrate deploy" || echo -e "${YELLOW}Warning: Migration failed or no migrations to run${NC}"
    
    # Rebuild application
    echo -e "${GREEN}Rebuilding Next.js application...${NC}"
    su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"
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
