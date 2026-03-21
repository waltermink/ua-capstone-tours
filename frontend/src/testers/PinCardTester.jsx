import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import PinCard from '../components/pinCard.jsx';
import LandmarkDetailView from '../components/landmarkDetailView.jsx';
import Navbar from '../components/navbar.jsx';

// ─── Mock map constants ────────────────────────────────────────────────────────

const MAP_W = 1400;
const MAP_H = 1000;

// Preset pins, each tied to a different dummy landmark so all visual states
// (multi-photo, single photo, no photo) can be tested without extra controls.
const PINS = [
  { id: 1, mapX: 350, mapY: 280, landmarkId: 'denny-chimes'      }, // top-left    (3 photos)
  { id: 2, mapX: 800, mapY: 280, landmarkId: 'gorgas-library'    }, // top-right   (1 photo)
  { id: 3, mapX: 350, mapY: 660, landmarkId: 'coleman-coliseum'  }, // bottom-left (no photos)
  { id: 4, mapX: 800, mapY: 660, landmarkId: 'foster-auditorium' }, // bottom-right(no photos)
];

const DUMMY_LANDMARKS = [
  {
    id: 'denny-chimes',
    data: {
      name: 'Denny Chimes',
      short_description: 'The iconic bell tower standing at the heart of the Quad.',
      long_description:
        'Denny Chimes is a 115-foot free-standing campanile located on the University of Alabama Quad. Built in 1929 and named after president George H. Denny, it chimes the Westminster quarters every 15 minutes. The tower is one of the most recognizable landmarks on campus and is listed on the National Register of Historic Places.',
      photos: [
        { url: 'https://placehold.co/600x300/9E1B32/ffffff?text=Denny+Chimes',   caption: 'Tower exterior' },
        { url: 'https://placehold.co/600x300/7a1526/ffffff?text=Denny+Chimes+2', caption: 'View from the Quad' },
        { url: 'https://placehold.co/600x300/5a0f1c/ffffff?text=Denny+Chimes+3', caption: 'Bell tower close-up' },
      ],
    },
  },
  {
    id: 'gorgas-library',
    data: {
      name: 'Gorgas Library',
      short_description: 'The main library and academic hub of campus.',
      long_description:
        'Gorgas Library is the flagship library of the University of Alabama, named after Josiah Gorgas, university president and Confederate general. The building houses special collections, rare books, and university archives alongside modern research facilities.',
      photos: [
        { url: 'https://placehold.co/600x300/1a3a5c/ffffff?text=Gorgas+Library', caption: null },
      ],
    },
  },
  {
    id: 'coleman-coliseum',
    data: {
      name: 'Coleman Coliseum',
      short_description: 'Home of Alabama Crimson Tide basketball and gymnastics.',
      long_description:
        'Coleman Coliseum is a 15,383-seat multi-purpose arena that has hosted Alabama basketball since 1968. It also serves as the home of the renowned Alabama gymnastics program. The arena underwent a major renovation in 2014 to modernize facilities for both athletes and fans.',
      photos: [],
    },
  },
  {
    id: 'foster-auditorium',
    data: {
      name: 'Foster Auditorium',
      short_description: 'Historic site of the 1963 "Stand in the Schoolhouse Door."',
      photos: [],
    },
  },
];

// ─── PinCardTester ────────────────────────────────────────────────────────────

