# Backend Overview

This project backend is a Django + Django REST Framework service backed by PostgreSQL/PostGIS.

## Tech Stack

- Django 5.x
- Django REST Framework
- PostGIS (`django.contrib.gis`)
- Pillow (image handling for landmark photos)
- `django-cors-headers`
- Docker Compose for local development

## App Structure

```text
backend/
  api/                # REST API endpoints, serializers, tests
  locations_db/       # Core geospatial models + Django admin setup
  config/             # Project settings and URL routing
```

## Runtime Architecture

1. Clients call API endpoints under `/api/`.
2. DRF generic views query `locations_db` models.
3. Serializers shape response payloads for list/detail/nearby use cases.
4. Media files (landmark photos) are served from `/media/` in development.

## URL Routing

- `/api/` -> API endpoints (`backend/api/urls.py`)
- `/admin/` -> Django admin
- `/locations_db/` -> temporary app route used for basic test response

## Configuration Highlights

- Database engine: `django.contrib.gis.db.backends.postgis`
- SRID for geospatial points: `4326`
- CORS: currently allows all origins in development (`CORS_ALLOW_ALL_ORIGINS = True`)
- DRF permission class default: `AllowAny`

## Deployment Notes

- Read the Docs builds these docs using `readthedocs.yml` + `mkdocs.yml`.
- Application deployment is currently Docker Compose oriented for development.
