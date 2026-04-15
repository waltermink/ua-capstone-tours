# UA Capstone Tours

A CS 495 Capstone project to build a **mobile-first interactive walking tour** of the University of Alabama campus. Users explore geotagged campus landmarks on a live map, see their real-time GPS location, and receive proximity alerts that automatically surface information when they walk near a point of interest.

You can read the full documentation for this project at [capstone-tours.readthedocs.io](https://capstone-tours.readthedocs.io/en/latest/).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Vite, Leaflet via react-leaflet, Lucide icons |
| Backend | Django 5 + Django REST Framework, GeoDjango |
| Spatial queries | PostGIS (PostgreSQL geographic extension) |
| Database | PostgreSQL 16 + PostGIS 3.4 (Docker) |
| Media storage | Google Cloud Storage (production) · local filesystem (development) |
| Dev environment | Docker Compose |

---

## How It Works

The React frontend fetches landmark data (name, description, GPS coordinates, photos) from the Django REST API and renders each landmark as a pin on a Leaflet map. The browser Geolocation API continuously tracks the user's position — a blue dot and proximity circle follow them around the map. When the user walks within 200 ft (61 m) of a landmark, a proximity card slides up automatically. Tapping a pin or the proximity card opens a full-screen detail sheet with photos and descriptions. The list view provides a secondary way to browse all landmarks.

---

## Prerequisites

- **Docker Desktop** — must be running before any `docker compose` commands will work
  - macOS: standard install
  - Windows: requires WSL2 enabled
- **Git**
- **Node.js + npm** — only needed to run the frontend dev server

---

## First-Time Setup

Run all commands from the **repository root** unless noted otherwise.

### 1. Create your local environment file

```bash
cp .env.example .env
```

`.env` is not committed to Git — each developer keeps their own local copy.

### 2. Build and start the backend containers

```bash
docker compose up -d --build
```

This builds the Django image and starts two containers:

- `db` — PostgreSQL + PostGIS database
- `web` — Django development server at <http://localhost:8000>

The first build may take a few minutes (GDAL and other spatial libraries are large).

### 3. Run database migrations

```bash
docker compose exec web python manage.py migrate
```

### 4. Create an admin user

```bash
docker compose exec web python manage.py createsuperuser
```

Follow the prompts. You will use this account to log into the Django admin panel and manage landmark data.

### 5. Verify the backend

- API: <http://localhost:8000/api/health/> → should return `{"status": "ok"}`
- Admin: <http://localhost:8000/admin>

### 6. Start the frontend dev server

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at <http://localhost:5173> with hot module replacement. See the development guide for more details on frontend development.

---

## Day-to-Day Development

**Start the backend stack:**

```bash
docker compose up -d
```

**Stop the backend stack:**

```bash
docker compose down
```

**Rebuild after changing `requirements.txt`:**

```bash
docker compose up -d --build
```

**View backend logs:**

```bash
docker compose logs web --tail=100
```

**Open a shell inside the Django container** (useful to avoid prefixing every command with `docker compose exec web`):

```bash
docker compose exec web bash
```

**Run database migrations after model changes:**

```bash
docker compose exec web python manage.py makemigrations
docker compose exec web python manage.py migrate
```

---

## Team Conventions

- **Do not commit `.env`** — it contains secrets and local config
- **Database runs only in Docker** — do not install PostgreSQL or PostGIS locally
- **All Django management commands run via Docker** — `docker compose exec web python manage.py ...`
