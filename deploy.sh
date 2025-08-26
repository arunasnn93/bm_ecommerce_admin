#!/bin/bash

# BM Admin App Deployment Script

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default values
ENVIRONMENT="production"
BUILD_ONLY=false
DOCKER_BUILD=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -d|--docker)
            DOCKER_BUILD=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --env ENV        Environment (development|staging|production) [default: production]"
            echo "  -b, --build-only     Only build, don't deploy"
            echo "  -d, --docker         Build Docker image"
            echo "  -h, --help           Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Starting deployment for environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Allowed values: development, staging, production"
    exit 1
fi

# Check if environment file exists
ENV_FILE="env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
fi

# Copy environment file for build
print_status "Setting up environment configuration..."
cp "$ENV_FILE" .env

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run linting
print_status "Running linter..."
npm run lint

# Build the application
print_status "Building application for $ENVIRONMENT..."
case $ENVIRONMENT in
    "staging")
        npm run build:staging
        ;;
    "production")
        npm run build:production
        ;;
    *)
        npm run build
        ;;
esac

print_success "Build completed successfully!"

# If build-only flag is set, exit here
if [[ "$BUILD_ONLY" = true ]]; then
    print_success "Build-only mode: Deployment complete!"
    exit 0
fi

# Docker build
if [[ "$DOCKER_BUILD" = true ]]; then
    print_status "Building Docker image..."
    docker build -t "bm-admin-app:$ENVIRONMENT" .
    print_success "Docker image built: bm-admin-app:$ENVIRONMENT"
    
    if [[ "$ENVIRONMENT" = "production" ]]; then
        print_status "Starting production Docker stack..."
        docker-compose -f docker-compose.prod.yml up -d
        print_success "Production stack started!"
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 10
        
        # Health check
        print_status "Running health checks..."
        if curl -f http://localhost/health > /dev/null 2>&1; then
            print_success "Health check passed!"
        else
            print_warning "Health check failed. Please check the logs."
        fi
    fi
else
    # Static deployment
    print_status "Preparing static files for deployment..."
    
    case $ENVIRONMENT in
        "production")
            DEPLOY_PATH="/var/www/bm-admin"
            ;;
        "staging")
            DEPLOY_PATH="/var/www/bm-admin-staging"
            ;;
        *)
            DEPLOY_PATH="./preview"
            ;;
    esac
    
    # Create deployment directory
    mkdir -p "$DEPLOY_PATH"
    
    # Copy built files
    print_status "Copying files to $DEPLOY_PATH..."
    cp -r dist/* "$DEPLOY_PATH/"
    
    # Set proper permissions
    if [[ "$ENVIRONMENT" = "production" || "$ENVIRONMENT" = "staging" ]]; then
        sudo chown -R www-data:www-data "$DEPLOY_PATH"
        sudo chmod -R 755 "$DEPLOY_PATH"
    fi
    
    print_success "Static deployment completed!"
fi

# Display deployment information
print_status "Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Build Time: $(date)"
echo "  Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

case $ENVIRONMENT in
    "production")
        echo "  URL: https://yourdomain.com"
        ;;
    "staging")
        echo "  URL: https://staging.yourdomain.com"
        ;;
    "development")
        echo "  URL: http://localhost:5173"
        ;;
esac

print_success "Deployment completed successfully! 🚀"

# Cleanup
rm -f .env

print_status "Deployment script finished."
