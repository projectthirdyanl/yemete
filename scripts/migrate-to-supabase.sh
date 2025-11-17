#!/bin/bash

# Migration script: Proxmox PostgreSQL → Supabase
# Usage: ./scripts/migrate-to-supabase.sh

set -e

echo "🚀 Yametee Database Migration to Supabase"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found. Please install PostgreSQL client tools.${NC}"
    echo "   macOS: brew install postgresql"
    echo "   Linux: sudo apt install postgresql-client"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Export data from Proxmox database${NC}"
echo "----------------------------------------"
read -p "Enter Proxmox database host [192.168.120.6]: " PROXMOX_HOST
PROXMOX_HOST=${PROXMOX_HOST:-192.168.120.6}

read -p "Enter database user [itadmin]: " PROXMOX_USER
PROXMOX_USER=${PROXMOX_USER:-itadmin}

read -p "Enter database name [yame_tee]: " PROXMOX_DB
PROXMOX_DB=${PROXMOX_DB:-yame_tee}

read -sp "Enter database password: " PROXMOX_PASS
echo ""

BACKUP_FILE="yametee_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Exporting database..."
export PGPASSWORD="$PROXMOX_PASS"
pg_dump -h "$PROXMOX_HOST" -U "$PROXMOX_USER" -d "$PROXMOX_DB" -F p > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Import to Supabase${NC}"
echo "----------------------------------------"
echo "Get your Supabase connection string from:"
echo "  Supabase Dashboard → Settings → Database → Connection string"
echo ""
read -p "Enter Supabase connection string: " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ Connection string is required!${NC}"
    exit 1
fi

echo "Importing to Supabase..."
psql "$SUPABASE_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Data imported successfully!${NC}"
else
    echo -e "${RED}❌ Import failed! Check the error above.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Run Prisma migrations${NC}"
echo "----------------------------------------"
read -p "Run Prisma migrations? (y/n) [y]: " RUN_PRISMA
RUN_PRISMA=${RUN_PRISMA:-y}

if [ "$RUN_PRISMA" = "y" ]; then
    echo "Generating Prisma Client..."
    npx prisma generate
    
    echo "Pushing schema..."
    npx prisma db push --skip-generate
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Prisma migrations completed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Prisma migrations had issues. Check output above.${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in Vercel:"
echo "   Vercel Dashboard → Settings → Environment Variables"
echo "   Set DATABASE_URL to: $SUPABASE_URL"
echo ""
echo "2. Redeploy Vercel app:"
echo "   vercel --prod"
echo ""
echo "3. Test connection:"
echo "   https://your-app.vercel.app/api/test-db"
echo ""
echo "Backup file saved as: $BACKUP_FILE"
echo ""
