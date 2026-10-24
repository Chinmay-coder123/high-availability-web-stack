
#!/bin/sh
set -eu

echo "Waiting for MySQL to become ready..."

until mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" --silent; do
    echo "MySQL is not ready yet. Retrying in 5 seconds..."
    sleep 5
done

echo "MySQL is ready!"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="/backups/webstack_${TIMESTAMP}.sql.gz"

echo "Starting database backup..."

MYSQL_PWD="$DB_PASSWORD" mysqldump \
    --no-tablespaces \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file is empty!"
    exit 1
fi