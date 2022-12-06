#!/bin/bash

sudo /etc/init.d/coturn restart
sudo systemctl status coturn --no-pager

sudo /etc/init.d/jicofo restart
sudo systemctl status jicofo --no-pager

sudo /etc/init.d/jitsi-videobridge2 restart
sudo systemctl status jitsi-videobridge2 --no-pager

sudo /etc/init.d/prosody restart
sudo systemctl status prosody --no-pager

sudo /etc/init.d/nginx restart
sudo systemctl status nginx --no-pager
