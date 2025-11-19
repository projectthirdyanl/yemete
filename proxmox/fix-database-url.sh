#!/bin/bash
# Script to fix DATABASE_URL in .env file
# Usage: sudo bash proxmox/fix-database-url.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect app directory
if [ -f "/opt/apps/yemete/.env" ]; then
    ENV_FILE="/opt/apps/yemete/.env"
elif [ -f "/opt/yametee/.env" ]; then
    ENV_FILE="/opt/yametee/.env"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo "Error: Could not find .env file"
    exit 1
fi

echo -e "${GREEN}Found .env file: $ENV_FILE${NC}"

# Database credentials (update these if needed)
DB_HOST="${DB_HOST:-192.168.120.6}"
DB_NAME="${DB_NAME:-yame_tee}"
DB_USER="${DB_USER:-itadmin}"
DB_PASSWORD="${DB_PASSWORD:-thirdynalforever}"
DB_PORT="${DB_PORT:-5432}"

# Construct DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

echo -e "${GREEN}Updating DATABASE_URL...${NC}"
echo "  Host: $DB_HOST"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Port: $DB_PORT"

# Backup existing .env file
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}Backed up existing .env file${NC}"
fi

# Update or add DATABASE_URL
if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
    # Replace existing DATABASE_URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "$ENV_FILE"
    fi
    echo -e "${GREEN}Updated existing DATABASE_URL${NC}"
else
    # Add DATABASE_URL if it doesn't exist
    echo "" >> "$ENV_FILE"
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> "$ENV_FILE"
    echo -e "${GREEN}Added DATABASE_URL${NC}"
fi

echo -e "${GREEN}=========================================="
echo "DATABASE_URL updated successfully!"
echo ""
echo "New DATABASE_URL:"
echo "DATABASE_URL=\"${DATABASE_URL}\""
echo ""
echo "To verify, run:"
echo "  grep DATABASE_URL $ENV_FILE"
echo ""
echo "To test connection, run:"
echo "  psql \"${DATABASE_URL}\" -c \"SELECT 1\""
echo "==========================================${NC}"
