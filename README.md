# UA Capstone Tours

A CS 495 Capstone project to build a **mobile-friendly digital walking tour** of the University of Alabama campus.
The application provides an interactive map where users can explore campus buildings and landmarks via geotagged locations, descriptive text, and (eventually) media such as photos and audio.

The project uses **Django + PostGIS** on the backend.

## Prerequisites

All team members must have:

* **Docker Desktop**
  * macOS: standard Docker Desktop install
  * Windows: Docker Desktop **with WSL2 enabled**
* Git

> Docker Desktop **must be running** before any Docker commands will work.

## Backend Development Startup

### 1. Start the project container:
```bash
docker compose up -d
```

### 2. Enter the Django container (avoids having to type `docker compose exec web` before every command):
```bash
docker compose exec web bash
```

### 3. Do what you need to do...
If you need to make changes to the database schema, you need to make and run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```
The dockerfile should already start the Django web server, which you can access at [http://localhost:8000](http://localhost:8000). If you make changes to the code, the server should automatically reload.
  
If for whatever reason the server is not running, you can start it with:
```bash
python manage.py runserver
```
To edit stuff in the database, you can use the Django admin panel at [http://localhost:8000/admin](http://localhost:8000/admin).

### 4. Stop the project:
```bash
docker compose down
```

### Other helpful commands:
Check container status:
```bash
docker compose ps
```

View logs (helpful for debugging):
```bash
docker compose logs web --tail=100
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

## Team Conventions

* **Do not commit `.env`**
* **Database runs only in Docker**
* **All Django commands are run via Docker**
* No one installs Postgres or PostGIS locally