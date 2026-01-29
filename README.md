# UA Capstone Tours

A CS 495 Capstone project to build a **mobile-friendly digital walking tour** of the University of Alabama campus.
The application provides an interactive map where users can explore campus buildings and landmarks via geotagged locations, descriptive text, and (eventually) media such as photos and audio.

The project uses **Django + PostGIS** on the backend and is developed using **Docker** to ensure a consistent setup across all team members.

## Tech Stack (Current)

* **Backend:** Django (with GeoDjango)
* **Database:** PostgreSQL + PostGIS
* **Containerization:** Docker + Docker Compose
* **Frontend (planned):** Leaflet + OpenStreetMap
* **Languages:** Python, HTML/CSS/JavaScript

## Prerequisites

All team members must have:

* **Docker Desktop**

  * macOS: standard Docker Desktop install
  * Windows: Docker Desktop **with WSL2 enabled**
* Git

> Docker Desktop **must be running** before any Docker commands will work.

## Repository Structure

```
.
├── backend/            # Django project + Dockerfile
├── compose.yaml        # Docker Compose configuration
├── .env.example        # Environment variable template
├── README.md
```

## First-Time Setup (All Platforms)

Run the following commands **from the repository root**.

### 1. Create your local environment file

```bash
cp .env.example .env
```

> `.env` is not committed to Git. Each developer has their own local copy.

### 2. Build and start the containers

```bash
docker compose up -d --build
```

This will:

* Build the Django container
* Start PostgreSQL + PostGIS
* Start the Django development server

The first build may take several minutes.

### 3. Run database migrations

```bash
docker compose exec web python manage.py migrate
```

### 4. Create an admin user

```bash
docker compose exec web python manage.py createsuperuser
```

Follow the prompts.

### 5. Open the app

* Main site: [http://localhost:8000](http://localhost:8000)
* Admin panel: [http://localhost:8000/admin](http://localhost:8000/admin)

If you can log into the admin panel, your setup is working correctly.

## Daily Development Commands

Start the project:

```bash
docker compose up -d
```

Stop the project:

```bash
docker compose down
```

Check container status:

```bash
docker compose ps
```

View logs (helpful for debugging):

```bash
docker compose logs web --tail=100
```

## Team Conventions

* **Do not commit ****`.env`**
* **Database runs only in Docker**
* **All Django commands are run via Docker**
* No one installs Postgres or PostGIS locally

## Next Steps (Planned)

* Add landmark models with spatial fields
* Serve GeoJSON for map rendering
* Integrate Leaflet map frontend
* Support user-contributed locations and moderation
* Add media (photos/audio) to landmarks
* Curate walking tours
