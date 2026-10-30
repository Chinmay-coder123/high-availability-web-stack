# High-Availability Multi-Tier Web Stack with Automated Backup Bot

A containerized, multi-tier web application built using React, FastAPI, MySQL, Nginx, and Docker Compose, with automated database backups and a GitHub Actions CI/CD pipeline for deployment to AWS EC2.

The project demonstrates container orchestration, reverse proxying, load balancing, persistent storage, database backup and restoration, automated testing, and cloud deployment.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Services and Components](#services-and-components)
- [Networking and Request Flow](#networking-and-request-flow)
- [Database Persistence](#database-persistence)
- [Automated Database Backups](#automated-database-backups)
- [Automated Testing](#automated-testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Prerequisites](#prerequisites)
- [Run the Project Locally](#run-the-project-locally)
- [Access the Application](#access-the-application)
- [API Health Checks](#api-health-checks)
- [Useful Docker Commands](#useful-docker-commands)
- [Security Considerations](#security-considerations)
- [Future Improvements](#future-improvements)
- [Learning Outcomes](#learning-outcomes)
- [Author](#author)

## Overview

This project implements a containerized, multi-tier web application designed to demonstrate practical Cloud and DevOps engineering concepts.

The application consists of a React-based frontend dashboard, an Nginx reverse proxy and load balancer, two FastAPI backend instances, a MySQL database, and a dedicated backup service.

Docker Compose orchestrates the services and connects them through separate frontend and backend networks. Named Docker volumes provide persistent database storage and backup storage.

A GitHub Actions workflow automates Docker image building, Docker Compose configuration validation, backend testing, and deployment to an AWS EC2 instance after the required checks pass.

The goal is to demonstrate how an application can be developed, tested, containerized, deployed, and maintained using a practical DevOps workflow.

## Key Features

- **Multi-tier architecture:** Separates the frontend, application, and database layers.
- **Containerization:** Packages application components into Docker containers.
- **Load balancing:** Uses Nginx to distribute incoming API requests between two FastAPI instances.
- **Frontend dashboard:** Provides a React-based interface for interacting with the application.
- **Database integration:** Connects both backend instances to a shared MySQL database.
- **Persistent storage:** Uses named Docker volumes to preserve database records across container restarts.
- **Automated backups:** Runs a dedicated backup service that periodically backs up the MySQL database.
- **Backup restoration testing:** Includes supporting services for testing database backup restoration.
- **Automated API testing:** Uses pytest to validate backend functionality.
- **CI/CD automation:** Uses GitHub Actions to build, validate, test, and deploy application changes.
- **Cloud deployment:** Runs the containerized application on an AWS EC2 instance.
- **Network isolation:** Separates frontend-facing services from the database network.

## Architecture

```text
                         Developer
                             |
                             | Git push
                             v
                     GitHub Repository
                             |
                             v
                     GitHub Actions
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
           Build & Validate        Automated Tests
                 |                       |
                 +-----------+-----------+
                             |
                     Checks successful
                             |
                             v
                       SSH Deployment
                             |
                             v
                       AWS EC2 Server
                             |
                             v
                    Docker Compose Stack
                             |
                   HTTP :8081 on EC2
                             |
                             v
                         Nginx
                    Reverse Proxy /
                    Load Balancer
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
            React Frontend          FastAPI Backend
                                    /            \
                                   v              v
                                App 1            App 2
                                   \              /
                                    \            /
                                     v          v
                                       MySQL
                                         |
                                         v
                                   mysql_data

                         Backup Service
                               |
                               v
                         MySQL Database
                               |
                               v
                          backup_data
```

The architecture uses two Docker networks:

- `frontend-net`: Connects Nginx, the frontend, and the backend application instances.
- `backend-net`: Connects the backend instances, MySQL database, and backup service.

This arrangement separates the database-facing network from the frontend-facing network.

The database does not need to publish its MySQL port directly to the host for the application to access it. Backend containers communicate with it over Docker's internal networking.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend dashboard |
| Vite | Frontend development and build tooling |
| Python | Backend programming language |
| FastAPI | REST API development |
| Uvicorn | ASGI server for running FastAPI |
| MySQL 8.4 | Relational database |
| Nginx | Reverse proxy and load balancer |
| Docker | Application containerization |
| Docker Compose | Multi-container orchestration |
| Bash and cron | Automated database backup scheduling |
| pytest | Automated backend testing |
| httpx | HTTP testing support |
| Git and GitHub | Version control and source-code hosting |
| GitHub Actions | CI/CD automation |
| AWS EC2 | Cloud hosting |

## Project Structure

The main project structure is organized as follows:

```text
high-availability-web-stack/
│
├── app/
│   ├── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── tests/
│       └── ...
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
│
├── nginx/
│   └── nginx.conf
│
├── backup/
│   ├── Dockerfile
│   ├── backup.sh
│   └── ...
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

The structure above illustrates the main components. Individual filenames may differ depending on the final implementation.

### Component responsibilities

- `app/`: Contains the FastAPI application, its Dockerfile, dependencies, and backend tests.
- `frontend/`: Contains the React dashboard and frontend build configuration.
- `nginx/`: Contains the Nginx reverse proxy and load-balancing configuration.
- `backup/`: Contains the backup container configuration and backup script.
- `.github/workflows/ci.yml`: Defines the GitHub Actions CI/CD pipeline.
- `docker-compose.yml`: Defines application services, networks, volumes, and service configuration.
- `README.md`: Documents the project architecture, setup, and operation.

## Services and Components

### 1. React Frontend

The frontend provides a dashboard for interacting with the application.

It is built from the `frontend/` directory and runs as a Docker container.

Nginx exposes the application through the host port mapping:

```yaml
ports:
  - "8081:80"
```

The application is accessed through the EC2 public IPv4 address and port `8081`, subject to the EC2 security-group rules.

### 2. Nginx Reverse Proxy and Load Balancer

Nginx acts as the entry point for incoming HTTP traffic.

Its responsibilities include:

- Receiving incoming requests.
- Routing requests to the appropriate application component.
- Distributing backend API requests between two FastAPI instances.
- Providing a single access point for the application.

The backend upstream is configured using the service names `app1` and `app2`.

Conceptually, the upstream configuration is:

```nginx
upstream backend {
    server app1:8000;
    server app2:8000;
}
```

The actual routing behavior is defined in `nginx/nginx.conf`.

With the standard round-robin upstream configuration, Nginx distributes requests across the available backend servers in turn.

**Important:** Running two backend instances provides redundancy at the application-process level, but it does not make the entire system highly available. Both instances currently depend on the same EC2 host and database.

### 3. FastAPI Backend Instances

The project runs two backend services:

- `app1`
- `app2`

Both are built from the same `app/` directory and use the same application code.

The `INSTANCE_NAME` environment variable distinguishes the instances:

```yaml
app1:
  environment:
    INSTANCE_NAME: app-1

app2:
  environment:
    INSTANCE_NAME: app-2
```

The backend instances provide API functionality and communicate with MySQL through the Docker backend network.

Both instances connect to the database using the service hostname:

```text
db:3306
```

Docker's internal DNS resolves the service name `db` to the database container.

Each backend instance runs independently, while application data is stored in the shared database rather than in the individual application containers.

### 4. MySQL Database

The project uses MySQL 8.4 as its relational database.

The database is configured with:

- Database name: `webstack`
- Application database user: `webuser`
- Internal service hostname: `db`
- Internal port: `3306`

The database stores application records and is shared by both FastAPI instances.

The database uses a named volume:

```yaml
volumes:
  - mysql_data:/var/lib/mysql
```

This separates persistent database files from the lifecycle of the database container.

The production database is not published directly to the host in the Compose configuration.

### 5. Automated Backup Service

The dedicated `backup` service is built from the `backup/` directory.

It connects to MySQL over `backend-net` and uses the database credentials supplied through environment variables.

The service uses a named volume:

```yaml
volumes:
  - backup_data:/backups
```

This volume stores generated backup files and allows the backup data to persist independently of the backup container.

The application containers also mount the backup volume read-only:

```yaml
volumes:
  - backup_data:/backups:ro
```

This allows the application containers to access backup files without being able to modify them through that mount.

The backup service is configured to run periodically, with the backup schedule set to every six hours.

The backup script and its scheduler are responsible for generating the backup files.

### 6. Supporting Test Services

The Compose configuration includes additional services for testing:

| Service | Purpose |
|---|---|
| `db-test` | Provides a MySQL environment for backup-restoration testing |
| `api-test-db` | Provides a separate database for API tests |
| `app-test` | Provides a backend container for testing against the API test database |

These services are separate from the main application path.

They should only be started when required for the relevant testing or restoration workflow.

The GitHub Actions test job also provisions its own temporary MySQL service, so the main production database is not required for the automated test suite.

## Networking and Request Flow

Docker Compose defines two bridge networks.

### Frontend Network

```yaml
frontend-net:
  driver: bridge
```

This network connects:

- Nginx
- React frontend
- FastAPI instance `app1`
- FastAPI instance `app2`

Nginx can resolve the backend service names using Docker's internal DNS.

### Backend Network

```yaml
backend-net:
  driver: bridge
```

This network connects:

- FastAPI instance `app1`
- FastAPI instance `app2`
- MySQL database
- Backup service
- Supporting test services

The application instances connect to both networks, allowing them to receive requests through the frontend-facing layer and communicate with MySQL through the backend layer.

### Request flow

The general API request flow is:

1. A client sends an HTTP request to the application.
2. The request reaches Nginx.
3. Nginx forwards the request according to its configured routing rules.
4. The request is handled by one of the FastAPI instances.
5. The backend communicates with MySQL if the operation requires database access.
6. The backend returns a response through Nginx to the client.

## Database Persistence

One of the key goals of this project is to preserve database records when containers are restarted or recreated.

The production database uses the named volume:

```yaml
volumes:
  mysql_data:
```

The database service mounts this volume at:

```text
/var/lib/mysql
```

This is where MySQL stores its database files.

### Why use a named volume?

Without persistent storage, deleting a database container can also remove its writable container layer, including database files stored there.

With a named volume, the database files are stored separately from the container.

This means ordinary container restarts and container recreation can preserve the data when the same volume is reused.

### Persistence verification

The persistence test involves:

1. Adding a record to the database.
2. Restarting the database container.
3. Waiting for MySQL to become ready.
4. Retrieving the record again through the application or database.
5. Confirming that the record remains available.

The project has been tested to verify that database records persist after restarting the database container.

**Note:** Named volumes are persistent storage, not a substitute for independent backups. Volume deletion, host failure, filesystem corruption, or other failures can still result in data loss.

## Automated Database Backups

The backup service periodically creates database backups.

The backup schedule is configured for an interval of six hours.

### Backup workflow

The general workflow is:

1. The backup scheduler triggers the backup script.
2. The script connects to MySQL.
3. The database is exported using the configured database backup utility.
4. The resulting backup is compressed if configured by the script.
5. The backup file is written to `/backups`.
6. The file persists in the `backup_data` named volume.

The backup service uses the same internal database hostname as the backend application:

```text
db
```

This avoids hardcoding the database container's IP address.

### Backup storage

The named volume is declared as:

```yaml
volumes:
  backup_data:
```

The backup files are stored in the volume rather than only in the backup container's writable layer.

This allows backup files to remain available when the backup container is recreated, provided the volume is retained.

### Backup restoration

The project includes a supporting `db-test` service intended for testing restoration using the backup files.

A typical restoration verification process involves:

1. Identifying an existing backup file.
2. Starting the isolated restoration-test database.
3. Restoring the backup into the test database.
4. Querying the restored tables and records.
5. Confirming that the expected data is present.

Restoration tests should use an isolated test database, not the production database.

**Operational note:** The actual backup filename, compression format, retention policy, and restoration commands are determined by the implementation in `backup/backup.sh`. These should be documented alongside the script. A successful backup job alone does not prove that a backup can be restored; periodic restoration testing is essential.

## Automated Testing

The backend uses pytest for automated testing.

The test suite covers backend functionality and is executed as part of the GitHub Actions workflow.

The test environment uses a separate MySQL 8.4 service.

### Test environment

The test job:

1. Starts a temporary MySQL service.
2. Configures the test database connection using environment variables.
3. Waits for the database to become available.
4. Creates the required `items` table if it does not already exist.
5. Installs the Python dependencies.
6. Executes the pytest test suite.

The test database is isolated from the production database running on EC2.

### Running tests locally

From the project root, activate your Python environment if needed, then run:

```bash
pip install -r app/requirements.txt
```

Navigate to the backend directory:

```bash
cd app
```

Run the tests:

```bash
python -m pytest -v
```

The tests require the appropriate database environment variables and a reachable test database.

For an exact reproduction of the CI environment, use the same environment-variable configuration and test database setup as the GitHub Actions workflow.

## CI/CD Pipeline

The project uses GitHub Actions to automate building, validation, testing, and deployment.

The workflow is defined in:

```text
.github/workflows/ci.yml
```

The workflow is triggered by pushes and pull requests targeting `main`.

### Pipeline overview

```text
Developer changes code
         |
         v
     Git push
         |
         v
  GitHub Actions starts
         |
         +-----------------------+
         |                       |
         v                       v
   Build and Validate      Automated Tests
         |                       |
         v                       v
  Build FastAPI image      Run pytest suite
  Validate Compose         Against test MySQL
         |                       |
         +-----------+-----------+
                     |
             Both jobs pass?
                     |
                     v
             Push to main?
                     |
                     v
              SSH connection
                     |
                     v
            Update code on EC2
                     |
                     v
          Rebuild application images
                     |
                     v
         Update application services
                     |
                     v
             Check service status
```

### Job 1: Build and Validate

The `build-app` job:

- Checks out the repository.
- Builds the FastAPI Docker image.
- Validates the Docker Compose configuration.

The image build checks whether the backend can be packaged into a Docker image.

The Compose validation checks the Compose configuration for parsing and configuration errors.

### Job 2: Automated Tests

The `test-app` job:

- Starts a temporary MySQL service.
- Sets up Python.
- Installs backend dependencies.
- Creates the test database table.
- Runs pytest.

The tests must pass for the deployment job to proceed.

### Job 3: Deploy to AWS EC2

The `deploy` job depends on both the build and test jobs.

It runs only for a push to the `main` branch, rather than for a pull request.

The deployment process:

1. Configures SSH using GitHub Actions secrets.
2. Connects to the EC2 instance.
3. Fetches the latest `main` branch.
4. Updates the server's project working directory.
5. Rebuilds the `app1`, `app2`, `frontend`, and `backup` images.
6. Updates the selected application services.
7. Restarts Nginx.
8. Displays the Compose service status.

The deployment explicitly excludes the production `db` service from the update commands.

It does not intentionally remove the production database volume.

### GitHub Actions secrets

The deployment requires these repository secrets:

| Secret | Purpose |
|---|---|
| `EC2_SSH_PRIVATE_KEY` | Private SSH key used to authenticate to EC2 |
| `EC2_HOST` | Public IPv4 address of the EC2 instance |
| `EC2_USER` | SSH username, typically `ubuntu` for the configured Ubuntu instance |

Secrets are configured in the repository's GitHub Actions settings.

Private keys and passwords should not be committed to the repository.

### Deployment verification

After a successful workflow run:

1. Open the repository's **Actions** tab.
2. Open the latest workflow run.
3. Confirm that the build, test, and deployment jobs succeeded.
4. Open the deployed application in a browser.
5. Check the backend health endpoints.
6. Inspect the running Docker Compose services on EC2.

A successful workflow run should be followed by application-level verification.

## AWS EC2 Deployment

The application is hosted on an AWS EC2 instance running Ubuntu.

Docker Compose manages the application services on the instance.

The application is exposed through Nginx using the host port mapping:

```yaml
ports:
  - "8081:80"
```

The application is therefore accessed using:

```text
http://<EC2-PUBLIC-IP>:8081
```

Replace `<EC2-PUBLIC-IP>` with the instance's current public IPv4 address.

### Deployment architecture

```text
GitHub Repository
        |
        v
GitHub Actions
        |
        | SSH
        v
AWS EC2 (Ubuntu)
        |
        v
Docker Compose
        |
        +-- Nginx
        +-- React Frontend
        +-- FastAPI App 1
        +-- FastAPI App 2
        +-- MySQL
        +-- Backup Service
```

### Useful commands on EC2

Check the Compose service status:

```bash
sudo docker compose ps
```

View recent logs:

```bash
sudo docker compose logs --tail=100
```

View Nginx logs:

```bash
sudo docker compose logs --tail=100 nginx
```

View backend logs:

```bash
sudo docker compose logs --tail=100 app1 app2
```

Check the API health endpoint:

```bash
curl -s http://localhost:8081/health
```

Check database connectivity through the application:

```bash
curl -s http://localhost:8081/db-health
```

These commands assume that the current working directory on EC2 is the project directory.

## Prerequisites

To run the project locally, install:

- Git
- Docker Engine or Docker Desktop
- Docker Compose v2
- A working internet connection to pull the required images and dependencies

To use the deployment workflow, you also need:

- A GitHub repository containing the project.
- An AWS EC2 instance running Ubuntu.
- Docker Engine and Docker Compose on EC2.
- SSH access to the EC2 instance.
- GitHub Actions secrets configured for deployment.
- Appropriate EC2 security-group rules.

## Run the Project Locally

### 1. Clone the repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
```

Enter the project directory:

```bash
cd high-availability-web-stack
```

Replace the placeholder URL with the repository's actual clone URL.

### 2. Review configuration

Review the Compose file:

```text
docker-compose.yml
```

Check the application environment variables, database credentials, Nginx configuration, backup schedule, and volume definitions.

For a safer configuration, store credentials in an untracked `.env` file or use an appropriate secrets-management mechanism.

### 3. Build and start the application

Run:

```bash
docker compose up -d --build
```

This builds the services that have local build contexts and starts the configured Compose services.

**Note:** The Compose file includes supporting test services. Starting the entire Compose project can also start those services. For a normal application run, you can explicitly select the production application services instead.

### 4. Check service status

```bash
docker compose ps
```

### 5. View logs

```bash
docker compose logs -f
```

Press `Ctrl+C` to stop following the logs. This does not, by itself, stop the containers.

### 6. Stop the services

```bash
docker compose down
```

This stops and removes the Compose containers and networks while normally retaining named volumes.

**Do not add `-v` when shutting down the application if you need to preserve the database records and backups.**

## Access the Application

Once the services are running, access the application using the configured host port.

For a local deployment:

```text
http://localhost:8081
```

For the EC2 deployment:

```text
http://<EC2-PUBLIC-IP>:8081
```

The port must be permitted by the host firewall and, on EC2, the applicable security-group rules.

## API Health Checks

The backend provides health-check endpoints.

### Application health

```http
GET /health
```

This endpoint checks application health.

Test it locally:

```bash
curl -s http://localhost:8081/health
```

### Database health

```http
GET /db-health
```

This endpoint checks database connectivity through the application.

Test it locally:

```bash
curl -s http://localhost:8081/db-health
```

These endpoints are useful for manually checking the application after a deployment.

Their exact response formats are defined in `app/main.py`.

## Useful Docker Commands

### List running containers

```bash
docker ps
```

### List all containers

```bash
docker ps -a
```

### List images

```bash
docker images
```

### View service status

```bash
docker compose ps
```

### Follow application logs

```bash
docker compose logs -f app1 app2
```

### View Nginx logs

```bash
docker compose logs -f nginx
```

### Restart an individual service

```bash
docker compose restart app1
```

### Rebuild an application service

```bash
docker compose build app1
```

### Update application services

```bash
docker compose up -d --no-deps app1 app2 frontend nginx backup
```

This command assumes the relevant images have already been built and the Compose configuration is correct.

### Inspect named volumes

```bash
docker volume ls
```

Inspect the production database volume:

```bash
docker volume inspect high-availability-web-stack_mysql_data
```

The exact volume name depends on the Compose project name.

Inspect the backup volume:

```bash
docker volume inspect high-availability-web-stack_backup_data
```

### Important warning

Avoid running the following command when you need to retain database records or backup files:

```bash
docker compose down -v
```

The `-v` option can remove named volumes declared by the Compose project.

## Security Considerations

This project is intended as a learning and portfolio project. Before using a similar design for production workloads, address the following considerations.

### Credentials

- Do not commit real database passwords, private keys, or other secrets.
- Use environment variables, untracked configuration files, or a secrets manager.
- Rotate credentials if they have been exposed in a public repository or logs.
- Avoid using the MySQL root account for normal application access.

### AWS Security Groups

- Restrict SSH access on port `22` to trusted IP addresses.
- Restrict application access on port `8081` to the intended clients.
- Do not expose MySQL port `3306` publicly.
- Review the instance's inbound and outbound rules regularly.

### SSH Host Verification

The deployment workflow should verify the EC2 SSH host key through a trusted channel and pin the verified key.

Using `ssh-keyscan` alone retrieves a key but does not independently verify the server's identity.

### Database and Backups

- Keep production database files in persistent storage.
- Maintain backups independently of the database container.
- Test restoration periodically.
- Consider storing a protected copy of important backups outside the EC2 instance.
- Define a backup-retention policy to avoid unlimited disk growth.

### Deployment Reliability

The current deployment rebuilds application images on EC2. This is simple for a learning project, but it consumes CPU, memory, and disk space.

For a more robust design, build images in CI, publish versioned images to Amazon ECR, and deploy those images to EC2.

The current design also does not provide an automatic rollback or guarantee zero downtime.

## Future Improvements

Possible extensions include:

- **Prometheus and Grafana:** Add metrics collection and monitoring dashboards.
- **Amazon ECR:** Store versioned Docker images in a container registry.
- **AWS Systems Manager:** Explore secure instance management without relying exclusively on SSH.
- **HTTPS:** Configure TLS certificates and secure external traffic.
- **Secrets management:** Use AWS Secrets Manager or another appropriate secrets-management system.
- **Deployment health gates:** Verify API health endpoints after each deployment.
- **Automatic rollback:** Restore a previous application version when deployment verification fails.
- **Backup retention:** Automatically delete backups older than a configured retention period.
- **Off-instance backups:** Store protected copies in Amazon S3.
- **Infrastructure as Code:** Use Terraform to provision AWS resources reproducibly.
- **Resource monitoring:** Track container CPU, memory, and disk usage.
- **High availability:** Distribute services across multiple hosts or availability zones and address database availability separately.

These are potential extensions rather than requirements for the current implementation.

## Learning Outcomes

This project provided practical experience with:

- Building and running Docker containers.
- Writing Dockerfiles for Python and frontend applications.
- Orchestrating multi-container applications using Docker Compose.
- Configuring Nginx as a reverse proxy and load balancer.
- Connecting application services to a MySQL database.
- Using Docker bridge networks for service communication.
- Managing persistent data using named volumes.
- Automating database backups and testing restoration.
- Writing and executing backend tests using pytest.
- Validating Docker Compose configuration in CI.
- Building a CI/CD workflow using GitHub Actions.
- Deploying application changes to AWS EC2 over SSH.
- Troubleshooting containers and inspecting application logs.
- Separating application, database, and backup responsibilities.

## Author

**Chinmay Haldulkar**

Computer Science and Engineering

GitHub: [Chinmay-coder123](https://github.com/Chinmay-coder123)

---

*This project was developed as a hands-on learning project to explore containerization, cloud deployment, and DevOps automation.*
