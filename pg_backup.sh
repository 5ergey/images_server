#!/bin/bash

CONTAINER_NAME=postgres
DB_NAME=images_db
DB_USER=postgres
BACKUP_DIR=./backups
NOW=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE=backup_${NOW}.sql

# Пароль базы
DB_PASS="postgres"

# Запуск pg_dump с передачей пароля через PGPASSWORD
docker exec -e PGPASSWORD=$DB_PASS -t $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/$BACKUP_FILE

echo "Backup saved to $BACKUP_DIR/$BACKUP_FILE"
