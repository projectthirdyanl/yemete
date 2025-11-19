#!/bin/bash
# Queue a test job to Redis
# Usage: bash proxmox/queue-test-job.sh [job-type] [order-id]

REDIS_HOST="${REDIS_HOST:-192.168.120.44}"
JOB_TYPE="${1:-order:process}"
ORDER_ID="${2:-test-order-$(date +%s)}"

# Create job JSON
JOB_JSON=$(cat <<EOF
{
  "id": "test-$(date +%s)",
  "type": "$JOB_TYPE",
  "data": {
    "orderId": "$ORDER_ID"
  },
  "createdAt": "$(date -Iseconds)"
}
EOF
)

echo "Queueing test job..."
echo "Type: $JOB_TYPE"
echo "Order ID: $ORDER_ID"
echo ""

# Queue the job
redis-cli -h "$REDIS_HOST" RPUSH yametee:jobs "$JOB_JSON"

# Check queue length
QUEUE_LEN=$(redis-cli -h "$REDIS_HOST" LLEN yametee:jobs)
echo ""
echo "Queue length: $QUEUE_LEN"
echo ""
echo "Watch worker logs: journalctl -u yametee-worker -f"
