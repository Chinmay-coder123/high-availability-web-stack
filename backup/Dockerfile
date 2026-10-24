FROM mysql:8.4

WORKDIR /backup

COPY backup.sh /backup/backup.sh

RUN chmod +x /backup/backup.sh

CMD ["/bin/sh", "/backup/backup.sh"]