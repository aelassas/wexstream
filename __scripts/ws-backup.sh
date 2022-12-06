#!/bin/bash

HOST="localhost"
PORT=27017
AUTH_DB="admin"
USERNAME="admin"
PASSWORD="PASSWORD"
echo "Host: ${HOST}"
DATABASE_NAME="wexstream"
echo "Database: ${DATABASE_NAME}"
time=$(date '+%d-%m-%Y-%H-%M-%S')
BACKUP="/home/aelassas/wexstream/backup/${DATABASE_NAME}-${time}.gz"
echo "Backup: ${BACKUP}"
BACKUP_LATEST="/home/aelassas/wexstream/backup/${DATABASE_NAME}.gz"
echo "Latest Backup: ${BACKUP_LATEST}"

echo "Backuping ${DATABASE_NAME} database..."
mongodump --verbose --host=$HOST --port=$PORT --username=$USERNAME --password=$PASSWORD --authenticationDatabase=$AUTH_DB --db=$DATABASE_NAME --gzip --archive=$BACKUP
echo "Backup written in ${BACKUP}"
rm -f $BACKUP_LATEST
cp $BACKUP $BACKUP_LATEST
echo "Latest backup written in ${BACKUP_LATEST}"

CDN="/home/aelassas/wexstream/backup/cdn-${time}.zip"
CDN_LATEST="/home/aelassas/wexstream/backup/cdn.zip"
_PWD=$PWD

echo "Backuping cdn"
cd /var/www/cdn/wexstream/
sudo zip -r $CDN .
cd $_PWD
echo "cdn copied in ${CDN}"

rm -rf $CDN_LATEST
cp $CDN $CDN_LATEST
echo "Latest cdn written in ${CDN_LATEST}"
