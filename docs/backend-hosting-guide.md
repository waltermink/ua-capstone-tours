# Google Cloud Deployment Guide
### UA Capstone Tours — Django Backend

---

## Table of Contents
1. [Overview](#overview)
2. [Deployment Process](#deployment-process)
3. [Administrator Guide](#administrator-guide)
4. [Common Commands Reference](#common-commands-reference)
5. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses the following Google Cloud services:

- **Cloud Run** — hosts the Django backend as a containerized application
- **Cloud SQL (PostgreSQL 16)** — managed database with PostGIS extension
- **Cloud Build** — builds and pushes Docker images
- **Container Registry** — stores Docker images
- **Secret Manager** — (optional) secure storage for secrets

The backend is a Django REST API built with Python 3.12, served by Gunicorn, and connected to a PostgreSQL database via the Cloud SQL Proxy.

---

## Deployment Process

### Step 1 — Prerequisites

- Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- Run `gcloud auth login` and sign in with your Google account
- Set your project: `gcloud config set project campus-tour-backend`

### Step 2 — Enable Required Services

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com
```

### Step 3 — Create the Cloud SQL Instance

```bash
gcloud sql instances create ua-tour-db \
  --database-version=POSTGRES_16 \
  --tier=db-perf-optimized-N-2 \
  --region=us-central1 \
  --storage-size=20
```

Set the database password:

```bash
gcloud sql users set-password postgres --instance=ua-tour-db --password="YourPassword"
```

Connect and initialize the database (requires Cloud Shell or local `psql`):

```bash
gcloud sql connect ua-tour-db --user=postgres --quiet
```

Then inside the SQL prompt:

```sql
CREATE DATABASE ua_tour;
\c ua_tour
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### Step 4 — Configure `settings.py`

The following settings must use environment variables so they can be configured via Cloud Run without changing code:

```python
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",")
CSRF_TRUSTED_ORIGINS = [x for x in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",") if x]

DATABASES = {
    "default": {
        "ENGINE": "django.contrib.gis.db.backends.postgis",
        "NAME": os.getenv("POSTGRES_DB", "ua_tour"),
        "USER": os.getenv("POSTGRES_USER", "postgres"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

WhiteNoise must be added to `MIDDLEWARE` right after `SecurityMiddleware`:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    ...
]
```

### Step 5 — Configure the Dockerfile

The Dockerfile must use Gunicorn (not `runserver`), collect static files at build time, and run as a non-root user:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gdal-bin libgdal-dev libgeos-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

RUN python manage.py collectstatic --noinput

RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8080", "--workers", "2", "--log-level", "info"]
```

### Step 6 — Create the Environment Variables File

Create a file called `env.yaml` in the backend folder with the following contents. This avoids command-line escaping issues:

```yaml
DJANGO_DEBUG: "False"
DJANGO_ALLOWED_HOSTS: "ua-capstone-backend-845958693022.us-central1.run.app,ua-capstone-backend-ual6ehsstq-uc.a.run.app"
DJANGO_SECRET_KEY: "generated-secret-key"
DJANGO_CSRF_TRUSTED_ORIGINS: "https://ua-capstone-backend-845958693022.us-central1.run.app,https://ua-capstone-backend-ual6ehsstq-uc.a.run.app"
POSTGRES_DB: "ua_tour"
POSTGRES_USER: "postgres"
POSTGRES_PASSWORD: "database-password"
POSTGRES_HOST: "/cloudsql/campus-tour-backend:us-central1:ua-tour-db"
POSTGRES_PORT: "5432"
```

> ⚠️ **Never commit `env.yaml` to version control.** Add it to `.gitignore`.

To generate a secure secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### Step 7 — Build and Push the Docker Image

From the `backend` folder:

```bash
gcloud builds submit --tag gcr.io/campus-tour-backend/ua-capstone-backend .
```

### Step 8 — Deploy to Cloud Run

```bash
gcloud run deploy ua-capstone-backend \
  --image gcr.io/campus-tour-backend/ua-capstone-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances campus-tour-backend:us-central1:ua-tour-db \
  --env-vars-file env.yaml
```

> ⚠️ Always use `gcloud run deploy` (not `gcloud run services update`) when managing environment variables. The `update` command drops any variables you don't explicitly include.

### Step 9 — Run Migrations

Only needs to be run once, or whenever database models change:

```bash
gcloud run jobs create migrate-job \
  --image gcr.io/campus-tour-backend/ua-capstone-backend \
  --region us-central1 \
  --set-cloudsql-instances campus-tour-backend:us-central1:ua-tour-db \
  --env-vars-file env.yaml \
  --command python --args manage.py,migrate,--noinput

gcloud run jobs execute migrate-job --region us-central1
```

### Step 10 — Create Admin Superuser

Create a `createuser.py` file in the backend folder:

```python
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'YourPassword')
    print('Superuser created')
else:
    u = User.objects.get(username='admin')
    u.set_password('YourPassword')
    u.save()
    print('Password updated')
```

Rebuild the image (so the script is included), then run:

```bash
gcloud run jobs create createuser-job \
  --image gcr.io/campus-tour-backend/ua-capstone-backend \
  --region us-central1 \
  --set-cloudsql-instances campus-tour-backend:us-central1:ua-tour-db \
  --env-vars-file env.yaml \
  --command python --args "createuser.py"

gcloud run jobs execute createuser-job --region us-central1
```

---

## Administrator Guide

### Accessing the Admin Panel

The Django admin panel is available at:

```
https://ua-capstone-backend-845958693022.us-central1.run.app/admin/
```

Log in with the superuser credentials created in Step 10.

### Redeploying After Code Changes

Any time code is changed, the image must be rebuilt and redeployed:

```bash
# 1. Rebuild the image
gcloud builds submit --tag gcr.io/campus-tour-backend/ua-capstone-backend .

# 2. Redeploy
gcloud run deploy ua-capstone-backend \
  --image gcr.io/campus-tour-backend/ua-capstone-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances campus-tour-backend:us-central1:ua-tour-db \
  --env-vars-file env.yaml
```

### Running Database Migrations

Only needed when Django models change:

```bash
gcloud run jobs execute migrate-job --region us-central1
```

If the job doesn't exist yet, create it first (see Step 9).

### Updating Environment Variables

Edit `env.yaml` locally, then redeploy using the full deploy command in Step 8. Never use `gcloud run services update` to change env vars as it will drop all other variables.

### Changing the Database Password

```bash
gcloud sql users set-password postgres --instance=ua-tour-db --password="NewPassword"
```

Then update `env.yaml` with the new password and redeploy.

### Viewing Logs

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ua-capstone-backend" \
  --project=campus-tour-backend \
  --limit=50 \
  --format="value(textPayload)"
```

### Checking Current Environment Variables

```bash
gcloud run services describe ua-capstone-backend \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Checking Service Status

```bash
gcloud run services describe ua-capstone-backend --region us-central1
```

---

## Common Commands Reference

| Task | Command |
|------|---------|
| Set active project | `gcloud config set project campus-tour-backend` |
| Build and push image | `gcloud builds submit --tag gcr.io/campus-tour-backend/ua-capstone-backend .` |
| Deploy to Cloud Run | `gcloud run deploy ... --env-vars-file env.yaml` |
| Run migrations | `gcloud run jobs execute migrate-job --region us-central1` |
| View logs | `gcloud logging read "resource.type=cloud_run_revision ..."` |
| Connect to database | `gcloud sql connect ua-tour-db --user=postgres --quiet` (requires Cloud Shell) |
| List revisions | `gcloud run revisions list --service=ua-capstone-backend --region=us-central1` |

---

## Troubleshooting

### Bad Request (400)
- `ALLOWED_HOSTS` does not include the current URL. Update `env.yaml` and redeploy.
- Check current value: `gcloud run services describe ... --format="value(spec.template.spec.containers[0].env)"`

### Internal Server Error (500)
- Usually means missing environment variables (especially `DJANGO_SECRET_KEY`) or a database connection failure.
- Check logs for the specific Python traceback.

### DisallowedHost Error
- The request URL is not in `ALLOWED_HOSTS`. Add the URL to `env.yaml` and redeploy.

### CSRF / 400 on POST Requests
- The request origin is not in `CSRF_TRUSTED_ORIGINS`. Add the full `https://` URL to `env.yaml` and redeploy.

### Static Files Not Loading (Admin Page Looks Bare)
- WhiteNoise is not configured, or `collectstatic` was not run during the Docker build.
- Ensure `whitenoise.middleware.WhiteNoiseMiddleware` is in `MIDDLEWARE` and `RUN python manage.py collectstatic --noinput` is in the Dockerfile.

### Env Vars Dropped After Update
- This happens when using `gcloud run services update` instead of `gcloud run deploy`.
- Always use the full `gcloud run deploy` command with `--env-vars-file env.yaml`.

### Cloud SQL Proxy Not Found (Local)
- Use Google Cloud Shell instead of local terminal for any commands requiring the Cloud SQL Proxy.
- Cloud Shell has all required tools pre-installed.
