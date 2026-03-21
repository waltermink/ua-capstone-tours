# Frontend Components

This page documents the React UI components in `frontend/src/components/`. Each component is a presentational unit that receives data and callbacks from a parent and has no knowledge of the backend or routing layer.

Styling is split between CSS class names defined in `frontend/src/styles/components.css` (static layout, colors, base animation states) and inline `style` objects computed at render time (e.g., dynamic coordinates, animation offsets that depend on prop values).

---

## Shared Patterns

### Entry / Exit Animation Model

Every animated component follows the same two-frame mount pattern:

1. On mount the component renders with a CSS class that places it off-screen (e.g., `translateY(200px)` for `ExploreCard`, `translateY(100vh)` for `LandmarkDetailView`, `scale(0.8)` for `PinCard`).
2. A `requestAnimationFrame` callback flips an `entered` boolean one frame later. This adds a second CSS modifier class (e.g., `.ec-card--entered`) that transitions the element to its resting position.

The one-frame delay is intentional. Without it the browser may batch both renders into a single paint and skip the CSS transition entirely.

Exit animations reverse the same pattern: an `isLeaving` state flip drives a CSS transition off-screen, and a `setTimeout` matching the transition duration calls the parent's `onClose` / `onDismiss` prop once the animation has finished.

### Touch Event Handling

React attaches synthetic touch event listeners passively by default, which silently ignores any `preventDefault()` call inside those handlers. This means the underlying map or page can still scroll when the user touches an interactive card.

Where drag or swipe gestures are required, the affected components bypass React's synthetic event system entirely and register non-passive listeners directly on the DOM node via `useEffect` and `useRef`. A `touchHandlers` ref is updated every render so the stable closure registered in the effect always calls the latest handler logic without needing to re-register on every render.

---

## Navbar

**File:** `frontend/src/components/navbar.jsx`

### Purpose

The application's primary navigation bar. Renders four labeled tab buttons — Explore, Tours, List, and Contribute — in a rounded pill container designed to sit at the bottom of the viewport.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `activeTab` | `string` | ID of the currently selected tab: `'explore'`, `'tours'`, `'list'`, or `'contribute'` |
| `onTabChange` | `(id: string) => void` | Called with the tab ID when the user taps a button |

### Construction

The four tabs are defined as a static `TABS` array inside the module. The component maps over this array and renders each tab as a `<button>`. The active tab receives the `.navbar-tab--active` modifier class; all others receive only `.navbar-tab`.

Icons come from `lucide-react`. The active tab renders with `strokeWidth={2.5}`; inactive tabs use `strokeWidth={1.8}` for a subtler appearance.

### Behavior

The component is fully controlled and stateless. It reflects `activeTab` as passed and calls `onTabChange` on every button click. There is no internal selection state.

### CSS Classes

| Class | Role |
|-------|------|
| `.navbar-wrapper` | Outer container; handles bottom positioning and padding |
| `.navbar-pill` | Rounded pill background |
| `.navbar-tab` | Individual tab button |
| `.navbar-tab--active` | Modifier applied to the selected tab |

---

## ExploreCard

**File:** `frontend/src/components/exploreCard.jsx`

### Purpose

A floating summary card that appears above the navbar when the user is near a landmark on the map view. It shows the landmark name, short description, and first photo. The user can tap the card to open the full detail view, or swipe it downward to dismiss it.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `landmark` | `object` | — | `{ name, short_description, photos: [{ url, caption }] }` |
| `onTap` | `() => void` | — | Called when the user taps the card (and no swipe gesture was in progress) |
| `onDismiss` | `() => void` | — | Called after the exit animation completes following a swipe-down gesture |
| `navbarHeight` | `number` | `90` | Navbar height in px; the card is positioned `navbarHeight + 12` px above the bottom of the viewport |

### Construction

The card's `bottom` offset is set as an inline style: `navbarHeight + 12` pixels. All other layout — width, horizontal centering, border radius, shadow — is handled by `.ec-card` in CSS.

Content layout (left to right):

1. **Thumbnail** (`.ec-thumbnail`) — rendered only when `landmark.photos` has at least one entry.
2. **Text block** (`.ec-body`) — contains a static "Nearby" label (`.ec-nearby-label`), the landmark name (`.ec-name`), and optional short description (`.ec-description`).
3. **Chevron icon** (`.ec-chevron`) — visual affordance inviting a tap.

### Behavior

**Entry animation:** On mount the card starts at `opacity: 0, translateY(200px)`. One rAF later `entered` flips true, adding `.ec-card--entered` and triggering a spring-curve slide-up (`cubic-bezier(0.34, 1.2, 0.64, 1)`).

