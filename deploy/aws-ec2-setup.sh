#!/usr/bin/env bash
# ==============================================================================
# RentaTool LK - Automated AWS EC2 Server Setup Script (Ubuntu 24.04 LTS)
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "🚀 Initializing RentaTool LK Server on AWS EC2"
echo "=========================================================="

# 1. Update package lists
echo "📦 Updating OS packages..."
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    git \
    ufw

# 2. Configure 4GB Swap Space (Protects against OOM during builds)
if [ ! -f /swapfile ]; then
    echo "💾 Setting up 4GB Swap space..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo "✅ Swap configured successfully."
else
    echo "ℹ️ Swap file already exists. Skipping."
fi

# 3. Install official Docker Engine & Docker Compose
echo "🐳 Installing Docker Engine & Docker Compose plugin..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Enable Docker & add current user to docker group
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

# 5. Configure Firewall (UFW)
echo "🛡️ Configuring Firewall rules (SSH, HTTP, HTTPS)..."
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Web'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw allow 5000/tcp comment 'Direct Backend API'
sudo ufw allow 3000/tcp comment 'Direct Web Admin'
sudo ufw --force enable

echo "=========================================================="
echo "🎉 AWS EC2 Server Setup Completed Successfully!"
echo "=========================================================="
echo ""
echo "Next steps to run the RentaTool stack:"
echo "1. Log out and back in, or run: newgrp docker"
echo "2. Clone your repository:"
echo "   git clone https://github.com/jerun276/RentaTool.git"
echo "   cd RentaTool"
echo "3. Create your production environment file:"
echo "   cp .env.production.example .env.production"
echo "   nano .env.production   # Edit your passwords and Gemini API key"
echo "4. Launch the entire production stack:"
echo "   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build"
echo "5. Check status of running containers:"
echo "   docker compose -f docker-compose.prod.yml ps"
echo ""