function PinCardTester({ topBarHeight }) {
  // Current map pan offset (initialized by useLayoutEffect to center the map).
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [panReady, setPanReady]   = useState(false);

  // Which pin's card is currently showing (null = no card).
  const [activePinId, setActivePinId] = useState(null);

  // Landmark ID saved when a card is tapped — stays set while the detail view
  // is open even though activePinId is cleared at the same time.
  const [detailLandmarkId, setDetailLandmarkId] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [navTab, setNavTab]         = useState('explore');

  const mapRef  = useRef(null);

  // Drag-tracking refs — updated on every event without causing re-renders.
  const dragStartRef  = useRef(null); // { clientX, clientY, panX, panY }
  const isPanningRef  = useRef(false);

  // ── Center map on mount ────────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setPan({
        x: (rect.width  - MAP_W) / 2,
        y: (rect.height - MAP_H) / 2,
      });
      setPanReady(true);
    }
  }, []);

  // ── Global mouse listeners for panning ───────────────────────────────────

  // Stored in a ref so the stable useEffect closure always calls the latest
  // version without re-registering the listeners on every render.
  const panHandlers = useRef({});
  panHandlers.current = {
    move: (e) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      if (Math.hypot(dx, dy) > 5) isPanningRef.current = true;
      if (isPanningRef.current) {
        setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
      }
    },
    up: (e) => {
      if (!dragStartRef.current) return;
      if (!isPanningRef.current) {
        // Short tap on map background — dismiss active pin card.
        setActivePinId(null);
      }
      dragStartRef.current = null;
      isPanningRef.current = false;
    },
  };

  useEffect(() => {
    const onMove = (e) => panHandlers.current.move(e);
    const onUp   = (e) => panHandlers.current.up(e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Non-passive touch listeners for panning ───────────────────────────────

  // touch-action: none on the map layer prevents scroll, but we also register
  // non-passive listeners so e.preventDefault() works as a belt-and-suspenders
  // guard on browsers that still try to scroll during touchmove.
  const touchPanHandlers = useRef({});
  touchPanHandlers.current = {
    start: (e) => {
      const t = e.touches[0];
      dragStartRef.current  = { clientX: t.clientX, clientY: t.clientY, panX: pan.x, panY: pan.y };
      isPanningRef.current  = false;
    },
    move: (e) => {
      if (!dragStartRef.current) return;
      e.preventDefault();
      const t  = e.touches[0];
      const dx = t.clientX - dragStartRef.current.clientX;
      const dy = t.clientY - dragStartRef.current.clientY;
      if (Math.hypot(dx, dy) > 5) isPanningRef.current = true;
      if (isPanningRef.current) {
        setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
      }
    },
    end: () => {
      if (!isPanningRef.current) setActivePinId(null);
      dragStartRef.current = null;
      isPanningRef.current = false;
    },
  };

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const onStart = (e) => touchPanHandlers.current.start(e);
    const onMove  = (e) => touchPanHandlers.current.move(e);
    const onEnd   = ()  => touchPanHandlers.current.end();
    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PinCard anchor computation ────────────────────────────────────────────

  // Recomputed every render so the card tracks the pin as the map pans.
  const activePin = PINS.find(p => p.id === activePinId);
  let anchorX, anchorY;
  if (activePin && mapRef.current) {
    const rect = mapRef.current.getBoundingClientRect();
    anchorX = rect.left + activePin.mapX + pan.x;
    anchorY = rect.top  + activePin.mapY + pan.y;
  }

  const activeLandmark = activePin
    ? DUMMY_LANDMARKS.find(l => l.id === activePin.landmarkId)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCardTap = () => {
    // Save the landmark ID before clearing activePinId — otherwise activeLandmark
    // becomes null on the same render tick and the detail view never mounts.
    setDetailLandmarkId(activePin.landmarkId);
    setActivePinId(null);
    setDetailOpen(true);
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={s.body}>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div style={s.controls}>
        <button
          style={{ ...s.pill, ...(showNavbar ? s.pillActive : {}) }}
          onClick={() => setShowNavbar(v => !v)}
        >
          {showNavbar ? 'Navbar: visible' : 'Navbar: hidden'}
        </button>

        <button
          style={{ ...s.pill, ...(activePinId ? s.pillDismiss : s.pillDisabled) }}
          onClick={() => setActivePinId(null)}
          disabled={!activePinId}
        >
          Dismiss Card
        </button>
      </div>

      {/* ── Pin legend ──────────────────────────────────────────────────── */}
      <div style={s.legend}>
        {PINS.map((pin, i) => {
          const lm = DUMMY_LANDMARKS.find(l => l.id === pin.landmarkId);
          const photoLabel = lm.data.photos.length > 1
            ? `${lm.data.photos.length} photos`
            : lm.data.photos.length === 1
            ? '1 photo'
            : 'no photos';
          return (
            <span key={pin.id} style={s.legendItem}>
              <span style={{ ...s.legendDot, backgroundColor: PIN_COLORS[i] }} />
              Pin {pin.id} — {lm.data.name} ({photoLabel})
            </span>
          );
        })}
      </div>

      {/* ── Mock map viewport ───────────────────────────────────────────── */}
      <div style={s.mapViewport} ref={mapRef}>
        <p style={s.mapHint}>Tap a pin · Drag to pan</p>

        {/* Map layer — pans via the transform */}
        {panReady && (
          <div
            style={{
              ...s.mapLayer,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
            onMouseDown={(e) => {
              dragStartRef.current  = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y };
              isPanningRef.current  = false;
            }}
          >
            {/* Pin markers */}
            {PINS.map((pin, i) => (
              <div
                key={pin.id}
                style={{
                  ...s.pinMarker,
                  left: pin.mapX,
                  top:  pin.mapY,
                  color: PIN_COLORS[i],
                  zIndex: activePinId === pin.id ? 2 : 1,
                }}
                onClick={(e) => {
                  e.stopPropagation(); // prevent map background tap handler
                  setActivePinId(pin.id);
                  setDetailOpen(false);
                }}
              >
                {/* Label above pin icon so the icon tip lands at (mapX, mapY) */}
                <span style={s.pinLabel}>
                  {DUMMY_LANDMARKS.find(l => l.id === pin.landmarkId).data.name}
                </span>
                <MapPin size={28} fill={PIN_COLORS[i]} strokeWidth={1.5} color="#fff" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      {showNavbar && (
        <div style={s.fixedNavbar}>
          <Navbar activeTab={navTab} onTabChange={setNavTab} />
        </div>
      )}

      {/* ── Pin Card ────────────────────────────────────────────────────── */}
      {activeLandmark && anchorX != null && anchorY != null && (
        <PinCard
          key={activePinId}
          landmark={activeLandmark.data}
          anchorX={anchorX}
          anchorY={anchorY}
          onTap={handleCardTap}
        />
      )}

      {/* ── Landmark Detail View ────────────────────────────────────────── */}
      {detailOpen && detailLandmarkId && (() => {
        const lm = DUMMY_LANDMARKS.find(l => l.id === detailLandmarkId);
        return lm ? (
          <LandmarkDetailView
            landmark={lm.data}
            onClose={handleDetailClose}
            topInset={topBarHeight}
          />
        ) : null;
      })()}
    </div>
  );
}

// A distinct color per pin so the legend is easy to read.
const PIN_COLORS = ['#9E1B32', '#1a3a5c', '#2e7d32', '#e65100'];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  body: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    padding: '12px 16px 0',
    gap: '12px',
    boxSizing: 'border-box',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  pill: {
    padding: '6px 16px',
    borderRadius: '9999px',
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    color: '#333',
    fontSize: '13px',
    cursor: 'pointer',
  },
  pillActive: {
    borderColor: '#9E1B32',
    backgroundColor: '#9E1B32',
    color: '#fff',
  },
  pillDismiss: {
    borderColor: '#555',
    backgroundColor: '#555',
    color: '#fff',
  },
  pillDisabled: {
    opacity: 0.4,
    cursor: 'default',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 16px',
    flexShrink: 0,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#555',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  mapViewport: {
    position: 'relative',
    flex: 1,
    minHeight: '360px',
    backgroundColor: '#e8ecef',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'grab',
    userSelect: 'none',
    // Subtle grid lines to suggest a map background
    backgroundImage: [
      'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
      'linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
    ].join(', '),
    backgroundSize: '40px 40px',
  },
  mapHint: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    margin: 0,
    fontSize: '11px',
    color: '#999',
    pointerEvents: 'none',
    zIndex: 10,
    whiteSpace: 'nowrap',
  },
  mapLayer: {
    position: 'absolute',
    width: MAP_W,
    height: MAP_H,
    top: 0,
    left: 0,
    touchAction: 'none',
  },
  pinMarker: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transform: 'translate(-50%, -100%)',
    cursor: 'pointer',
  },
  pinLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#333',
    whiteSpace: 'nowrap',
    textShadow: '0 1px 3px rgba(255,255,255,0.9)',
    pointerEvents: 'none',
  },
  fixedNavbar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 150,
  },
};

export default PinCardTester;
