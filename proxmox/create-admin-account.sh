#!/bin/bash
# Create admin account script
# Run this on the web platform VM

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yametee.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
ADMIN_NAME="${ADMIN_NAME:-Admin}"

echo -e "${GREEN}=========================================="
echo "Create Admin Account"
echo "==========================================${NC}"

# Get values from user or use defaults
read -p "Admin Email [$ADMIN_EMAIL]: " input_email
ADMIN_EMAIL=${input_email:-$ADMIN_EMAIL}

read -sp "Admin Password [$ADMIN_PASSWORD]: " input_password
echo ""
ADMIN_PASSWORD=${input_password:-$ADMIN_PASSWORD}

read -p "Admin Name [$ADMIN_NAME]: " input_name
ADMIN_NAME=${input_name:-$ADMIN_NAME}

# Validate email format
if [[ ! "$ADMIN_EMAIL" =~ ^[^\s@]+@[^\s@]+\.[^\s@]+$ ]]; then
    echo -e "${RED}Error: Invalid email format${NC}"
    exit 1
fi

# Validate password length
if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
    echo -e "${RED}Error: Password must be at least 6 characters long${NC}"
    exit 1
fi

# Detect app directory
if [ -d "/opt/apps/yemete" ]; then
    APP_DIR="/opt/apps/yemete"
elif [ -d "/opt/yametee" ]; then
    APP_DIR="/opt/yametee"
else
    echo -e "${RED}Error: Could not find application directory${NC}"
    exit 1
fi

echo -e "${GREEN}Using app directory: $APP_DIR${NC}"

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found at $APP_DIR/.env${NC}"
    exit 1
fi

# Create admin using npm script
echo -e "${GREEN}Creating admin account...${NC}"

cd "$APP_DIR"

# Use the seed script
if [ -f "scripts/seed-default-admin.ts" ]; then
    # Run with tsx
    npx tsx scripts/seed-default-admin.ts "$ADMIN_EMAIL" "$ADMIN_PASSWORD" || {
        echo -e "${YELLOW}Trying alternative method...${NC}"
        # Try using the init script
        if [ -f "scripts/init-admin.ts" ]; then
            npx tsx scripts/init-admin.ts "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$ADMIN_NAME"
        else
            echo -e "${RED}Error: Could not find admin creation script${NC}"
            exit 1
        fi
    }
else
    # Try init script
    if [ -f "scripts/init-admin.ts" ]; then
        npx tsx scripts/init-admin.ts "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "$ADMIN_NAME"
    else
        echo -e "${RED}Error: Could not find admin creation script${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}=========================================="
echo "Admin account created successfully!"
echo ""
echo "Credentials:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   Please change the password after first login!"
echo ""
echo "You can now login at:"
echo "  http://your-domain.com/admin/login"
echo "==========================================${NC}"
