import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

// How many pixels downward the user must drag before the card dismisses.
const SWIPE_DISMISS_THRESHOLD = 50;

// Duration of the exit animation in ms. The setTimeout that calls onDismiss
// waits this long so the animation completes before the card is unmounted.
const EXIT_DURATION_MS = 280;

// CSS transition string for the entry animation and swipe snap-back.
// The cubic-bezier gives a slight overshoot (spring feel) on the way up.
const ENTRY_TRANSITION = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)';

function ExploreCard({ landmark, onTap, onDismiss, navbarHeight = 90 }) {
  // Flips to true one frame after mount to trigger the CSS entry animation.
  const [entered, setEntered] = useState(false);

  // How far (px) the card has been dragged downward during an active swipe.
  const [dragY, setDragY] = useState(0);

  // True while the card is playing its exit animation (after a completed swipe).
  const [isLeaving, setIsLeaving] = useState(false);

  // DOM ref so we can attach non-passive touch listeners (see below).
  const cardRef = useRef(null);

  // Mutable drag-tracking values. Using refs (not state) so they update
  // without triggering a re-render on every pixel of movement.
  const isDragging = useRef(false);
  const startY = useRef(0);

  // Set to true when a swipe exceeds the dismiss threshold, so the onClick
  // handler knows to ignore the click that fires after touchend/mouseup.
  const didSwipe = useRef(false);

  // Stable ref to onDismiss so the closure inside useEffect always calls
  // the latest prop value without needing to be in the dependency array.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Timeout id for the exit animation delay — cleared on unmount.
  const leaveTimerRef = useRef(null);

  // ── Entry animation ────────────────────────────────────────────────────────

  useEffect(() => {
    // requestAnimationFrame ensures the browser paints the initial hidden state
    // (opacity:0, translateY:200px from the CSS class) before we set entered=true.
    // Without this, the browser may batch both renders into one frame and skip
    // the transition entirely.
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Clear the exit timer if the component is unmounted mid-animation.
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // ── Drag helpers ────────────────────────────────────────────────────────────

  const beginDrag = (clientY) => {
    isDragging.current = true;
    didSwipe.current = false;
    startY.current = clientY;
  };

  const updateDrag = (clientY) => {
    if (!isDragging.current) return;
    const delta = clientY - startY.current;
    setDragY(Math.max(0, delta)); // clamp to downward-only movement
    if (delta > SWIPE_DISMISS_THRESHOLD) {
      didSwipe.current = true;
    }
  };

  const commitDrag = (clientY) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = clientY - startY.current;
    if (delta > SWIPE_DISMISS_THRESHOLD) {
      // Snap dragY back to 0 so the CSS exit animation starts from the card's
      // resting position, then animate to off-screen via isLeaving styles.
      setDragY(0);
      setIsLeaving(true);
      leaveTimerRef.current = setTimeout(
        () => onDismissRef.current?.(),
        EXIT_DURATION_MS,
      );
    } else {
      // Didn't reach the threshold — snap back to resting position.
      setDragY(0);
    }
  };

  // ── Global mouse listeners ─────────────────────────────────────────────────

  // Attached to window so a drag still registers if the cursor leaves the card.
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

  // ── Non-passive touch listeners ────────────────────────────────────────────

  // React attaches synthetic touch event listeners passively by default, which
  // means preventDefault() inside onTouchStart / onTouchMove is silently
  // ignored. Passive listeners allow the browser to start scrolling immediately
  // without waiting for JS — great for performance, but it means we can't stop
  // the underlying page (or map) from scrolling when the user touches the card.
  //
  // The fix: bypass React's synthetic events for touch and register our own
  // non-passive listeners directly on the DOM element via useEffect.
  //
  // We store the actual handler logic in a ref (touchHandlers) that is updated
  // every render, so the stable wrapper functions in useEffect always call the
  // current version without requiring a re-register each render.
  const touchHandlers = useRef({});
  touchHandlers.current = {
    // No preventDefault on touchstart/touchend — calling it suppresses the
    // browser's synthetic click event, which is how handleClick/onTap fires
    // after a tap. touch-action:none on the element (set in components.css)
    // already prevents the page and map from scrolling without blocking clicks.
    start: (e) => { beginDrag(e.touches[0].clientY); },
    // preventDefault on touchmove is kept as a belt-and-suspenders guard
    // during an active drag, in case touch-action alone isn't enough on
    // some browsers/map libraries.
    move:  (e) => { e.preventDefault(); updateDrag(e.touches[0].clientY); },
    end:   (e) => { commitDrag(e.changedTouches[0].clientY); },
  };

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onStart = (e) => touchHandlers.current.start(e);
    const onMove  = (e) => touchHandlers.current.move(e);
    const onEnd   = (e) => touchHandlers.current.end(e);
    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, []);

  // ── Tap handler ────────────────────────────────────────────────────────────

  const handleClick = () => {
    // After a swipe gesture, the browser fires a click event when the finger
    // lifts. didSwipe lets us ignore that false tap.
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    onTap?.();
  };

  // ── Inline styles ──────────────────────────────────────────────────────────

  // Three mutually exclusive states, in priority order:
  //
  //   1. isLeaving — exit animation: translate down to off-screen + fade out.
  //
  //   2. dragY > 0 — active drag: card follows the finger in real time.
  //      Opacity fades as the card moves down (fully gone at 100px drag).
  //      Transition is 'none' so there's no lag between finger and card.
  //
  //   3. Normal — no inline transform or opacity; the CSS class handles both.
  //      The entry animation plays when the .ec-card--entered class is added.
  //      Setting `transition` inline here means the snap-back (dragY 0→0) and
  //      entry animation both use the spring curve.

  let motionStyle;
  if (isLeaving) {
    motionStyle = {
      transform: 'translateY(200px)',
      opacity: 0,
      transition: `opacity ${EXIT_DURATION_MS * 0.8}ms ease, transform ${EXIT_DURATION_MS}ms ease`,
    };
  } else if (dragY > 0) {
    motionStyle = {
      transform: `translateY(${dragY}px)`,
      opacity: Math.max(0, 1 - dragY / 100),
      transition: 'none',
    };
  } else {
    // No inline transform — CSS `.ec-card` / `.ec-card--entered` drive the
    // entry animation translateY. Only the transition string is inline here.
    motionStyle = { transition: ENTRY_TRANSITION };
  }

  const firstPhoto = landmark.photos?.[0];
  const bottomOffset = navbarHeight + 12; // 12px gap above the navbar

  return (
    <div
      ref={cardRef}
      className={`ec-card${entered ? ' ec-card--entered' : ''}`}
      style={{ bottom: bottomOffset, ...motionStyle }}
      onClick={handleClick}
      onMouseDown={(e) => beginDrag(e.clientY)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`View details for ${landmark.name}`}
    >
      {/* Thumbnail — only shown when the landmark has at least one photo */}
      {firstPhoto && (
        <img
          className="ec-thumbnail"
          src={firstPhoto.url}
          alt={firstPhoto.caption ?? landmark.name}
        />
      )}

      {/* Name + description */}
      <div className="ec-body">
        <p className="ec-nearby-label">Nearby</p>
        <p className="ec-name">{landmark.name}</p>
        {landmark.short_description && (
          <p className="ec-description">{landmark.short_description}</p>
        )}
      </div>

      {/* Chevron — visual affordance inviting the user to tap */}
      <ChevronRight className="ec-chevron" size={20} />
    </div>
  );
}

export default ExploreCard;
