# Development Guide

This guide covers local backend setup, migrations, testing, and documentation workflow.

## Prerequisites

- Docker Desktop
- Git

## Environment File

Create local environment variables from the sample file:

```bash
cp .env.example .env
```

Primary variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_PORT`

## Start the Stack

From repository root:

```bash
docker compose up -d --build
```

Run migrations:

```bash
docker compose exec web python manage.py migrate
```

Create an admin user:

```bash
docker compose exec web python manage.py createsuperuser
```

Useful URLs:

- App: `http://localhost:8000`
- Admin: `http://localhost:8000/admin`

## Common Backend Commands

Run Django shell:

```bash
docker compose exec web python manage.py shell
```

Create migrations after model changes:

```bash
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate
```

Run tests:

```bash
docker compose exec web python manage.py test api
```

View service logs:

```bash
docker compose logs web --tail=100
```

## Media Files

- Uploaded landmark photos are saved under `backend/media/`.
- Development server serves these through `/media/` when `DEBUG=True`.
- Docker mounts `./backend/media:/app/media` for local persistence.

## Docs Workflow (Read the Docs + MkDocs)

- Read the Docs config is in `readthedocs.yml`.
- Site navigation and docs config are in `mkdocs.yml`.
- All docs source files live under `docs/`.

When adding a new documentation page:

1. Create a Markdown file in `docs/`.
2. Add it to the `nav` section in `mkdocs.yml`.
3. Push changes; Read the Docs rebuilds from repository configuration.
