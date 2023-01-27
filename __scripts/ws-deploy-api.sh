#!/bin/bash

start_time=`date +%s`
echo "Deploying Wexstream API..."

cd /opt/wexstream
git reset --hard
git pull
chmod +x -R /opt/wexstream/__scripts

cd /opt/wexstream/api
npm ci

sudo systemctl restart wexstream-api
sudo systemctl status wexstream-api --no-pager

finish_time=`date +%s`
elapsed_time=$((finish_time  - start_time))
((sec=elapsed_time%60, elapsed_time/=60, min=elapsed_time%60, hrs=elapsed_time/60))
timestamp=$(printf "Wexstream API deployed in %d minutes and %d seconds." $min $sec)
echo $timestamp
