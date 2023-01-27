#!/bin/bash

echo "Deploying Wexstream API..."

cd /opt/wexstream
git reset --hard
git pull
chmod +x -R /opt/wexstream/__scripts

cd /opt/wexstream/api
npm ci

sudo systemctl restart wexstream-api
sudo systemctl status wexstream-api --no-pager

echo "Wexstream API deployed."

$SHEL
