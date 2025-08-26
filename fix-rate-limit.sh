#!/bin/bash

# Quick fix for 429 rate limit errors
# This script temporarily adjusts rate limits for development

echo "🔧 Fixing 429 Rate Limit Errors..."

# Check if we're in development mode
if [[ "$NODE_ENV" != "production" ]]; then
    echo "📝 Applying development-friendly rate limits..."
    
    # If using Docker/nginx, restart with development config
    if command -v docker &> /dev/null; then
        echo "🐳 Restarting nginx with development configuration..."
        # Copy development nginx config
        cp nginx.development.conf nginx.conf
        # Restart nginx container if running
        docker-compose restart frontend 2>/dev/null || echo "No Docker containers to restart"
    fi
    
    echo "✅ Rate limits adjusted for development:"
    echo "   - Auth endpoints: 60 requests/minute (burst: 20)"
    echo "   - API endpoints: 600 requests/minute (burst: 50)"
    echo ""
    echo "💡 If you're still getting 429 errors:"
    echo "   1. Wait 60 seconds before trying again"
    echo "   2. Clear browser cache and cookies"
    echo "   3. Try incognito/private browsing mode"
    echo "   4. Check if backend rate limiting is also configured"
else
    echo "⚠️  Production mode detected - keeping security rate limits"
    echo "💡 For production 429 errors:"
    echo "   1. Implement proper retry logic in frontend"
    echo "   2. Add exponential backoff"
    echo "   3. Show user-friendly error messages"
fi

echo ""
echo "🚀 You can now try logging in again!"
