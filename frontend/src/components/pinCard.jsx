import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

// CSS transition for the entry pop animation.
// The cubic-bezier gives a spring-like overshoot as the card scales up.
const ENTRY_TRANSITION = 'opacity 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

// PinCard appears above a tapped map pin as a compact tooltip-style popover.
//
// Props:
//   landmark    — { name, photos: [{ url, caption }] }
//   anchorX     — viewport X (px) of the pin; used as CSS `left`
//   anchorY     — viewport Y (px) of the pin; used as CSS `top`
//   onTap       — called when the card is tapped (parent opens detail view)
//
// Positioning is handled entirely by CSS:
//   `left: anchorX; top: anchorY` places the transform origin at the pin.
//   `transform: translateX(-50%) translateY(calc(-100% - 10px))` centers the
//   card horizontally and lifts it above the anchor, leaving 10 px for the
//   downward-pointing triangle defined in .pc-card::after (components.css).
//
// There is no drag gesture and no exit animation — the card is lightweight.
// When the parent unmounts it (map tap elsewhere), it disappears immediately.

function PinCard({ landmark, anchorX, anchorY, onTap }) {
  // `entered` flips true one frame after mount to trigger the entry animation.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const firstPhoto = landmark.photos?.[0];

  return (
    <div
      className={`pc-card${entered ? ' pc-card--entered' : ''}`}
      style={{ left: anchorX, top: anchorY, transition: ENTRY_TRANSITION }}
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onTap?.()}
      aria-label={`View details for ${landmark.name}`}
    >
      {firstPhoto && (
        <img
          className="pc-thumbnail"
          src={firstPhoto.url}
          alt={firstPhoto.caption ?? landmark.name}
        />
      )}

      <p className="pc-name">{landmark.name}</p>

      <ChevronRight className="pc-chevron" size={18} />
    </div>
  );
}

export default PinCard;
