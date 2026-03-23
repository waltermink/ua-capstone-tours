import { ChevronRight } from 'lucide-react';

// ListView renders a scrollable list of landmarks.
//
// Props:
//   landmarks         — array of { name, photos: [{ url, caption }], short_description, ... }
//   onSelectLandmark  — called with the landmark object when an entry is tapped
//
// Tap vs scroll: native overflow-y scroll + onClick is sufficient. Browsers
// suppress click when the pointer moves significantly during a scroll gesture,
// so no additional disambiguation logic is needed.

function ListView({ landmarks, onSelectLandmark }) {
  return (
    <div className="lv-scroll-area">
      {landmarks.map((landmark, i) => {
        const firstPhoto = landmark.photos?.[0];
        return (
          <div
            key={landmark.id}
            className={`lv-entry${i < landmarks.length - 1 ? ' lv-entry--divided' : ''}`}
            onClick={() => onSelectLandmark?.(landmark)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectLandmark?.(landmark)}
            aria-label={`View details for ${landmark.name}`}
          >
            {firstPhoto && (
              <img
                className="lv-thumbnail"
                src={firstPhoto.url}
                alt={firstPhoto.caption ?? landmark.name}
              />
            )}

            <div className="lv-body">
              <p className="lv-name">{landmark.name}</p>
              {landmark.short_description && (
                <p className="lv-description">{landmark.short_description}</p>
              )}
            </div>

            <ChevronRight className="lv-chevron" size={20} />
          </div>
        );
      })}
    </div>
  );
}

export default ListView;
