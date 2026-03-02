#!/bin/bash

# Wind Turbine Monitoring System - Config Repository Git Initialization Script
# This script initializes the config repository and prepares it for GitHub

set -e

echo "🌬️ Wind Turbine Monitoring System - Config Repository Setup"
echo "=============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

echo -e "${BLUE}📁 Current directory: $(pwd)${NC}"
echo ""

# Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Initializing Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ Git repository initialized${NC}"
else
    echo -e "${GREEN}✅ Git repository already initialized${NC}"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}📝 Creating .gitignore...${NC}"
    cat > .gitignore << 'EOF'
# IDE
.idea/
.vscode/
*.iml
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Backup files
*.bak
*.tmp
*~

# Sensitive files (DO NOT COMMIT SECRETS!)
*-secret.yaml
*-secrets.yaml
*.key
*.pem
*.p12
*.jks
EOF
    echo -e "${GREEN}✅ .gitignore created${NC}"
else
    echo -e "${GREEN}✅ .gitignore already exists${NC}"
fi

# Add all files
echo -e "${YELLOW}📦 Adding all configuration files...${NC}"
git add .

# Check what's staged
echo -e "${BLUE}📋 Files to be committed:${NC}"
git status --short

echo ""
echo -e "${YELLOW}💾 Creating initial commit...${NC}"

# Create initial commit
if git diff --cached --quiet; then
    echo -e "${BLUE}ℹ️  No changes to commit (already committed)${NC}"
else
    git commit -m "Initial Wind Turbine Monitoring System configuration

- Global configuration with Actuator, Prometheus, and Zipkin
- Turbine Service: dev and prod profiles
- Telemetry Service: dev profile
- Alert Service: dev profile
- Gateway Service: routing configuration
- Spring Boot 4.0.2 + Spring Cloud 2024.0.0
- H2 database for development, PostgreSQL for production
- Flyway database migrations configured
- Comprehensive documentation"
    echo -e "${GREEN}✅ Initial commit created${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Git repository setup complete!${NC}"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo ""
echo "1️⃣  Create a new GitHub repository:"
echo "   - Go to: https://github.com/new"
echo "   - Repository name: wind-turbine-config"
echo "   - Description: Wind Turbine Monitoring System - Centralized Configuration"
echo "   - Make it Private (contains configuration)"
echo ""
echo "2️⃣  Add remote and push:"
echo "   ${YELLOW}git remote add origin https://github.com/YOUR_USERNAME/wind-turbine-config.git${NC}"
echo "   ${YELLOW}git branch -M main${NC}"
echo "   ${YELLOW}git push -u origin main${NC}"
echo ""
echo "3️⃣  Update Config Server to use GitHub repository:"
echo "   Edit: ../config-server/src/main/resources/application.yaml"
echo "   Change: spring.cloud.config.server.git.uri to your GitHub URL"
echo ""
echo "4️⃣  For SSH access (recommended):"
echo "   ${YELLOW}git remote set-url origin git@github.com:YOUR_USERNAME/wind-turbine-config.git${NC}"
echo ""
echo -e "${GREEN}✅ Configuration repository is ready to push!${NC}"
echo ""
