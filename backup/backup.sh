
#!/bin/sh
set -eu

BACKUP_DIR="/backups"
BACKUP_INTERVAL=21600
METADATA_FILE="$BACKUP_DIR/backup_metadata.json"
TEMP_META="$BACKUP_DIR/.backup_metadata.json.tmp"

mkdir -p "$BACKUP_DIR"

# Initialize metadata from existing backups if metadata file does not exist
if [ ! -f "$METADATA_FILE" ]; then
    PREV_FILE=$(ls -1t "$BACKUP_DIR"/webstack_*.sql.gz 2>/dev/null | head -n 1 || true)
    if [ -n "$PREV_FILE" ] && [ -f "$PREV_FILE" ]; then
        PREV_NAME=$(basename "$PREV_FILE")
        PREV_TIME=$(echo "$PREV_NAME" | sed -e 's/webstack_//' -e 's/\.sql\.gz//')
        cat <<EOF > "$TEMP_META"
{
  "latest_operation_status": "success",
  "latest_operation_timestamp": "$PREV_TIME",
  "latest_successful_backup_file": "$PREV_NAME",
  "latest_successful_backup_timestamp": "$PREV_TIME",
  "backup_interval_seconds": $BACKUP_INTERVAL
}
EOF
        mv "$TEMP_META" "$METADATA_FILE"
    fi
fi

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

            cat <<EOF > "$TEMP_META"
{
  "latest_operation_status": "success",
  "latest_operation_timestamp": "$TIMESTAMP",
  "latest_successful_backup_file": "$(basename "$BACKUP_FILE")",
  "latest_successful_backup_timestamp": "$TIMESTAMP",
  "backup_interval_seconds": $BACKUP_INTERVAL
}
EOF
            mv "$TEMP_META" "$METADATA_FILE"

        else
            echo "ERROR: Compression or validation failed."
            rm -f "$TEMP_SQL" "$TEMP_GZ"

            PREV_FILE=$(ls -1t "$BACKUP_DIR"/webstack_*.sql.gz 2>/dev/null | head -n 1 || true)
            PREV_NAME=""
            PREV_TIME=""
            if [ -n "$PREV_FILE" ] && [ -f "$PREV_FILE" ]; then
                PREV_NAME=$(basename "$PREV_FILE")
                PREV_TIME=$(echo "$PREV_NAME" | sed -e 's/webstack_//' -e 's/\.sql\.gz//')
            fi

            cat <<EOF > "$TEMP_META"
{
  "latest_operation_status": "failure",
  "latest_operation_timestamp": "$TIMESTAMP",
  "latest_successful_backup_file": "$PREV_NAME",
  "latest_successful_backup_timestamp": "$PREV_TIME",
  "backup_interval_seconds": $BACKUP_INTERVAL
}
EOF
            mv "$TEMP_META" "$METADATA_FILE"
        fi

    else
        echo "ERROR: Database dump failed."
        rm -f "$TEMP_SQL" "$TEMP_GZ"

        PREV_FILE=$(ls -1t "$BACKUP_DIR"/webstack_*.sql.gz 2>/dev/null | head -n 1 || true)
        PREV_NAME=""
        PREV_TIME=""
        if [ -n "$PREV_FILE" ] && [ -f "$PREV_FILE" ]; then
            PREV_NAME=$(basename "$PREV_FILE")
            PREV_TIME=$(echo "$PREV_NAME" | sed -e 's/webstack_//' -e 's/\.sql\.gz//')
        fi

        cat <<EOF > "$TEMP_META"
{
  "latest_operation_status": "failure",
  "latest_operation_timestamp": "$TIMESTAMP",
  "latest_successful_backup_file": "$PREV_NAME",
  "latest_successful_backup_timestamp": "$PREV_TIME",
  "backup_interval_seconds": $BACKUP_INTERVAL
}
EOF
        mv "$TEMP_META" "$METADATA_FILE"
    fi

    echo "Next backup attempt in 6 hours."
    sleep "$BACKUP_INTERVAL"
done
