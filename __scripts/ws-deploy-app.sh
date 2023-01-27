#!/bin/bash

start_time=`date +%s`
echo "Deploying Wexstream app..."

cd /opt/wexstream/frontend
git pull
sudo chmod +x -R /opt/wexstream/__scripts

sudo rm -rf build
npm ci
npm run build

sudo rm -rf /var/www/wexstream
sudo mkdir -p /var/www/wexstream
sudo cp -rf build/* /var/www/wexstream

sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

finish_time=`date +%s`
elapsed_time=$((finish_time  - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60, hrs=elapsed_time/60))
timestamp=$(printf "Wexstream app deployed in %d minutes and %d seconds." $min $sec)
echo $timestamp
