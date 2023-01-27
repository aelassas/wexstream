#!/bin/bash

echo "Deploying Wexstream app..."

cd /opt/wexstream/frontend
git reset --hard
git pull
chmod +x -R /opt/wexstream/__scripts

sudo rm -rf build
npm ci
npm run build

sudo rm -rf /var/www/wexstream
sudo mkdir -p /var/www/wexstream
sudo cp -rf build/* /var/www/wexstream

sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

echo "Wexstream app deployed."
