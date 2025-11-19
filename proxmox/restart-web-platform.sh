#!/bin/bash
# Complete restart script for web platform
# This will rebuild and restart the application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/apps/yemete"
SERVICE_USER="it-admin"
SERVICE_NAME="yametee-web"

echo -e "${GREEN}=========================================="
echo "Web Platform Complete Restart"
echo "==========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: App directory not found: $APP_DIR${NC}"
    exit 1
fi

cd "$APP_DIR"

# Step 1: Stop the service
echo -e "${GREEN}[1/6] Stopping service...${NC}"
systemctl stop "$SERVICE_NAME" 2>/dev/null || echo -e "${YELLOW}Service not running${NC}"

# Step 2: Clean build artifacts
echo -e "${GREEN}[2/6] Cleaning build artifacts...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✓ Build cache cleared${NC}"

# Step 3: Check .env file
echo -e "${GREEN}[3/6] Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Verify critical env vars
if ! grep -q "DATABASE_URL" .env; then
    echo -e "${YELLOW}Warning: DATABASE_URL not found in .env${NC}"
fi

if ! grep -q "ADMIN_JWT_SECRET" .env; then
    echo -e "${YELLOW}Warning: ADMIN_JWT_SECRET not found in .env${NC}"
fi

# Step 4: Install/update dependencies
echo -e "${GREEN}[4/6] Installing dependencies...${NC}"
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm ci --production=false"
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Generate Prisma Client
echo -e "${GREEN}[5/6] Generating Prisma Client...${NC}"
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npx prisma generate"
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# Step 6: Build the application
echo -e "${GREEN}[6/6] Building Next.js application...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"
su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"

if [ ! -f "$APP_DIR/.next/standalone/server.js" ]; then
    echo -e "${RED}Error: Build failed - server.js not found${NC}"
    echo -e "${YELLOW}Checking build output...${NC}"
    ls -la "$APP_DIR/.next/standalone/" 2>/dev/null || echo "Build directory not found"
    exit 1
fi

# Verify static assets exist (critical for CSS/JS)
if [ ! -d "$APP_DIR/.next/static" ] || [ -z "$(ls -A $APP_DIR/.next/static 2>/dev/null)" ]; then
    echo -e "${RED}Error: Static assets missing after build${NC}"
    echo -e "${YELLOW}This will cause unstyled pages. Rebuilding...${NC}"
    rm -rf "$APP_DIR/.next"
    su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"
    
    if [ ! -d "$APP_DIR/.next/static" ] || [ -z "$(ls -A $APP_DIR/.next/static 2>/dev/null)" ]; then
        echo -e "${RED}Error: Static assets still missing after rebuild${NC}"
        exit 1
    fi
fi

# Ensure proper permissions on static assets
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/.next/static" "$APP_DIR/.next/standalone"
chmod -R u+r "$APP_DIR/.next/static" "$APP_DIR/.next/standalone"

STATIC_COUNT=$(find "$APP_DIR/.next/static" -type f 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Build completed successfully${NC}"
echo -e "${GREEN}✓ Static assets verified ($STATIC_COUNT files)${NC}"

# Step 7: Restart the service
echo -e "${GREEN}[7/7] Restarting service...${NC}"
systemctl daemon-reload
systemctl restart "$SERVICE_NAME"

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✓ Service is running${NC}"
    
    # Check health endpoint
    echo -e "${GREEN}Checking health endpoint...${NC}"
    sleep 3
    
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${YELLOW}Warning: Health check failed${NC}"
    fi
    
    echo -e "${GREEN}=========================================="
    echo "Restart completed successfully!"
    echo ""
    echo "Service status:"
    systemctl status "$SERVICE_NAME" --no-pager -l | head -20
    echo ""
    echo "Useful commands:"
    echo "  View logs: journalctl -u $SERVICE_NAME -f"
    echo "  Check status: systemctl status $SERVICE_NAME"
    echo "  Test health: curl http://localhost:3000/api/health"
    echo ""
    echo "Application should be available at:"
    echo "  http://192.168.120.50:3000"
    echo "==========================================${NC}"
else
    echo -e "${RED}Error: Service failed to start${NC}"
    echo -e "${YELLOW}Service status:${NC}"
    systemctl status "$SERVICE_NAME" --no-pager -l
    echo ""
    echo -e "${YELLOW}Recent logs:${NC}"
    journalctl -u "$SERVICE_NAME" -n 50 --no-pager
    exit 1
fi
