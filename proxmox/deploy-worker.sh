#!/bin/bash
# Deployment script for Background Worker VM (192.168.120.45)
# Run this script on the background-job VM

set -e

echo "=========================================="
echo "Yametee Background Worker Deployment"
echo "=========================================="

# Configuration
IMAGE_NAME="yametee-worker"
CONTAINER_NAME="yametee-worker"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your configuration${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Stop existing container if running
if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
    echo -e "${YELLOW}Stopping existing container...${NC}"
    docker-compose -f docker-compose.worker.yml down
fi

# Pull latest code (if using git)
if [ -d .git ]; then
    echo -e "${GREEN}Pulling latest code...${NC}"
    git pull || echo -e "${YELLOW}Warning: Could not pull latest code${NC}"
fi

# Build and start container
echo -e "${GREEN}Building and starting container...${NC}"
docker-compose -f docker-compose.worker.yml up -d --build

# Wait for container to start
echo -e "${GREEN}Waiting for container to start...${NC}"
sleep 10

# Check container status
if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo -e "${GREEN}Container is running${NC}"
    
    # Show logs
    echo -e "${GREEN}Container logs:${NC}"
    docker logs --tail 50 ${CONTAINER_NAME}
else
    echo -e "${RED}Error: Container failed to start${NC}"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo "Worker is running and processing jobs"
echo "==========================================${NC}"
