# Development Guide

This guide covers everything you need to develop the UA Capstone Tours project: setting up the backend with Docker, understanding how the Django API works, running the React frontend locally, and using the component tester for isolated UI development.

---

## Prerequisites

- **Docker Desktop** — must be running before any `docker compose` commands will work
  - macOS: standard install
  - Windows: requires WSL2 enabled
- **Git**
- **Node.js + npm** — only required to run the Vite frontend dev server; the backend runs entirely in Docker

---

## Environment Setup

Copy the example environment file to create your local config:

```bash
cp .env.example .env
```

`.env` is not committed to Git. Each developer keeps their own local copy with their own values.

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB` | Database name (default: `ua_tour`) |
| `POSTGRES_USER` | Database username (default: `ua_tour`) |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_PORT` | Host port the database is exposed on (default: `5432`) |
| `DJANGO_SECRET_KEY` | Django cryptographic secret — use any long random string locally |
| `DJANGO_DEBUG` | Set to `1` for development, `0` for production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames (e.g. `localhost,127.0.0.1`) |
| `DJANGO_PORT` | Host port the Django server is exposed on (default: `8000`) |

> `POSTGRES_HOST` does not need to be set in `.env`. Docker Compose automatically sets it to `db` (the container service name) so Django can reach the database inside the Compose network.

---

## Backend Setup (Docker)

All commands run from the **repository root**.

### 1. Build and start containers

```bash
docker compose up -d --build
```

This starts two services defined in `compose.yaml`:

- **`db`** — PostGIS 3.4 on PostgreSQL 16, data persisted in a named Docker volume (`pgdata`)
- **`web`** — Django dev server; `./backend` is volume-mounted into the container so code changes reload automatically

The first build takes several minutes because it installs GDAL and other spatial libraries.

### 2. Run migrations

```bash
docker compose exec web python manage.py migrate
```

### 3. Create an admin user

```bash
docker compose exec web python manage.py createsuperuser
```

### 4. Verify

- API health check: <http://localhost:8000/api/health/> → `{"status": "ok"}`
- Django admin: <http://localhost:8000/admin>

### 5. Stop the stack

```bash
docker compose down
```

Data in the `pgdata` volume persists between stops. To wipe the database entirely, run `docker compose down -v`.

### Rebuild after dependency changes

Any time you add or remove packages from `backend/requirements.txt`, rebuild the image:

```bash
docker compose up -d --build
```

---

## Common Backend Commands

Open a shell inside the Django container to avoid prefixing every command:

```bash
docker compose exec web bash
```

From inside the container (or with the `docker compose exec web` prefix from outside):

| Task | Command |
| --- | --- |
| Create migrations | `python manage.py makemigrations` |
| Apply migrations | `python manage.py migrate` |
| Django interactive shell | `python manage.py shell` |
| Run API tests | `python manage.py test api` |
| Check container status | `docker compose ps` (run from host) |
| View logs | `docker compose logs web --tail=100` (run from host) |

---

## Backend Architecture

The backend lives in the `backend/` directory and is a standard Django project with two custom apps.

### Directory Layout

```
backend/
├── config/           # Django project package (settings, root URL config, WSGI/ASGI)
├── api/              # REST API endpoints (views, serializers, URLs)
├── locations_db/     # Data models and Django admin configuration
├── manage.py
├── requirements.txt
└── Dockerfile
```

### Runtime Architecture

1. Clients call API endpoints under `/api/`.
2. DRF generic views query `locations_db` models.
3. Serializers shape response payloads for list/detail/nearby use cases.
4. Media files (landmark photos) are served from `/media/` in development.

### URL Routing

- `/api/` → API endpoints (`backend/api/urls.py`)
- `/admin/` → Django admin
- `/locations_db/` → temporary app route used for basic test response

### Django Settings (`config/settings.py`)

Key configuration decisions:

- **Database engine:** `django.contrib.gis.db.backends.postgis` — the GeoDjango-aware PostGIS backend, required for geographic field types and spatial queries
- **Media storage:** In production, media files (landmark photos) are stored in a Google Cloud Storage bucket (`ua-capstone-media`). In development (`DEBUG=True`), they are served locally from `backend/media/`, which is Docker-mounted at `./backend/media:/app/media`
- **CORS:** Currently set to `CORS_ALLOW_ALL_ORIGINS = True` for development convenience
- **REST Framework:** Default permission is `AllowAny` — no authentication is required to read the API

### The `locations_db` App — Data Models

This app owns the database schema.

**`Landmark` model** (`locations_db/models.py`):

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `CharField(200)` | Display name |
| `short_description` | `TextField` | Shown in map popups and list rows |
| `long_description` | `TextField` | Shown on the full detail sheet |
| `location` | `PointField(srid=4326, geography=True)` | WGS84 lat/lon, stored as PostGIS geography |
| `address` | `CharField(255, blank)` | Optional street address |
| `is_published` | `BooleanField(default=True)` | Controls visibility; unpublished landmarks are excluded from all API responses |
| `created_at` / `updated_at` | `DateTimeField` | Auto-managed timestamps |

