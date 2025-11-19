#!/bin/bash
# Fix PM2 systemd service - handles "start request repeated too quickly" error
# Run as root

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICE_USER="it-admin"
APP_DIR="/opt/apps/yemete"

echo -e "${GREEN}Fixing PM2 service...${NC}"

# Stop the service first
systemctl stop pm2-it-admin.service 2>/dev/null || true

# Switch to service user and setup PM2
echo -e "${GREEN}Setting up PM2 for user $SERVICE_USER...${NC}"

# Start PM2 and save processes
su - "$SERVICE_USER" << 'EOF'
cd /opt/apps/yemete

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Kill any existing PM2 processes
pm2 kill 2>/dev/null || true

# Start the app with PM2
if [ -f ecosystem.config.js ]; then
    pm2 start ecosystem.config.js
else
    echo "Warning: ecosystem.config.js not found, starting manually..."
    pm2 start npm --name yametee-web -- start
fi

# Save PM2 process list
pm2 save

# Show PM2 status
pm2 list
EOF

# Create/update the service file with proper configuration
echo -e "${GREEN}Creating PM2 systemd service...${NC}"

cat > /etc/systemd/system/pm2-it-admin.service << 'EOFSERVICE'
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=it-admin
LimitNOFILE=infinity
LimitNPROC=infinity
PIDFile=/home/it-admin/.pm2/pm2.pid
Restart=on-failure
RestartSec=10

# Wait for PM2 to be ready
ExecStartPre=/bin/sleep 2
ExecStart=/usr/bin/env pm2 resurrect
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/usr/bin/env pm2 kill

# Don't restart too quickly
StartLimitInterval=60
StartLimitBurst=3

[Install]
WantedBy=multi-user.target
EOFSERVICE

# Reload systemd
systemctl daemon-reload

# Wait a moment
sleep 2

# Start the service
echo -e "${GREEN}Starting PM2 service...${NC}"
systemctl start pm2-it-admin.service

# Wait and check status
sleep 3

if systemctl is-active --quiet pm2-it-admin.service; then
    echo -e "${GREEN}✓ PM2 service is running${NC}"
    systemctl status pm2-it-admin.service --no-pager -l
else
    echo -e "${YELLOW}Service status:${NC}"
    systemctl status pm2-it-admin.service --no-pager -l || true
    echo ""
    echo -e "${YELLOW}Recent logs:${NC}"
    journalctl -u pm2-it-admin.service -n 30 --no-pager || true
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Check if PM2 processes are saved:"
    echo "   su - it-admin -c 'pm2 list'"
    echo ""
    echo "2. Check PM2 PID file:"
    echo "   ls -la /home/it-admin/.pm2/pm2.pid"
    echo ""
    echo "3. Try starting PM2 manually:"
    echo "   su - it-admin -c 'cd /opt/apps/yemete && pm2 start ecosystem.config.js && pm2 save'"
fi

echo -e "${GREEN}=========================================="
echo "PM2 service setup complete!"
echo ""
echo "Useful commands:"
echo "  Check PM2 processes: su - it-admin -c 'pm2 list'"
echo "  View PM2 logs: su - it-admin -c 'pm2 logs'"
echo "  Restart PM2: systemctl restart pm2-it-admin"
echo "  Service status: systemctl status pm2-it-admin"
echo "==========================================${NC}"
