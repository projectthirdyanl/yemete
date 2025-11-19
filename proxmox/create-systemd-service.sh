#!/bin/bash
# Create systemd service for yametee-web
# Run as root

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/apps/yemete"
SERVICE_USER="it-admin"
PORT=3000

echo -e "${GREEN}Creating yametee-web systemd service...${NC}"

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

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Warning: .env file not found at $APP_DIR/.env${NC}"
fi

# Check if built
if [ ! -f "$APP_DIR/.next/standalone/server.js" ]; then
    echo -e "${YELLOW}Warning: Build not found. Building now...${NC}"
    cd "$APP_DIR"
    su -s /bin/bash "$SERVICE_USER" -c "cd $APP_DIR && npm run build"
fi

# Determine server.js path
SERVER_JS_PATH="$APP_DIR/.next/standalone/server.js"
if [ ! -f "$SERVER_JS_PATH" ]; then
    SERVER_JS_PATH="$APP_DIR/server.js"
    if [ ! -f "$SERVER_JS_PATH" ]; then
        echo -e "${RED}Error: Could not find server.js. Please build the application first.${NC}"
        echo "Run: cd $APP_DIR && npm run build"
        exit 1
    fi
fi

echo -e "${GREEN}Using server.js at: $SERVER_JS_PATH${NC}"

# Find node binary
NODE_BIN=$(which node)
if [ -z "$NODE_BIN" ]; then
    echo -e "${RED}Error: Node.js not found in PATH${NC}"
    exit 1
fi

echo -e "${GREEN}Using Node.js at: $NODE_BIN${NC}"

# Create systemd service file
echo -e "${GREEN}Creating service file...${NC}"

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
ExecStart=$NODE_BIN server.js
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

# Enable service
systemctl enable yametee-web.service

echo -e "${GREEN}=========================================="
echo "Service created successfully!"
echo ""
echo "Service file: /etc/systemd/system/yametee-web.service"
echo ""
echo "To start the service:"
echo "  systemctl start yametee-web"
echo ""
echo "To check status:"
echo "  systemctl status yametee-web"
echo ""
echo "To view logs:"
echo "  journalctl -u yametee-web -f"
echo "==========================================${NC}"