**Swipe-to-dismiss:** A downward drag exceeding `SWIPE_DISMISS_THRESHOLD` (50 px) triggers the exit sequence: `dragY` resets to 0, `isLeaving` is set, and a timed callback fires `onDismiss` after `EXIT_DURATION_MS` (280 ms). During an active drag the card tracks the pointer in real time; opacity fades from 1 to 0 over the first 100 px of downward travel. Releasing below the threshold snaps the card back to its resting position with the same spring curve.

**Tap vs. swipe disambiguation:** `touchend` always fires a synthetic click event. A `didSwipe` ref is set true when the swipe threshold is exceeded, and `handleClick` no-ops if the flag is set, preventing a false tap from opening the detail view after a swipe.

**Non-passive touch registration:** Touch listeners are registered as non-passive on the card's DOM node so that `preventDefault()` on `touchmove` works as a scroll-blocking guard. `touch-action: none` on `.ec-card` is the primary mechanism; the `preventDefault()` call is a belt-and-suspenders fallback for browsers or map libraries that may still try to scroll.

### CSS Classes

| Class | Role |
|-------|------|
| `.ec-card` | Card container; off-screen starting position |
| `.ec-card--entered` | Entry animation target (resting position) |
| `.ec-thumbnail` | Landmark photo |
| `.ec-body` | Text content wrapper |
| `.ec-nearby-label` | Static "Nearby" label |
| `.ec-name` | Landmark name |
| `.ec-description` | Short description |
| `.ec-chevron` | Right-arrow icon |

---

## LandmarkDetailView

**File:** `frontend/src/components/landmarkDetailView.jsx`

### Purpose

A full-screen bottom sheet that presents detailed information about a landmark: its name, a photo carousel (when multiple photos exist), and a long description. The sheet slides up from the bottom of the viewport on mount. It can be dismissed by tapping a close button, tapping the dimmed backdrop, or dragging the sheet header downward.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `landmark` | `object` | `{ name, short_description, long_description, photos: [{ url, caption }] }` |
| `onClose` | `() => void` | Called after the exit animation completes |
| `topInset` | `number \| null` | Optional top inset in px (e.g., the height of a sticky toolbar above). Sets the `--ldv-top` CSS custom property, which the sheet uses to cap its maximum height and avoid covering fixed UI. |

### Construction

The component renders two sibling elements:

1. **Backdrop** (`.ldv-backdrop`) — a full-viewport semi-transparent overlay. Its opacity is driven by the `entered` and `isLeaving` state flags through a CSS `transition: opacity` rule. Tapping it calls `handleClose`.

2. **Card** (`.ldv-card`) — the sheet itself, structured as:
   - **Header** (`.ldv-header`) — non-scrolling drag target. Contains a `.ldv-drag-pill` visual affordance and a title row (`.ldv-title-row`) with the landmark name and an `<X>` close button. The close button stops propagation on `mousedown` and `touchstart` so it does not accidentally start a drag gesture.
   - **Divider** (`.ldv-divider`)
   - **Scroll area** (`.ldv-scroll-area`) — scrollable region containing the optional photo carousel and description paragraph.

**Photo carousel:** When `landmark.photos` has more than one entry, `<ChevronLeft>` / `<ChevronRight>` navigation buttons and dot indicators are rendered alongside the current image. A single photo shows the image without any navigation controls.

### Behavior

**Entry animation:** The card starts at `translateY(100vh)` and transitions to `translateY(0)` with an iOS-style deceleration curve (`cubic-bezier(0.32, 0.72, 0, 1)`, 0.45 s). The backdrop fades in simultaneously via its own CSS transition.

**Exit animation:** `handleClose` sets `isLeaving = true`, transitioning the card back to `translateY(100vh)` and the backdrop to `opacity: 0`. After `EXIT_DURATION_MS` (380 ms) `onClose` is called so the parent can unmount the component.

**Drag-to-dismiss:** Downward drag of the `.ldv-header` exceeding `DRAG_CLOSE_THRESHOLD` (100 px) calls `handleClose`. Global `mousemove` / `mouseup` listeners ensure the drag registers even when the cursor leaves the header area mid-drag.

**Double-close guard:** An `isLeavingRef` boolean prevents `handleClose` from being triggered twice simultaneously (e.g., the backdrop being tapped while a drag threshold is reached in the same frame).

### CSS Classes

| Class | Role |
|-------|------|
| `.ldv-backdrop` | Full-screen dimming overlay |
| `.ldv-card` | Sheet container; `--ldv-top` custom property sets max-height / top boundary |
| `.ldv-card--entered` | Entry animation target |
| `.ldv-header` | Non-scrolling drag target area |
| `.ldv-drag-pill` | Visual drag affordance pill |
| `.ldv-title-row` | Flex row containing the title and close button |
| `.ldv-title` | Landmark name heading |
| `.ldv-close-btn` | `<X>` close button |
| `.ldv-divider` | Horizontal separator below the header |
| `.ldv-scroll-area` | Scrollable content region |
| `.ldv-carousel` | Photo carousel wrapper |
| `.ldv-carousel-img` | Displayed photo |
| `.ldv-carousel-btn` | Previous / next navigation button base class |
| `.ldv-carousel-btn--prev` | Previous button position modifier |
| `.ldv-carousel-btn--next` | Next button position modifier |
| `.ldv-dots` | Dot indicator row |
| `.ldv-dot` | Individual dot |
| `.ldv-dot--active` | Active dot modifier |
| `.ldv-description` | Description paragraph |

