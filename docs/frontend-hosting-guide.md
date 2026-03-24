# Frontend Hosting Guide
### UA Capstone Tours — React Frontend

---

## Table of Contents
1. [Overview](#overview)
2. [Technologies Used](#technologies-used)
3. [Hosting Process](#hosting-process)
4. [Environment Variables](#environment-variables)
5. [Backend Integration](#backend-integration)
6. [Redeploying After Changes](#redeploying-after-changes)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The frontend is a React application built with Vite and hosted on **Firebase Hosting**. It serves as a map-based campus tour interface that reads landmark data from the Django backend API. Firebase Hosting was chosen because it provides free static file hosting, automatic HTTPS, a global CDN, and fast deployment with minimal configuration.

The frontend and backend are hosted as completely separate services:
- **Frontend** — Firebase Hosting (`https://campus-tour-backend.web.app`)
- **Backend** — Google Cloud Run (`https://ua-capstone-backend-845958693022.us-central1.run.app`)

The frontend communicates with the backend by making HTTP requests to the backend's API endpoints.

---

## Technologies Used

### React
React is a JavaScript library for building user interfaces. The frontend is built as a React application, meaning the UI is composed of reusable components. React handles rendering the map interface and landmark information.

### Vite
Vite is the build tool used to compile and bundle the React application into static files for deployment. Running `npm run build` triggers Vite to produce an optimized `dist` folder containing HTML, CSS, and JavaScript files that can be served by any static hosting provider.

### Leaflet + OpenStreetMap
The map is powered by **Leaflet**, an open-source JavaScript mapping library, using **OpenStreetMap** tiles as the map layer. This combination requires no API key and is completely free to use. Leaflet handles:
- Rendering the interactive map
- Placing landmark markers
- Showing popups with landmark information
- Tracking the user's live GPS location and triggering proximity-based popups

### Firebase Hosting
Firebase Hosting is Google's static file hosting service. It serves the compiled React app as a static website with:
- Automatic HTTPS on a free `.web.app` domain
- Global CDN for fast load times
- Simple deployment via the Firebase CLI
- Single-page app routing support

### Firebase CLI
The Firebase Command Line Interface (`firebase-tools`) is used to initialize and deploy the project. Since it was installed via npm, it is invoked using `npx firebase-tools` rather than the `firebase` command directly.

### Node.js + npm
Node.js is the JavaScript runtime required to run Vite and install project dependencies. npm (Node Package Manager) is used to install all frontend dependencies defined in `package.json`, including React, Vite, and Leaflet.

---

## Hosting Process

### Step 1 — Install Node.js
Node.js was installed from [nodejs.org](https://nodejs.org) (LTS version). This also installs npm, which is required to run all subsequent commands.

### Step 2 — Install Project Dependencies
From the frontend folder, all project dependencies were installed:

```bash
cd frontend
npm install
```

This reads `package.json` and installs everything into a `node_modules` folder. This step must be run once on every new machine before building.

### Step 3 — Build the React App
Vite compiled the React source code into optimized static files:

```bash
npm run build
```

This produces a `dist` folder containing:
- `index.html` — the entry point
- Compiled and minified JavaScript bundles
- Compiled CSS files
- Any static assets from the `public` folder

### Step 4 — Install Firebase CLI
The Firebase CLI was installed globally via npm:

```bash
npm install -g firebase-tools
```

Since the global install did not add Firebase to the system PATH, it is invoked using `npx firebase-tools` for all commands.

### Step 5 — Log into Firebase
Authentication with Firebase was completed via browser:

```bash
npx firebase-tools login
```

A browser window opened for Google account authentication. The same Google account used for Google Cloud Platform was used.

### Step 6 — Initialize Firebase Hosting
Firebase Hosting was initialized in the frontend folder:

```bash
npx firebase-tools init hosting
```

The following options were selected during initialization:

| Question | Answer |
|----------|--------|
| Firebase project | Created new project `ua-capstone-frontend` |
| Public directory | `dist` |
| Configure as single-page app | Yes |
| Set up automatic GitHub builds | No |
| Overwrite dist/index.html | No |

A new standalone Firebase project (`ua-capstone-frontend`) was created rather than linking to the existing GCP project (`campus-tour-backend`) due to a permissions issue with the GCP project. This is a clean separation — the frontend gets its own Firebase project.

This step created two configuration files in the frontend folder:
- `firebase.json` — Firebase Hosting configuration
- `.firebaserc` — project alias configuration

### Step 7 — Deploy to Firebase Hosting
The compiled `dist` folder was deployed to Firebase:

```bash
npx firebase-tools deploy
```

Firebase uploaded all files in the `dist` folder to its CDN and provided a live URL:
```
https://campus-tour-backend.web.app
```

---

## Environment Variables

The frontend uses a Vite environment variable to store the backend API URL so it doesn't need to be hardcoded in the source code.

### `.env` file (local development)
Create a `.env` file in the frontend folder:

```
VITE_API_URL=https://ua-capstone-backend-845958693022.us-central1.run.app
```

### Usage in code
In `map.js`, the environment variable is accessed like this:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
fetch(`${API_URL}/api/landmarks/`)
```

This means:
- In **development** (`npm run dev`), it falls back to `http://localhost:8000`
- In **production** (Firebase), it uses the real backend URL from the `.env` file

### Important
The `.env` file must be added to `.gitignore` so it is never committed to the repository:

```
.env
```

The `.env` file must be present on every machine that builds and deploys the frontend. If it is missing, the app will fall back to `localhost:8000` which will not work in production.

---

## Backend Integration

The frontend communicates with the Django backend via HTTP GET requests to these endpoints:

| Endpoint | Used For |
|----------|----------|
| `/api/landmarks/` | Lightweight list of all landmarks with lat/lon for map markers |
| `/api/landmarks/<id>/` | Full detail for a single landmark including all photos |
| `/api/landmarks/full/` | Full list of all landmarks with first photo for each |
| `/api/landmarks/nearby/` | Landmarks near a GPS coordinate within a given radius |

### CORS Configuration
Since the frontend is hosted on a different domain than the backend, the backend must explicitly allow requests from the frontend URL. In `config/settings.py`:

```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://campus-tour-backend.app",
]
```

> ⚠️ The current configuration uses `CORS_ALLOW_ALL_ORIGINS = True` which allows any domain to call the API. This should be updated to the specific frontend URL before going to production.

---

## Redeploying After Changes

Every time frontend code is changed, the app must be rebuilt and redeployed. Both steps must be run from the frontend folder:

```bash
cd "c:\...\ua-capstone-tours\frontend"
```

**Rebuild and redeploy in one command:**
```bash
npm run build && npx firebase-tools deploy
```

Or as two separate commands:
```bash
npm run build
npx firebase-tools deploy
```

### When to redeploy
- Any change to React components or JavaScript files
- Any change to CSS or styling
- Any change to environment variables (`.env`)
- Any change to static assets in the `public` folder

### When NOT to redeploy the frontend
- Backend-only changes (API, database, settings) — these only require a backend redeploy
- Changes to `README.md` or other non-code files

---

## Troubleshooting

### `'npm' is not recognized`
Node.js is not installed or not in PATH. Download and install from [nodejs.org](https://nodejs.org), then open a new terminal.

### `'firebase' is not recognized`
Firebase CLI is not in PATH. Use `npx firebase-tools` instead of `firebase` for all commands.

### `'vite' is not recognized` when running `npm run build`
The `node_modules` folder is missing. Run `npm install` first, then retry the build.

### `Error: Not in a Firebase app directory`
You are not in the frontend folder. Run `cd frontend` first, then retry the deploy command.

### Map shows 401 error
The backend API URL in `.env` is wrong or missing. Check that:
1. `.env` exists in the frontend folder
2. `VITE_API_URL` is set to the correct backend URL
3. The app was rebuilt after changing `.env`

### Map shows but no landmarks appear
The backend API is not returning data. Check:
1. The backend is running and healthy at `/api/health/`
2. CORS is configured to allow requests from the Firebase URL
3. The `VITE_API_URL` in `.env` points to the correct backend URL

### Changes not showing after redeploy
Make sure you ran `npm run build` before `npx firebase-tools deploy`. Deploying without rebuilding will push the old compiled files.
