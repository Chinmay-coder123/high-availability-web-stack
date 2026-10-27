# High-Availability Multi-Tier Web Stack with Automated Backup Bot

A containerized multi-tier web application built using **FastAPI, MySQL, Nginx, and Docker Compose**. The project demonstrates reverse proxying, load balancing, container networking, persistent database storage, and database backup automation.

> **Project status:** Core application and database integration are working. The backup container has successfully exported and compressed the database. Automated backup scheduling, disaster-recovery testing, and CI/CD are planned next.

## Architecture

```text
                     Client
                       |
                       v
                 Nginx Reverse Proxy
                    Port 8081
                       |
                 Load Balancing
                  /          \
                 v            v
          FastAPI App 1    FastAPI App 2
                  \          /
                   \        /
                    v      v
                   MySQL Database
                      webstack
                         |
              +----------+----------+
              |                     |
              v                     v
       Persistent Volume       Backup Container
         mysql_data              mysqldump
                                     |
                                     v
                               gzip compression
                                     |
                                     v
                              backup_data volume
```

The application containers and Nginx communicate over the frontend network. The application containers and database communicate over the backend network. The backup container also connects to the database through the backend network.

**Note:** Nginx and MySQL currently run as single instances, so they remain potential single points of failure.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Application programming language |
| FastAPI | REST API framework |
| MySQL 8.4 | Relational database |
| Nginx | Reverse proxy and load balancing |
| Docker | Application and service containerization |
| Docker Compose | Multi-container orchestration |
| Alpine Linux / MySQL client tools | Initially used for backup-container development; the backup image now uses MySQL 8.4 |
| `mysqldump` | Database export |
| `gzip` | Backup compression |
| Docker volumes | Persistent storage |
| Git and GitHub | Version control and source-code hosting |

## Features Implemented

### 1. FastAPI Application

The application provides REST endpoints for application health, database connectivity, and item management.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Returns a welcome message and application instance name |
| `/health` | GET | Checks application health |
| `/db-health` | GET | Checks database connectivity |
| `/items` | GET | Retrieves stored items |
| `/items` | POST | Creates a new item |

The application identifies each instance using the `INSTANCE_NAME` environment variable.

### 2. MySQL Integration

The application connects to MySQL using environment variables for the database host, port, name, username, and password.

The `webstack` database contains an `items` table:

```sql
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);
```

The application supports inserting and retrieving records through its REST API.

### 3. Nginx Reverse Proxy and Load Balancing

Nginx acts as the entry point for incoming application requests and distributes them between two FastAPI instances.

```text
Client
  |
  v
Nginx :80
  |
  +------> app1:8000
  |
  +------> app2:8000
```

The application is exposed on host port `8081`.

- **Application URL:** `http://localhost:8081`
- **Interactive API documentation:** `http://localhost:8081/docs`

The Nginx upstream configuration uses Docker Compose service names to locate the application containers.

### 4. Docker Networking

Two bridge networks separate frontend traffic from backend database traffic.

| Network | Connected services | Purpose |
|---|---|---|
| `frontend-net` | Nginx, app1, app2 | Routes application traffic |
| `backend-net` | app1, app2, db, backup | Provides database and backup connectivity |

The database is accessed by its Compose service name, `db`, on its internal port `3306`.

### 5. Persistent Database Storage

The MySQL service uses the named Docker volume `mysql_data` to store database files.

This allows database data to persist across normal container recreation.

### 6. Containerized Database Backup

A dedicated backup service is defined in Docker Compose.

The backup container:

1. Waits for MySQL to become available.
2. Uses `mysqldump` to export the `webstack` database.
3. Compresses the exported SQL using `gzip`.
4. Creates a timestamped `.sql.gz` file.
5. Stores backup files in the persistent `backup_data` volume.

Example backup filename:

```text
webstack_2026-10-24_17-44-46.sql.gz
```

The backup file was inspected, and the exported SQL contained the `items` table definition and example records.

**Current limitation:** Backups have been triggered manually for testing. Periodic scheduling and stronger failure detection still need to be implemented.

## Project Structure

```text
high-availability-web-stack/
├── app/
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── nginx/
│   └── nginx.conf
├── backup/
│   ├── Dockerfile
│   └── backup.sh
├── docker-compose.yml
├── .gitignore
└── README.md
```

