import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const DRAG_CLOSE_THRESHOLD = 100; // px downward drag before dismissing

// How long the exit animation plays before the parent unmounts the component.
const EXIT_DURATION_MS = 380;

// CSS transition for the entry slide-up and the snap-back after an
// incomplete drag. The cubic-bezier mimics an iOS sheet presentation:
// it decelerates sharply as the card reaches its resting position.
const ENTRY_TRANSITION = 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)';

function LandmarkDetailView({ landmark, onClose, topInset }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragY, setDragY] = useState(0);

  // `entered` flips true one frame after mount to trigger the entry animation.
  const [entered, setEntered] = useState(false);

  // `isLeaving` triggers the exit animation. The parent unmounts the component
  // after EXIT_DURATION_MS so the animation has time to complete.
  const [isLeaving, setIsLeaving] = useState(false);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Ref-based guard so handleClose can't be triggered twice simultaneously
  // (e.g. backdrop tap and drag threshold hit at the same moment).
  const isLeavingRef = useRef(false);

  // Timeout id for the exit delay — cleared on unmount to avoid calling
  // setState / the onClose prop after the component is gone.
  const leaveTimerRef = useRef(null);

  const photos = landmark.photos ?? [];

  // ── Entry animation ────────────────────────────────────────────────────────

  useEffect(() => {
    // One rAF delay so the browser paints the initial off-screen state
    // (transform: translateY(100vh) from the CSS class) before we add
    // .ldv-card--entered, which transitions the card to translateY(0).
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // ── Animated close ─────────────────────────────────────────────────────────

  const handleClose = () => {
    if (isLeavingRef.current) return; // prevent double-trigger
    isLeavingRef.current = true;
    setIsLeaving(true);
    leaveTimerRef.current = setTimeout(
      () => onCloseRef.current?.(),
      EXIT_DURATION_MS,
    );
  };

  // ── Drag helpers ────────────────────────────────────────────────────────────

  const beginDrag = (clientY) => {
    isDragging.current = true;
    startY.current = clientY;
  };

  const updateDrag = (clientY) => {
    if (!isDragging.current) return;
    setDragY(Math.max(0, clientY - startY.current));
  };

  const commitDrag = (clientY) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (clientY - startY.current > DRAG_CLOSE_THRESHOLD) {
      handleClose();
    } else {
      setDragY(0);
    }
  };

  // Global mouse listeners so drag works even when cursor leaves the header.
  useEffect(() => {
    const onMove = (e) => updateDrag(e.clientY);
    const onUp   = (e) => commitDrag(e.clientY);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inline styles ──────────────────────────────────────────────────────────

  // Three mutually exclusive motion states for the card, same pattern as
  // ExploreCard:
  //
  //   1. isLeaving — exit animation: slide down to below viewport.
  //   2. dragY > 0 — active drag: card follows finger/cursor in real time.
  //   3. Normal — no inline transform; CSS .ldv-card / .ldv-card--entered
  //      own the entry animation. The transition string is set inline so
  //      both the entry and snap-back use the same curve.

  let cardMotionStyle;
  if (isLeaving) {
    cardMotionStyle = {
      transform: 'translateY(100vh)',
      transition: `transform ${EXIT_DURATION_MS}ms ease`,
    };
  } else if (dragY > 0) {
    cardMotionStyle = {
      transform: `translateY(${dragY}px)`,
      transition: 'none',
    };
  } else {
    // No inline transform — CSS class handles the entry position.
    cardMotionStyle = { transition: ENTRY_TRANSITION };
  }

  // Backdrop fades in when the card enters and fades out when it leaves.
  // The CSS `transition: opacity 0.3s ease` on .ldv-backdrop animates this.
  const backdropOpacity = entered && !isLeaving ? 1 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="ldv-backdrop"
        style={{ opacity: backdropOpacity }}
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className={`ldv-card${entered ? ' ldv-card--entered' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          '--ldv-top': topInset != null ? `${topInset + 8}px` : undefined,
          ...cardMotionStyle,
        }}
      >
        {/* ── Non-scrollable header: drag target + title row ──────────────── */}
        <div
          className="ldv-header"
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          onTouchMove={(e)  => updateDrag(e.touches[0].clientY)}
          onTouchEnd={(e)   => commitDrag(e.changedTouches[0].clientY)}
        >
          <div className="ldv-drag-pill" />

          <div className="ldv-title-row">
            <h2 className="ldv-title">{landmark.name}</h2>

            {/* stopPropagation prevents the close button from triggering drag */}
            <button
              className="ldv-close-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={handleClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="ldv-divider" />

        {/* ── Scrollable content ───────────────────────────────────────────── */}
        <div className="ldv-scroll-area">

          {photos.length > 0 && (
            <div className="ldv-carousel">
              <img
                className="ldv-carousel-img"
                src={photos[photoIndex].url}
                alt={photos[photoIndex].caption ?? landmark.name}
              />
              {photos.length > 1 && (
                <>
                  <button
                    className="ldv-carousel-btn ldv-carousel-btn--prev"
                    onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="ldv-carousel-btn ldv-carousel-btn--next"
                    onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="ldv-dots">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className={`ldv-dot${i === photoIndex ? ' ldv-dot--active' : ''}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <p className="ldv-description">
            {landmark.long_description ?? landmark.short_description}
          </p>
        </div>
      </div>
    </>
  );
}

export default LandmarkDetailView;
