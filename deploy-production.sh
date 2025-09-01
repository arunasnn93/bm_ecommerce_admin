#!/bin/bash

# Quick Production Deployment Script for BM Admin App
# Railway Backend: https://api.groshly.com

set -e

echo "🚀 BM Admin App - Production Deployment"
echo "======================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checks...${NC}"

# Check if production env file exists
if [ ! -f "env.production" ]; then
    echo "❌ Error: env.production file not found!"
    exit 1
fi

# Check if Railway backend URL is configured
if ! grep -q "api.groshly.com" env.production; then
    echo "❌ Error: Railway backend URL not configured in env.production!"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration verified${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci

# Run linting
echo -e "${BLUE}🔍 Running linter...${NC}"
npm run lint

# Build for production
echo -e "${BLUE}🏗️  Building for production...${NC}"
npm run build:production

echo -e "${GREEN}✅ Production build completed successfully!${NC}"

# Show build info
echo -e "${BLUE}📊 Build Information:${NC}"
echo "  - Bundle size: $(du -sh dist | cut -f1)"
echo "  - Files generated: $(find dist -type f | wc -l)"
  echo "  - Backend URL: https://api.groshly.com"

# Deployment options
echo -e "${YELLOW}🚀 Choose your deployment method:${NC}"
echo ""
echo "1. Netlify (Recommended - Free, Easy)"
echo "2. Vercel (Recommended - Free, Easy)"
echo "3. GitHub Pages (Free)"
echo "4. Manual deployment"
echo "5. Docker deployment"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${BLUE}📤 Deploying to Netlify...${NC}"
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        else
            echo "❌ Netlify CLI not installed. Please install it first:"
            echo "   npm install -g netlify-cli"
            echo "   Then run: netlify deploy --prod --dir=dist"
        fi
        ;;
    2)
        echo -e "${BLUE}📤 Deploying to Vercel...${NC}"
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not installed. Please install it first:"
            echo "   npm install -g vercel"
            echo "   Then run: vercel --prod"
        fi
        ;;
    3)
        echo -e "${BLUE}📤 Deploying to GitHub Pages...${NC}"
        if [ -d ".git" ]; then
            npm install --save-dev gh-pages
            npm run deploy
        else
            echo "❌ Not a git repository. Please initialize git first."
        fi
        ;;
    4)
        echo -e "${BLUE}📤 Manual deployment instructions:${NC}"
        echo ""
        echo "Your production build is ready in the 'dist' folder."
        echo "Upload the contents of 'dist' to your web server."
        echo ""
        echo "For Nginx, copy files to: /var/www/bm-admin/"
        echo "For Apache, copy files to: /var/www/html/"
        echo ""
        echo "Don't forget to configure your web server to serve the React app!"
        ;;
    5)
        echo -e "${BLUE}🐳 Building Docker image...${NC}"
        docker build -t bm-admin-app:production .
        echo -e "${GREEN}✅ Docker image built: bm-admin-app:production${NC}"
        echo ""
        echo "To run the container:"
        echo "docker run -d -p 80:80 bm-admin-app:production"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deployment process completed!${NC}"
echo ""
echo -e "${BLUE}📋 Post-deployment checklist:${NC}"
echo "  ✅ Test the deployed application"
echo "  ✅ Verify API connectivity"
echo "  ✅ Test login functionality"
echo "  ✅ Check all features work"
echo "  ✅ Test on mobile devices"
echo ""
echo -e "${YELLOW}🔗 Backend API: https://api.groshly.com${NC}"
echo -e "${YELLOW}📚 Documentation: Check PRODUCTION_DEPLOYMENT.md for detailed instructions${NC}"
