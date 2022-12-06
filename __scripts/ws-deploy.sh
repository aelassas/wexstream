#!/usr/bin/env bash

if [ "$1" == "all" ]; then
  /bin/bash /opt/wexstream/scripts/ws-deploy-api.sh
  /bin/bash /opt/wexstream/scripts/ws-deploy-app.sh
elif [ "$1" == "api" ]; then
  /bin/bash /opt/wexstream/scripts/ws-deploy-api.sh
elif [ "$1" == "app" ]; then
  /bin/bash /opt/wexstream/scripts/ws-deploy-app.sh
else
  echo "Usage: ws-deploy all|api|app"
fi