*The structure above represents the intended layout; adjust it if your actual files differ.*

## Prerequisites

Install the following tools:

- Docker Engine or Docker Desktop
- Docker Compose
- Git
- VS Code (recommended)

The commands below use `sudo docker compose`, suitable for a Linux environment where Docker requires elevated permissions. On Docker Desktop, you may be able to omit `sudo`.

## Running the Project

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd high-availability-web-stack
```

Replace `<your-repository-url>` with your GitHub repository URL.

### 2. Start the application

```bash
sudo docker compose up -d --build
```

This builds and starts the application services defined in `docker-compose.yml`.

### 3. Check running containers

```bash
sudo docker compose ps
```

### 4. View application logs

```bash
sudo docker compose logs -f
```

Press `Ctrl+C` to stop following the logs.

### 5. Open the application

Visit:

```text
http://localhost:8081
```

Open the interactive API documentation at:

```text
http://localhost:8081/docs
```

### 6. Test database connectivity

Open:

```text
http://localhost:8081/db-health
```

A successful response should indicate that the database is connected.

### 7. Stop the services

```bash
sudo docker compose down
```

The named volumes are retained by this command. Avoid `docker compose down -v` when you want to preserve database data and backup files.

## Running a Manual Backup

Start the database services if they are not already running:

```bash
sudo docker compose up -d db
```

Build the backup image:

```bash
sudo docker compose build backup
```

Run a backup:

```bash
sudo docker compose run --rm backup
```

The backup container waits for MySQL, exports the database, and writes a compressed file to `/backups`, which is backed by the `backup_data` volume.

To list the stored backups:

```bash
sudo docker compose run --rm --entrypoint sh backup -c "ls -lh /backups"
```

To check the gzip integrity of a backup, replace the filename with an actual backup file:

```bash
sudo docker compose run --rm --entrypoint sh backup -c "gzip -t /backups/<backup-filename>.sql.gz"
```

A successful gzip check verifies compression integrity, but does not by itself guarantee that the SQL can be restored successfully.

## Current Limitations

- Backup creation is currently triggered manually rather than on a recurring schedule.
- Backup failure detection needs further improvement and testing.
- Database restoration has not yet been tested end to end.
- High-availability behavior when an application replica fails still needs explicit testing.
- Nginx and MySQL are single instances.
- CI/CD has not yet been implemented.
- Cloud deployment has not yet been implemented.

## Planned Improvements

### Phase 1: Reliable Backups

- Improve backup failure detection.
- Validate backup files before reporting success.
- Configure periodic backups.
- Add a backup retention policy.

### Phase 2: Disaster Recovery

- Restore a backup into a controlled test database.
- Verify the restored schema and records.
- Document the recovery procedure.

### Phase 3: High Availability Testing

- Verify that requests reach both FastAPI instances.
- Stop one application instance and check whether requests continue through the other.
- Test service recovery and database connectivity.

### Phase 4: CI/CD

- Write automated application tests.
- Configure GitHub Actions to run tests on pushes and pull requests.
- Build the Docker image automatically.
- Publish versioned images to a container registry.

### Phase 5: Cloud Deployment

- Deploy the application to AWS EC2.
- Configure deployment and environment-specific settings.
- Review credentials, network exposure, and operational security.

## Learning Outcomes

This project provides practical experience with:

- Docker image creation and container lifecycle management.
- Multi-container application orchestration.
- Docker bridge networks and service-name-based communication.
- REST API development using FastAPI.
- Relational database integration.
- Nginx reverse proxying and load balancing.
- Persistent volumes.
- Database export and compression.
- Backup architecture and disaster-recovery planning.
- Git-based development workflows.

## Security Notes

- Do not commit real passwords, API keys, or other secrets.
- Store development credentials in an environment file excluded from Git.
- Use appropriate secrets management for production deployments.
- Do not expose the MySQL port publicly unless there is a specific, secured requirement.
- Restrict access to backup files because they may contain sensitive application data.
- Test restoration before relying on backups for recovery.

## Author

**Developed as a hands-on Cloud and DevOps learning project.**

The project is being built incrementally, with local Docker Compose deployment first and CI/CD and cloud deployment planned for later stages.
