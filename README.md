# High-Availability Web Stack with Automated Backup

## Project Overview

This project explores containerized application deployment using Docker, FastAPI, Nginx, and PostgreSQL.

## Current Progress

- Built a minimal FastAPI application with home and health-check endpoints.
- Created a Dockerfile to package the application and its dependencies.
- Built a Docker image for the application.
- Ran two independently configured containers from the same image.
- Verified that each instance responds with its own instance name.

## Planned Features

- Nginx reverse proxy and load balancing.
- PostgreSQL database integration.
- Automated database backups.
- Database restoration testing.
- Optional deployment to AWS EC2.
