#!/bin/bash
# Restart all Yametee services
# Run as root

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=========================================="
echo "Restarting All Yametee Services"
echo "==========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Restart web platform
echo -e "${GREEN}Restarting web platform...${NC}"
if systemctl list-units --type=service --all | grep -q "yametee-web.service"; then
    systemctl restart yametee-web
    sleep 3
    if systemctl is-active --quiet yametee-web; then
        echo -e "${GREEN}✓ Web platform restarted${NC}"
    else
        echo -e "${RED}✗ Web platform failed to start${NC}"
    fi
else
    echo -e "${YELLOW}Web platform service not found${NC}"
fi

# Restart worker
echo -e "${GREEN}Restarting background worker...${NC}"
if systemctl list-units --type=service --all | grep -q "yametee-worker.service"; then
    systemctl restart yametee-worker
    sleep 3
    if systemctl is-active --quiet yametee-worker; then
        echo -e "${GREEN}✓ Worker restarted${NC}"
    else
        echo -e "${RED}✗ Worker failed to start${NC}"
    fi
else
    echo -e "${YELLOW}Worker service not found${NC}"
fi

# Check PM2 (if used)
echo -e "${GREEN}Checking PM2...${NC}"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "yametee"; then
        echo -e "${GREEN}Restarting PM2 processes...${NC}"
        su - it-admin -c "pm2 restart all" 2>/dev/null || echo -e "${YELLOW}PM2 restart skipped${NC}"
    fi
fi

echo -e "${GREEN}=========================================="
echo "All services restarted"
echo ""
echo "Service status:"
echo "  Web Platform: $(systemctl is-active yametee-web 2>/dev/null || echo 'not found')"
echo "  Worker: $(systemctl is-active yametee-worker 2>/dev/null || echo 'not found')"
echo "==========================================${NC}"
