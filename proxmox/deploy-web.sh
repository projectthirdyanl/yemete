#!/bin/bash
# Deployment script for Web Platform VM (192.168.120.50)
# Run this script on the web-platform VM

set -e

echo "=========================================="
echo "Yametee Web Platform Deployment"
echo "=========================================="

# Configuration
IMAGE_NAME="yametee-web"
CONTAINER_NAME="yametee-web"
PORT=3000

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
    docker-compose -f docker-compose.web.yml down
fi

# Pull latest code (if using git)
if [ -d .git ]; then
    echo -e "${GREEN}Pulling latest code...${NC}"
    git pull || echo -e "${YELLOW}Warning: Could not pull latest code${NC}"
fi

# Build and start container
echo -e "${GREEN}Building and starting container...${NC}"
docker-compose -f docker-compose.web.yml up -d --build

# Wait for container to be healthy
echo -e "${GREEN}Waiting for container to be healthy...${NC}"
sleep 10

# Check container status
if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo -e "${GREEN}Container is running${NC}"
    
    # Check health endpoint
    echo -e "${GREEN}Checking health endpoint...${NC}"
    sleep 5
    if curl -f http://localhost:${PORT}/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${YELLOW}Warning: Health check failed, but container is running${NC}"
    fi
    
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
echo "Web platform is available at: http://192.168.120.50:${PORT}"
echo "==========================================${NC}"