---

## PinCard

**File:** `frontend/src/components/pinCard.jsx`

### Purpose

A lightweight tooltip-style popover that appears directly above a tapped map pin. It shows the landmark name, an optional thumbnail, and a chevron. Tapping the card triggers `onTap` so the parent can open `LandmarkDetailView`.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `landmark` | `object` | `{ name, photos: [{ url, caption }] }` |
| `anchorX` | `number` | Viewport X coordinate of the pin in px (passed as CSS `left`) |
| `anchorY` | `number` | Viewport Y coordinate of the pin in px (passed as CSS `top`) |
| `onTap` | `() => void` | Called when the card is tapped |

### Construction

The card uses `position: fixed` (defined in `.pc-card`). `anchorX` and `anchorY` are applied as inline `left` / `top` values, placing the transform origin at the exact pin location. A CSS transform on `.pc-card` — `translateX(-50%) translateY(calc(-100% - 10px))` — centers the card horizontally over the pin and lifts it 10 px above the anchor point. The 10 px gap aligns with a downward-pointing triangle drawn by the `.pc-card::after` pseudo-element in CSS.

Content layout (top to bottom):

1. Optional thumbnail (`.pc-thumbnail`)
2. Landmark name (`.pc-name`)
3. Chevron icon (`.pc-chevron`)

### Behavior

**Entry animation:** On mount the card starts at `scale(0.8), opacity: 0`. One rAF later `.pc-card--entered` is added, triggering a spring-overshoot scale-up (`cubic-bezier(0.34, 1.56, 0.64, 1)`, 0.3 s) that gives the popover a snappy "pop" feel.

**No exit animation:** PinCard is intentionally lightweight. When the parent unmounts it (e.g., the user taps elsewhere on the map), the card disappears immediately with no transition.

**Accessibility:** The card carries `role="button"`, `tabIndex={0}`, `aria-label`, and an `onKeyDown` handler that fires `onTap` on Enter.

### CSS Classes

| Class | Role |
|-------|------|
| `.pc-card` | Card container; `::after` draws the downward pointer triangle |
| `.pc-card--entered` | Entry animation target |
| `.pc-thumbnail` | Landmark photo |
| `.pc-name` | Landmark name |
| `.pc-chevron` | Right-arrow icon |

---

## ListView

**File:** `frontend/src/components/listView.jsx`

### Purpose

A scrollable list of all available landmarks. Each row shows an optional thumbnail, the landmark name, a short description, and a chevron. Tapping a row calls `onSelectLandmark` so the parent can open `LandmarkDetailView` for that landmark.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `landmarks` | `array` | Array of landmark objects: `[{ name, short_description, photos: [{ url, caption }] }]` |
| `onSelectLandmark` | `(landmark: object) => void` | Called with the tapped landmark object |

### Construction

The component renders a single `.lv-scroll-area` container. Each landmark maps to a `.lv-entry` row `div` styled as a button. The `.lv-entry--divided` modifier class is added to every row except the last, drawing a bottom border that separates entries without a trailing line after the final item.

Row layout (left to right):

1. Optional thumbnail (`.lv-thumbnail`) — rendered only when `landmark.photos` has at least one entry.
2. Text block (`.lv-body`) containing the name (`.lv-name`) and optional short description (`.lv-description`).
3. Chevron icon (`.lv-chevron`).

### Behavior

The component is stateless. Scroll is handled natively by `overflow-y` on `.lv-scroll-area`. No tap-vs-scroll disambiguation logic is needed because browsers suppress click events when the pointer moves significantly during a native scroll gesture.

**Accessibility:** Each entry carries `role="button"`, `tabIndex={0}`, `aria-label`, and an `onKeyDown` handler for Enter.

### CSS Classes

| Class | Role |
|-------|------|
| `.lv-scroll-area` | Scrollable container; `flex: 1` so it fills its parent |
| `.lv-entry` | Individual row acting as a button |
| `.lv-entry--divided` | Adds a bottom border separator (applied to all but the last row) |
| `.lv-thumbnail` | Landmark photo |
| `.lv-body` | Text content wrapper |
| `.lv-name` | Landmark name |
| `.lv-description` | Short description |
| `.lv-chevron` | Right-arrow icon |