**`LandmarkPhoto` model:**

| Field | Type | Notes |
| --- | --- | --- |
| `landmark` | `ForeignKey(Landmark, CASCADE)` | Parent landmark |
| `image` | `ImageField` | Stored under `landmark_photos/%Y/%m/` |
| `caption` | `CharField(255, blank)` | Optional display caption |
| `alt_text` | `CharField(255, blank)` | Accessibility text |
| `sort_order` | `PositiveIntegerField(default=0)` | Lower values appear first |

**Admin:** The `Landmark` admin uses a custom form that exposes separate latitude and longitude fields instead of a raw Point input. `LandmarkPhotoInline` lets you manage photos directly from the landmark edit page.

### The `api` App — REST Endpoints

All endpoints live under the `/api/` prefix.

| Method | Path | Description | Response shape |
| --- | --- | --- | --- |
| `GET` | `/api/health/` | Liveness check | `{"status": "ok"}` |
| `GET` | `/api/landmarks/` | All published landmarks — basic info for map pins | `[{id, name, short_description, lat, lon}]` |
| `GET` | `/api/landmarks/full/` | All published landmarks — includes first photo per landmark | `[{id, name, short_description, long_description, lat, lon, address, photos}]` |
| `GET` | `/api/landmarks/<id>/` | Single landmark — full detail with all photos | `{id, name, short_description, long_description, lat, lon, address, photos[]}` |
| `GET` | `/api/landmarks/nearby/` | Landmarks within a radius, ordered by distance | `[{id, name, short_description, lat, lon, distance_m, cover_photo_url}]` |

**`/api/landmarks/nearby/` query parameters:**

| Parameter | Required | Default | Constraints |
| --- | --- | --- | --- |
| `lat` | Yes | — | −90 to 90 |
| `lon` | Yes | — | −180 to 180 |
| `radius_m` | No | 500 | 1 to 20000 |

**Spatial query note:** PostGIS `Point` objects are constructed as `Point(lon, lat, srid=4326)` — longitude is the `x` argument, latitude is `y`. This is the opposite of how coordinates are often written verbally, so be careful if you extend the nearby query logic.

---

## Frontend Dev Server

The frontend is a React + Vite application in the `frontend/` directory.

```bash
cd frontend
npm install   # first time only
npm run dev
```

Vite starts at <http://localhost:5173> with hot module replacement — edits to any `.jsx` or `.css` file reflect in the browser immediately without a full page reload.

> **Important:** The Docker Compose `frontend` service (nginx at port 3000) is meant to preview a built static snapshot of the frontend, not for active development. Always use the Vite dev server at port 5173 when developing.

### Build for production

```bash
npm run build
```

Output goes to `frontend/dist/`. The project deploys the built frontend to Firebase Hosting.

---

## Frontend Architecture

### Entry Point

`src/main.jsx` is the Vite entry point. It renders either the main application or the component tester:

```jsx
// Application mode (default)
import App from './App.jsx'

// Component tester mode (swap in when doing isolated UI work)
import ComponentTester from './ComponentTester.jsx'
```

### Routing

There is no URL-based router. `App.jsx` maintains an `activeTab` state string with four possible values: `'explore'`, `'list'`, `'tours'`, `'contribute'`. It renders the matching page component and passes `activeTab` and `onTabChange` down as props.

### Pages

| File | Status | Description |
| --- | --- | --- |
| `pages/ExplorePage.jsx` | Active | Full-viewport map with all overlay UI |
| `pages/ListPage.jsx` | Active | Scrollable landmark list |
| `pages/ToursPage.jsx` | Placeholder | "Coming soon" |
| `pages/ContributePage.jsx` | Active | User contribution interface |

**`ExplorePage`** is the main interactive experience. It manages three overlay states — `pinCard`, `exploreCard`, and `detailLandmark` — and coordinates all map interaction through callbacks passed into `MapComponent`. Fetched landmark detail objects are cached in a `useRef(new Map())` to avoid redundant network requests when the user taps the same pin multiple times.

### Components

**`mapComponent.jsx`**

The Leaflet map. Key implementation details:

- The Leaflet map instance is created once in a `useEffect` with no dependency array and stored in `mapRef`. Re-renders do not re-initialize the map.
- `callbacksRef` is updated on every render (no dep array) so Leaflet's closed-over event handlers always call the latest prop callbacks without being in the dependency array — this is the standard pattern for integrating Leaflet (an imperative library) with React.
- Geolocation uses `navigator.geolocation.watchPosition`. Each position update runs a Haversine distance calculation against all landmark points. A `Set` (`triggered`) prevents the proximity callback from firing more than once per landmark per session.
- Proximity radius is 61 m (≈ 200 ft), matching the `PROXIMITY_RADIUS` constant in the component.
- Props: `onPinClick(point, viewportX, viewportY)`, `onProximityEnter(point)`, `onMapClick()`, `onPinMove(x, y)`, `activePinId`

**`landmarkDetailView.jsx`**

Full-screen bottom sheet that slides up over the map. Features:

