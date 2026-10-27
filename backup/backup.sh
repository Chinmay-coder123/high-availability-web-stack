
#!/bin/sh
set -eu

BACKUP_DIR="/backups"
BACKUP_INTERVAL=21600

mkdir -p "$BACKUP_DIR"

echo "Backup service started."

while true; do
    echo "Waiting for MySQL to become ready..."

    until mysqladmin ping \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        --silent; do
        echo "MySQL is not ready. Retrying in 5 seconds..."
        sleep 5
    done

    echo "MySQL is ready!"

    TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

    BACKUP_FILE="$BACKUP_DIR/webstack_${TIMESTAMP}.sql.gz"
    TEMP_SQL="$BACKUP_DIR/.webstack_${TIMESTAMP}.sql"
    TEMP_GZ="$BACKUP_DIR/.webstack_${TIMESTAMP}.sql.gz.tmp"

    echo "Starting database backup..."

    if MYSQL_PWD="$DB_PASSWORD" mysqldump \
        --no-tablespaces \
        -h "$DB_HOST" \
        -P "$DB_PORT" \
        -u "$DB_USER" \
        "$DB_NAME" > "$TEMP_SQL"; then

        echo "Database dump completed. Compressing..."

        if gzip -c "$TEMP_SQL" > "$TEMP_GZ" &&  # compresses zip file(-c) and tests integrity(-t)
           gzip -t "$TEMP_GZ"; then

            mv "$TEMP_GZ" "$BACKUP_FILE"
            rm -f "$TEMP_SQL"

            echo "SUCCESS: Backup created: $BACKUP_FILE"

        else
            echo "ERROR: Compression or validation failed."
            rm -f "$TEMP_SQL" "$TEMP_GZ"
        fi

    else
        echo "ERROR: Database dump failed."
        rm -f "$TEMP_SQL" "$TEMP_GZ"
    fi

    echo "Next backup attempt in 6 hours."
    sleep "$BACKUP_INTERVAL"
done
