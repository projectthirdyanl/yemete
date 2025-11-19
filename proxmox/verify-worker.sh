#!/bin/bash
# Worker Verification Script
# Run this on the Worker VM (192.168.120.45) to verify everything is working

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Worker Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration (adjust if needed)
REDIS_HOST="${REDIS_HOST:-192.168.120.44}"
DB_HOST="${DB_HOST:-192.168.120.42}"
DB_USER="${DB_USER:-yametee_user}"
DB_NAME="${DB_NAME:-yame_tee}"

# 1. Check Worker Service Status
echo -e "${YELLOW}1. Worker Service Status:${NC}"
if systemctl is-active --quiet yametee-worker; then
    echo -e "${GREEN}✓ Worker service is running${NC}"
    systemctl status yametee-worker --no-pager -l | head -5
else
    echo -e "${RED}✗ Worker service is NOT running${NC}"
    echo "  Start with: sudo systemctl start yametee-worker"
fi
echo ""

# 2. Check Redis Connection
echo -e "${YELLOW}2. Redis Connection:${NC}"
if redis-cli -h "$REDIS_HOST" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis connection successful${NC}"
    echo "  Host: $REDIS_HOST"
else
    echo -e "${RED}✗ Redis connection failed${NC}"
    echo "  Check: redis-cli -h $REDIS_HOST ping"
fi
echo ""

# 3. Check Database Connection
echo -e "${YELLOW}3. Database Connection:${NC}"
if command -v psql &> /dev/null; then
    if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
        echo "  Host: $DB_HOST"
        echo "  Database: $DB_NAME"
    else
        echo -e "${YELLOW}⚠ Database connection test skipped (password required)${NC}"
        echo "  Test manually: psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
    fi
else
    echo -e "${YELLOW}⚠ psql not found, skipping database test${NC}"
fi
echo ""

# 4. Check Queue Status
echo -e "${YELLOW}4. Redis Queue Status:${NC}"
if redis-cli -h "$REDIS_HOST" ping > /dev/null 2>&1; then
    QUEUE_LEN=$(redis-cli -h "$REDIS_HOST" LLEN yametee:jobs 2>/dev/null || echo "0")
    echo "  Queue name: yametee:jobs"
    echo "  Jobs in queue: $QUEUE_LEN"
    if [ "$QUEUE_LEN" -gt 0 ]; then
        echo -e "${YELLOW}  ⚠ Warning: $QUEUE_LEN job(s) pending${NC}"
    else
        echo -e "${GREEN}  ✓ Queue is empty (no pending jobs)${NC}"
    fi
else
    echo -e "${RED}✗ Cannot check queue (Redis connection failed)${NC}"
fi
echo ""

# 5. Check Recent Worker Logs
echo -e "${YELLOW}5. Recent Worker Logs (last 10 lines):${NC}"
if systemctl is-active --quiet yametee-worker; then
    journalctl -u yametee-worker -n 10 --no-pager | tail -10 || echo "No logs available"
else
    echo -e "${RED}Worker not running, cannot show logs${NC}"
fi
echo ""

# 6. Test Job Processing (Optional)
echo -e "${YELLOW}6. Test Job Processing:${NC}"
read -p "Do you want to queue a test job? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if redis-cli -h "$REDIS_HOST" ping > /dev/null 2>&1; then
        TEST_JOB='{"id":"test-'$(date +%s)'","type":"order:process","data":{"orderId":"test-order-123"},"createdAt":"'$(date -Iseconds)'"}'
        redis-cli -h "$REDIS_HOST" RPUSH yametee:jobs "$TEST_JOB" > /dev/null
        echo -e "${GREEN}✓ Test job queued${NC}"
        echo "  Watch logs: sudo journalctl -u yametee-worker -f"
        echo "  Job should be processed within 1-5 seconds"
    else
        echo -e "${RED}✗ Cannot queue test job (Redis connection failed)${NC}"
    fi
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"

ALL_OK=true

if ! systemctl is-active --quiet yametee-worker; then
    ALL_OK=false
fi

if ! redis-cli -h "$REDIS_HOST" ping > /dev/null 2>&1; then
    ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✓ Worker appears to be functioning correctly${NC}"
    echo ""
    echo "Useful commands:"
    echo "  View logs: sudo journalctl -u yametee-worker -f"
    echo "  Restart: sudo systemctl restart yametee-worker"
    echo "  Status: sudo systemctl status yametee-worker"
    echo "  Queue length: redis-cli -h $REDIS_HOST LLEN yametee:jobs"
else
    echo -e "${RED}✗ Some issues detected. Please review the checks above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Start worker: sudo systemctl start yametee-worker"
    echo "  2. Check Redis: redis-cli -h $REDIS_HOST ping"
    echo "  3. Check logs: sudo journalctl -u yametee-worker -n 50"
fi

echo ""
