# Quick Setup Instructions

## First Time Deployment

If you don't have a systemd service set up yet, run the full deployment script:

### For Web Platform:
```bash
cd /opt/apps/yemete
sudo bash proxmox/deploy-web-direct.sh
```

This will:
- Create the systemd service (`yametee-web`)
- Set up the application directory
- Install dependencies
- Build the application
- Start the service

### For Worker:
```bash
cd /opt/apps/yemete
sudo bash proxmox/deploy-worker-direct.sh
```

## Updating Existing Deployment

If you already have a systemd service running, use the quick deploy script:

```bash
cd /opt/apps/yemete
sudo bash proxmox/quick-deploy.sh
```

## Manual Override (if detection fails)

If the quick-deploy script can't detect your setup, you can manually specify:

```bash
# For web platform
APP_DIR=/opt/apps/yemete SERVICE_NAME=yametee-web SERVICE_USER=yametee sudo bash proxmox/quick-deploy.sh

# For worker
APP_DIR=/opt/apps/yemete SERVICE_NAME=yametee-worker SERVICE_USER=yametee-worker sudo bash proxmox/quick-deploy.sh
```

## Check Current Setup

```bash
# Check if services exist
systemctl list-units --type=service --all | grep -i yametee

# Check service status
sudo systemctl status yametee-web
# or
sudo systemctl status yametee-worker
```
