#!/bin/bash
# Fix PM2 systemd service
# This script checks and fixes common PM2 service issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE_USER="${SERVICE_USER:-it-admin}"
APP_DIR="${APP_DIR:-/opt/apps/yemete}"

echo -e "${GREEN}Checking PM2 setup...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 is not installed. Installing...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}✓ PM2 is installed${NC}"
fi

# Check if ecosystem file exists
if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
    echo -e "${RED}Error: ecosystem.config.js not found at $APP_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Ecosystem file found${NC}"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: App directory not found: $APP_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓ App directory exists${NC}"

# Create PM2 systemd service
echo -e "${GREEN}Creating PM2 systemd service...${NC}"

# Get PM2 startup script
PM2_STARTUP=$(pm2 startup systemd -u "$SERVICE_USER" --hp /home/$SERVICE_USER 2>&1 | grep "sudo" | tail -1)

if [ -z "$PM2_STARTUP" ]; then
    echo -e "${YELLOW}PM2 startup command not found. Creating service manually...${NC}"
    
    # Create service file manually
    cat > /etc/systemd/system/pm2-$SERVICE_USER.service <<EOF
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=$SERVICE_USER
LimitNOFILE=infinity
LimitNPROC=infinity
PIDFile=/home/$SERVICE_USER/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/bin/env pm2 resurrect
ExecReload=/usr/bin/env pm2 reload all
ExecStop=/usr/bin/env pm2 kill

[Install]
WantedBy=multi-user.target
EOF

else
    echo -e "${GREEN}Running PM2 startup command...${NC}"
    eval "$PM2_STARTUP"
fi

# Reload systemd
systemctl daemon-reload

echo -e "${GREEN}=========================================="
echo "PM2 service setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start your app with PM2:"
echo "     cd $APP_DIR"
echo "     pm2 start ecosystem.config.js"
echo ""
echo "  2. Save PM2 process list:"
echo "     pm2 save"
echo ""
echo "  3. Start the PM2 service:"
echo "     systemctl start pm2-$SERVICE_USER"
echo ""
echo "  4. Enable auto-start:"
echo "     systemctl enable pm2-$SERVICE_USER"
echo "==========================================${NC}"
