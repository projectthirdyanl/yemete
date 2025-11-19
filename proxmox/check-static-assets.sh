#!/bin/bash
# Quick diagnostic script to check if static assets are accessible
# Run this to diagnose the "pure HTML" styling issue

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/apps/yemete"
SERVICE_NAME="yametee-web"

echo -e "${GREEN}=========================================="
echo "Static Assets Diagnostic"
echo "==========================================${NC}"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}✗ App directory not found: $APP_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}App directory: $APP_DIR${NC}"
echo ""

# Check standalone build
echo -e "${YELLOW}[1] Checking standalone build...${NC}"
if [ -f "$APP_DIR/.next/standalone/server.js" ]; then
    echo -e "${GREEN}✓ Standalone server.js found${NC}"
else
    echo -e "${RED}✗ Standalone server.js NOT found${NC}"
    echo "  Location: $APP_DIR/.next/standalone/server.js"
fi

# Check static directory
echo -e "${YELLOW}[2] Checking static assets directory...${NC}"
if [ -d "$APP_DIR/.next/static" ]; then
    STATIC_COUNT=$(find "$APP_DIR/.next/static" -type f 2>/dev/null | wc -l)
    if [ "$STATIC_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ Static directory exists with $STATIC_COUNT files${NC}"
        
        # Check for CSS files
        CSS_COUNT=$(find "$APP_DIR/.next/static" -name "*.css" -type f 2>/dev/null | wc -l)
        if [ "$CSS_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ Found $CSS_COUNT CSS files${NC}"
            CSS_FILE=$(find "$APP_DIR/.next/static" -name "*.css" -type f | head -1)
            echo "  Example: $(basename $CSS_FILE)"
        else
            echo -e "${RED}✗ No CSS files found${NC}"
        fi
        
        # Check for JS files
        JS_COUNT=$(find "$APP_DIR/.next/static" -name "*.js" -type f 2>/dev/null | wc -l)
        if [ "$JS_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ Found $JS_COUNT JS files${NC}"
        else
            echo -e "${YELLOW}⚠ No JS files found (may be normal)${NC}"
        fi
    else
        echo -e "${RED}✗ Static directory exists but is EMPTY${NC}"
    fi
else
    echo -e "${RED}✗ Static directory NOT found${NC}"
    echo "  Expected: $APP_DIR/.next/static"
fi

# Check permissions
echo -e "${YELLOW}[3] Checking file permissions...${NC}"
if [ -d "$APP_DIR/.next/static" ]; then
    STATIC_OWNER=$(stat -c '%U:%G' "$APP_DIR/.next/static" 2>/dev/null || echo "unknown")
    STATIC_PERMS=$(stat -c '%a' "$APP_DIR/.next/static" 2>/dev/null || echo "unknown")
    echo "  Owner: $STATIC_OWNER"
    echo "  Permissions: $STATIC_PERMS"
    
    if [ -r "$APP_DIR/.next/static" ]; then
        echo -e "${GREEN}✓ Static directory is readable${NC}"
    else
        echo -e "${RED}✗ Static directory is NOT readable${NC}"
    fi
fi

# Check service status
echo -e "${YELLOW}[4] Checking service status...${NC}"
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓ Service is running${NC}"
    
    # Test CSS endpoint
    if [ -n "$CSS_FILE" ]; then
        CSS_RELATIVE=$(echo "$CSS_FILE" | sed "s|^$APP_DIR/.next/static/||")
        CSS_URL="http://localhost:3000/_next/static/$CSS_RELATIVE"
        
        echo -e "${YELLOW}[5] Testing CSS endpoint...${NC}"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CSS_URL" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ CSS endpoint accessible (HTTP 200)${NC}"
            echo "  URL: $CSS_URL"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo -e "${RED}✗ CSS endpoint returned 404${NC}"
            echo "  URL: $CSS_URL"
            echo "  This means the server cannot find the static file"
        elif [ "$HTTP_CODE" = "500" ]; then
            echo -e "${RED}✗ CSS endpoint returned 500 (server error)${NC}"
            echo "  URL: $CSS_URL"
        else
            echo -e "${YELLOW}⚠ CSS endpoint returned HTTP $HTTP_CODE${NC}"
            echo "  URL: $CSS_URL"
        fi
    fi
else
    echo -e "${RED}✗ Service is NOT running${NC}"
    echo "  Run: sudo systemctl status $SERVICE_NAME"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Diagnostic Complete"
echo "==========================================${NC}"

# Provide recommendations
if [ ! -d "$APP_DIR/.next/static" ] || [ -z "$(ls -A $APP_DIR/.next/static 2>/dev/null)" ]; then
    echo ""
    echo -e "${YELLOW}RECOMMENDATION:${NC}"
    echo "  Static assets are missing. Run the fix script:"
    echo "  sudo bash proxmox/fix-static-assets.sh"
elif [ "$HTTP_CODE" != "200" ] && [ -n "$HTTP_CODE" ]; then
    echo ""
    echo -e "${YELLOW}RECOMMENDATION:${NC}"
    echo "  Static assets exist but are not accessible via HTTP."
    echo "  This may be a path or permission issue."
    echo "  Try running: sudo bash proxmox/fix-static-assets.sh"
fi

