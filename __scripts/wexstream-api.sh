#!/bin/bash

cd /opt/wexstream/api
/usr/bin/node -r dotenv/config app.js

DATE=`date '+%Y-%m-%d %H:%M:%S'`
echo "Wexstream service started at ${DATE}"
$SHELL
