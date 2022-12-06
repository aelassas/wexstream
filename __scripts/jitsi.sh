#!/bin/bash

DNS="www.wexstream.com"

log () { echo "$(date '+%d-%m-%Y-%H-%M-%S') - $1"; }

# get the actual IP from the Internet
IP=$(curl -sS https://ipinfo.io/ip | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")
#IP=$(curl -sS https://checkip.amazonaws.com | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")
#IP=$(curl -sS https://ifconfig.me/ip | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")
#IP=$(curl -sS https://ipecho.net/plain | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")
#IP=$(curl -sS https://ident.me | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")
#IP=$(curl -sS https://icanhazip.com | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")

#IP=$(host -tA $DNS 8.8.8.8 | grep address | cut -d " " -f4 )

# get the configured IP of Jitsi
JitsiIP=$(sudo grep "NAT_HARVESTER_PUBLIC_ADDRESS" /etc/jitsi/videobridge/sip-communicator.properties | sudo grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+")

if [ -n "$IP" ] && [ -n "$JitsiIP" ] && [ "$JitsiIP" != "$IP" ]
then
    log "Updating Jitsi public IP..."
    log "Jitsi IP: $JitsiIP"
    log "Public IP: $IP"
    sudo sed -i "/org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=*/c\org.ice4j.ice.harvest.NAT_HARVESTER_PUBLIC_ADDRESS=$IP" /etc/jitsi/videobridge/sip-communicator.properties
    log "Jitsi IP Updated."

    # restart Jitsi services
    sudo service jicofo restart
    sudo service prosody restart
    sudo service jitsi-videobridge2 restart
    log "Jitsi services restared."
fi

# get the configured IP of Turn
#TurnIP=$(sudo grep "external-ip" /etc/turnserver.conf | sudo grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | head -1)
TurnIP=

if [ -n "$IP" ] && [ -n "$TurnIP" ] &&  [ "$TurnIP" != "$IP" ]
then
    log "Updating Turn public IP..."
    log "Turn IP: $TurnIP"
    log "Public IP: $IP"
    sudo sed -i "/external-ip=*/c\external-ip=$IP/192.168.1.107" /etc/turnserver.conf
    log "Turn IP Updated."

   # restart Turn services
   sudo service coturn restart
   log "Turn service restarted."
fi
