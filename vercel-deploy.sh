#!/bin/bash

# Vercel Deployment Helper Script
# This script helps deploy Yametee to Vercel

set -e

echo "🚀 Yametee Vercel Deployment Helper"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo "📋 Step 1: Login to Vercel"
echo "---------------------------"
echo "This will open your browser for authentication..."
vercel login

echo ""
echo "📦 Step 2: Linking Project (if first time)"
echo "-------------------------------------------"
echo "If this is your first deployment, Vercel will ask you to link the project."
echo "Follow the prompts..."
vercel link

echo ""
echo "🔐 Step 3: Setting Environment Variables"
echo "------------------------------------------"
echo "We'll now set up your environment variables..."
echo ""

# Read from .env file and set to Vercel
if [ -f .env ]; then
    echo "Reading environment variables from .env file..."
    
    # Function to set env var in Vercel
    set_vercel_env() {
        local key=$1
        local value=$2
        local env_type=${3:-production}
        
        echo "Setting $key for $env_type..."
        echo "$value" | vercel env add "$key" "$env_type" --yes 2>/dev/null || \
        echo "$value" | vercel env add "$key" "$env_type" --yes --force
    }
    
    # Extract values from .env (basic parsing)
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove quotes from value
        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/')
        
        # Skip if value is empty or placeholder
        [[ "$value" == *"..."* ]] && continue
        [[ "$value" == *"your-"* ]] && continue
        
        echo "Found: $key"
    done < .env
    
    echo ""
    echo -e "${YELLOW}⚠️  Note: You'll need to manually set environment variables in Vercel dashboard${NC}"
    echo "Or use: vercel env add VARIABLE_NAME production"
    echo ""
fi

echo ""
echo "🚀 Step 4: Deploying to Vercel Preview"
echo "---------------------------------------"
echo "Deploying to preview/staging environment..."
vercel

echo ""
echo -e "${GREEN}✅ Deployment initiated!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   https://vercel.com/dashboard -> Your Project -> Settings -> Environment Variables"
echo ""
echo "2. Required variables:"
echo "   - DATABASE_URL"
echo "   - PAYMONGO_SECRET_KEY"
echo "   - PAYMONGO_PUBLIC_KEY"
echo "   - PAYMONGO_WEBHOOK_SECRET"
echo "   - NEXTAUTH_URL (set to your Vercel URL)"
echo "   - NEXTAUTH_SECRET"
echo "   - ADMIN_JWT_SECRET"
echo ""
echo "3. After setting variables, redeploy:"
echo "   vercel --prod  (for production)"
echo "   vercel         (for preview)"
echo ""