- Entry animation uses an iOS-style `cubic-bezier` spring curve
- Touch drag-to-dismiss: tracking starts on `touchstart`, sheet follows finger on `touchmove`, closes if drag exceeds 100 px on `touchend`
- Photo carousel with previous/next buttons and dot indicators
- `topInset` prop positions the sheet below any fixed UI above it (passed from the parent page, which measures the navbar height)

**`exploreCard.jsx`**

Floating card that appears when the user enters proximity of a landmark. Positioned above the navbar using `navbarHeight` prop. Swipe-down-to-dismiss with a 50 px threshold; opacity fades as the card is dragged.

**`pinCard.jsx`**

Lightweight tooltip that appears above a tapped map pin. Positioned using `viewportX` / `viewportY` props (pixel coordinates from the map click event, passed up by `MapComponent`). Uses CSS transforms to center it horizontally and lift it above the pin with a triangular pointer.

**`navbar.jsx`**

Fixed bottom tab bar with four tabs (Explore, Tours, List, Contribute). Rendered as a crimson pill; the active tab has a white background.

**`listView.jsx`**

Renders a scrollable list of landmark rows. Each row shows a thumbnail, name, and short description with a chevron affordance.

### Styling

**`src/index.css`** — global reset, UA brand design tokens, z-index scale:

```css
--ua-crimson:         #9E1B32;   /* Primary brand color */
--ua-capstone-gray:   #828A8F;
--ua-pachyderm:       #5F6A72;   /* Secondary text */
--ua-chimes-gray:     #C1C6C9;   /* Dividers */
--ua-crimson-glow:    rgba(158, 27, 50, 0.35);

/* Z-index scale (Leaflet uses up to ~700) */
--z-explore-card:  800;
--z-pin-card:      810;
--z-navbar:        820;
--z-backdrop:      1050;
--z-card:          1051;
--z-chrome:        1100;
```

Fonts: Trade Gothic (headings), Minion Pro (body/description text).

**`src/styles/components.css`** — all component-level styles (~570 lines): navbar, detail sheet, explore card, pin card, map controls, list view, animations.

### API Integration

The backend base URL is currently hardcoded in the components:

```
https://ua-capstone-backend-845958693022.us-central1.run.app/api
```

For local development against the Docker backend, you need to change this to `http://localhost:8000/api` in the relevant components (`mapComponent.jsx`, `ExplorePage.jsx`, `ListPage.jsx`). The app uses native `fetch` for all requests.

---

## Component Tester

`src/ComponentTester.jsx` is an interactive development harness that lets you build and test UI components in isolation — no running backend required (except for the Map tester, which needs landmark data).

### Activating the Component Tester

In `src/main.jsx`, replace the `App` import with `ComponentTester`:

```jsx
// Component tester mode
import ComponentTester from './ComponentTester.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ComponentTester />
  </StrictMode>,
)
```

To switch back to the real application, restore the `App` import:

```jsx
// Application mode
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### Available Testers

| Tab | File | Components exercised |
| --- | --- | --- |
| Navbar | `testers/NavbarTester.jsx` | `Navbar` |
| Landmark | `testers/LandmarkDetailTester.jsx` | `LandmarkDetailView`, `Navbar` |
| Explore | `testers/ExploreCardTester.jsx` | `ExploreCard`, `LandmarkDetailView`, `Navbar` |
| Pin Card | `testers/PinCardTester.jsx` | `PinCard`, `LandmarkDetailView`, `Navbar` |
| List | `testers/ListViewTester.jsx` | `ListView`, `LandmarkDetailView`, `Navbar` |
| Map | `testers/MapComponentTester.jsx` | `MapComponent` (requires Django backend for landmark markers) |

### How It Works

`ComponentTester` maintains a single `activeTester` state string. A `TESTERS` registry (an array of `{ id, label, icon, component }` objects) maps each tab to its tester component. The tester renders inside a scrollable content area below a fixed top bar.

The top bar's pixel height is measured with `useLayoutEffect` and passed to each tester as `topBarHeight`. Testers forward this as `topInset` to components like `LandmarkDetailView` that need to avoid overlapping fixed UI above them.

Each individual tester:

- Defines one or more dummy landmark fixtures covering relevant visual states (multiple photos, single photo, no photos, description-only)
- Renders interactive pill buttons to select fixtures, toggle the navbar on/off, and trigger the component
- Mounts and unmounts the component under test via those controls, exercising the full entry and exit animation lifecycle without needing real data or a backend

---

## Docs Workflow (Read the Docs + MkDocs)

Project documentation is hosted at [capstone-tours.readthedocs.io](https://capstone-tours.readthedocs.io/en/latest/) and built automatically from the `docs/` directory.

- **Read the Docs config:** `readthedocs.yml` (repository root)
- **Site structure and navigation:** `mkdocs.yml` (repository root)
- **Source files:** `docs/` directory (Markdown)

To add a new documentation page:

1. Create a Markdown file in `docs/`
2. Add it to the `nav` section in `mkdocs.yml`
3. Push to the repository — Read the Docs will rebuild automatically
