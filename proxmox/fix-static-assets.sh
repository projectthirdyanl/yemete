#!/bin/bash
# Fix script to restore missing static assets
# This ensures CSS/JS files are accessible to the Next.js standalone server
# Run this on the production server (192.168.120.50)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration - adjust these to match your deployment
APP_DIR="/opt/apps/yemete"
SERVICE_USER="it-admin"
SERVICE_NAME="yametee-web"

echo -e "${GREEN}=========================================="
echo "Fix Static Assets for Yametee Web"
echo "==========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: App directory not found: $APP_DIR${NC}"
    echo "Please update APP_DIR in this script to match your deployment"
    exit 1
fi

cd "$APP_DIR"

# Check if .next/static exists
echo -e "${GREEN}[1/5] Checking static assets...${NC}"
if [ ! -d ".next/static" ] || [ -z "$(ls -A .next/static 2>/dev/null)" ]; then
    echo -e "${YELLOW}Static assets missing or empty. Rebuilding...${NC}"
    
    # Check if build exists
    if [ ! -f ".next/standalone/server.js" ]; then
        echo -e "${YELLOW}Build not found. Running full build...${NC}"
        
        # Ensure .env exists
        if [ ! -f ".env" ]; then
            echo -e "${RED}Error: .env file not found at $APP_DIR/.env${NC}"
            exit 1
        fi
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo -e "${GREEN}Installing dependencies...${NC}"
            su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm ci --production=false"
        fi
        
        # Generate Prisma Client
        echo -e "${GREEN}Generating Prisma Client...${NC}"
        su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npx prisma generate"
        
        # Build application
        echo -e "${GREEN}Building Next.js application...${NC}"
        su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"
    else
        echo -e "${YELLOW}Standalone build exists but static assets missing. Rebuilding...${NC}"
        # Clean and rebuild
        rm -rf .next/static
        su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"
    fi
fi

# Verify static assets exist
if [ ! -d ".next/static" ] || [ -z "$(ls -A .next/static 2>/dev/null)" ]; then
    echo -e "${RED}Error: Static assets still missing after build${NC}"
    echo "Build may have failed. Check logs above."
    exit 1
fi

echo -e "${GREEN}✓ Static assets found${NC}"

# Check standalone directory
echo -e "${GREEN}[2/5] Checking standalone build...${NC}"
if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}Error: Standalone server.js not found${NC}"
    echo "Running full rebuild..."
    rm -rf .next
    su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"
fi

echo -e "${GREEN}✓ Standalone build found${NC}"

# Verify static assets are accessible from standalone directory
echo -e "${GREEN}[3/5] Verifying static asset accessibility...${NC}"
STATIC_COUNT=$(find .next/static -type f 2>/dev/null | wc -l)
if [ "$STATIC_COUNT" -eq 0 ]; then
    echo -e "${RED}Error: No static files found in .next/static${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found $STATIC_COUNT static files${NC}"

# Check file permissions
echo -e "${GREEN}[4/5] Checking file permissions...${NC}"
chown -R "$SERVICE_USER:$SERVICE_USER" .next/static .next/standalone
chmod -R u+r .next/static .next/standalone
echo -e "${GREEN}✓ Permissions set correctly${NC}"

# Test if CSS files are accessible
echo -e "${GREEN}[5/5] Testing static asset access...${NC}"
CSS_FILE=$(find .next/static -name "*.css" -type f | head -1)
if [ -n "$CSS_FILE" ]; then
    echo -e "${GREEN}✓ Found CSS file: $(basename $CSS_FILE)${NC}"
else
    echo -e "${YELLOW}Warning: No CSS files found in static directory${NC}"
fi

# Restart service
echo -e "${GREEN}Restarting service...${NC}"
systemctl restart "$SERVICE_NAME"

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✓ Service is running${NC}"
    
    # Test CSS endpoint
    echo -e "${GREEN}Testing CSS endpoint...${NC}"
    sleep 3
    
    if [ -n "$CSS_FILE" ]; then
        CSS_RELATIVE_PATH=$(echo "$CSS_FILE" | sed 's|^\.next/static/||')
        CSS_URL="http://localhost:3000/_next/static/$CSS_RELATIVE_PATH"
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CSS_URL" || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ CSS endpoint accessible (HTTP $HTTP_CODE)${NC}"
        else
            echo -e "${YELLOW}Warning: CSS endpoint returned HTTP $HTTP_CODE${NC}"
            echo "URL tested: $CSS_URL"
        fi
    fi
    
    # Test health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${YELLOW}Warning: Health check failed${NC}"
    fi
    
    echo -e "${GREEN}=========================================="
    echo "Fix completed successfully!"
    echo ""
    echo "Static assets are now available at:"
    echo "  $APP_DIR/.next/static"
    echo ""
    echo "Service status:"
    systemctl status "$SERVICE_NAME" --no-pager -l | head -15
    echo ""
    echo "Test the site at:"
    echo "  http://192.168.120.50:3000"
    echo ""
    echo "If styling is still missing, check browser console for 404 errors"
    echo "on CSS/JS files and verify the static directory is accessible."
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

