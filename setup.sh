#!/bin/bash

# SmartCollab Monorepo Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 SmartCollab Monorepo Setup"
echo "=============================="

# Check prerequisites
echo ""
echo "✓ Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18"
    exit 1
fi
echo "  ✓ Node.js $(node --version)"

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi
echo "  ✓ pnpm $(pnpm --version)"

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Services will need to be started manually."
else
    echo "  ✓ Docker is installed"
fi

# Setup Java services directories
echo ""
echo "📁 Setting up Java service directories..."

NOTIFICATION_SERVICE_DIR="java-service/notification-service"

if [ ! -d "$NOTIFICATION_SERVICE_DIR/src/main/java/com/smartcollab/notification" ]; then
    mkdir -p "$NOTIFICATION_SERVICE_DIR/src/main/java/com/smartcollab/notification"
    mkdir -p "$NOTIFICATION_SERVICE_DIR/src/main/resources"
    mkdir -p "$NOTIFICATION_SERVICE_DIR/src/test/java"
    echo "  ✓ Created notification-service directory structure"
fi

# Move files if they exist in wrong location
if [ -f "$NOTIFICATION_SERVICE_DIR/NotificationServiceApplication.java" ]; then
    mv "$NOTIFICATION_SERVICE_DIR/NotificationServiceApplication.java" \
       "$NOTIFICATION_SERVICE_DIR/src/main/java/com/smartcollab/notification/"
    echo "  ✓ Moved NotificationServiceApplication.java"
fi

if [ -f "$NOTIFICATION_SERVICE_DIR/application.yml" ]; then
    mv "$NOTIFICATION_SERVICE_DIR/application.yml" \
       "$NOTIFICATION_SERVICE_DIR/src/main/resources/"
    echo "  ✓ Moved application.yml"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install
echo "  ✓ Dependencies installed"

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
pnpm prisma generate
echo "  ✓ Prisma client generated"

# Setup databases (optional)
echo ""
read -p "Do you want to start Docker services? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Starting Docker containers..."
    docker-compose up -d
    echo "  ✓ Docker services started"
    
    # Wait for services
    echo "  ⏳ Waiting for services to be ready..."
    sleep 5
    
    echo "  ✓ Services are ready"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure environment variables in .env files"
echo "2. Run migrations: pnpm prisma db push"
echo "3. Start services: pnpm dev:all"
echo ""
echo "📚 For more info, see SETUP_GUIDE.md"
