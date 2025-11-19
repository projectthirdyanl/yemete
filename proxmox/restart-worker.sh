#!/bin/bash
# Restart worker service and verify it's working

echo "Restarting yametee-worker service..."
systemctl restart yametee-worker

echo "Waiting 3 seconds for service to start..."
sleep 3

echo ""
echo "Service status:"
systemctl status yametee-worker --no-pager -l | head -15

echo ""
echo "Recent logs (last 20 lines):"
journalctl -u yametee-worker -n 20 --no-pager

echo ""
echo "If you see 'Redis connection successful' and 'Worker yametee-worker ready', everything is working!"
echo ""
echo "To watch logs in real-time: journalctl -u yametee-worker -f"
