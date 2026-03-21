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

## Frontend Development

### Starting the Dev Server

The React frontend uses Vite. From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` by default.

### Component Tester

`frontend/src/ComponentTester.jsx` is an interactive harness for developing and testing UI components in isolation, without a running backend or a live map integration. It renders a sticky top bar with one tab per component. Selecting a tab swaps in the corresponding tester, which supplies the component with realistic dummy data and interactive controls.

**Current testers:**

| Tab | Tester file | Component(s) exercised |
| --- | ----------- | ---------------------- |
| Navbar | `testers/NavbarTester.jsx` | `Navbar` |
| Landmark | `testers/LandmarkDetailTester.jsx` | `LandmarkDetailView`, `Navbar` |
| Explore | `testers/ExploreCardTester.jsx` | `ExploreCard`, `LandmarkDetailView`, `Navbar` |
| Pin Card | `testers/PinCardTester.jsx` | `PinCard`, `LandmarkDetailView`, `Navbar` |
| List | `testers/ListViewTester.jsx` | `ListView`, `LandmarkDetailView`, `Navbar` |

**Switching the app entry point to the Component Tester:**

`frontend/src/main.jsx` controls what the Vite dev server renders. To run the Component Tester, import `ComponentTester` instead of `App`:

```jsx
// main.jsx — Component Tester mode
import ComponentTester from './ComponentTester.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ComponentTester />
  </StrictMode>,
)
```

To switch back to the real application, replace `ComponentTester` with `App`:

```jsx
// main.jsx — application mode
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**How ComponentTester works:**

`ComponentTester` maintains a single `activeTester` state string that identifies the currently selected tab. On each render it looks up the matching entry in the `TESTERS` registry (an array of `{ id, label, icon, component }` objects) and renders the corresponding tester component inside a scrollable content area beneath a fixed top bar. The top bar's pixel height is measured with `useLayoutEffect` and passed down to each tester as `topBarHeight` so components like `LandmarkDetailView` that need to avoid overlapping fixed UI above them can use that value as their `topInset` prop.

Each individual tester is a self-contained React component that:

- Defines one or more dummy landmark fixtures covering the relevant visual states (multiple photos, single photo, no photos, description-only).
- Renders interactive pill buttons that let you change the selected fixture, toggle the navbar on/off, and trigger the component under test.
- Mounts and unmounts the component under test in response to those controls, exercising the full entry and exit animation lifecycle.

## Docs Workflow (Read the Docs + MkDocs)

- Read the Docs config is in `readthedocs.yml`.
- Site navigation and docs config are in `mkdocs.yml`.
- All docs source files live under `docs/`.

When adding a new documentation page:

1. Create a Markdown file in `docs/`.
2. Add it to the `nav` section in `mkdocs.yml`.
3. Push changes; Read the Docs rebuilds from repository configuration.
