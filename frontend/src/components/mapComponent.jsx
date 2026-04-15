import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Locate, LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-providers";

// Pure helper — generates the SVG path for an orientation cone pointing straight
// up (north) by default, centred at (35, 35) inside a 70×70 SVG viewport.
// halfAngleDeg is the half-width of the cone opening:
//   ~15° = narrow / confident heading, ~60° = wide / uncertain heading.
function getConePath(halfAngleDeg) {
    const cx = 35, cy = 35, r = 30;
    const rad = (halfAngleDeg * Math.PI) / 180;
    const x1 = (cx - r * Math.sin(rad)).toFixed(2);
    const y1 = (cy - r * Math.cos(rad)).toFixed(2);
    const x2 = (cx + r * Math.sin(rad)).toFixed(2);
    // y2 === y1 — cone is symmetric about the vertical axis
    const largeArc = halfAngleDeg >= 90 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${largeArc},1,${x2},${y1} Z`;
}

export default function MapComponent({ onPinClick, onProximityEnter, onMapClick, onPinMove, activePinId }) {
    const mapContainerRef = useRef(null); // ref for the DOM div element
    const mapRef = useRef(null);          // ref for the Leaflet map instance

    // ── Follow-me toggle state ────────────────────────────────────────────────
    const [isFollowing, setIsFollowing] = useState(true);

    // ── Refs ──────────────────────────────────────────────────────────────────
    // Callback ref — holds the latest prop callbacks so the one-time Leaflet
    // useEffect always calls the current versions without being in its dep array.
    // activePinIdRef, isFollowingRef, and lastPositionRef are also kept as refs
    // so Leaflet's closed-over callbacks always read the current values.
    // All are updated via a single no-dep useEffect (not during render) to
    // satisfy the react-hooks/refs lint rule.
    const callbacksRef   = useRef({ onPinClick, onProximityEnter, onMapClick, onPinMove });
    const activePinIdRef = useRef(activePinId);
    const isFollowingRef = useRef(true);
    const lastPositionRef = useRef(null); // { lat, lng } of most recent GPS fix
    const userMarkerRef   = useRef(null); // Leaflet marker for the blue dot — set in startTracking, read by the orientation handler

    useEffect(() => {
        callbacksRef.current   = { onPinClick, onProximityEnter, onMapClick, onPinMove };
        activePinIdRef.current = activePinId;
        isFollowingRef.current = isFollowing;
    }); // intentionally no dep array — runs after every render to keep refs current

    // ── Follow-me toggle handler ──────────────────────────────────────────────
    const handleFollowToggle = () => {
        const next = !isFollowing;
        setIsFollowing(next);
        if (next && lastPositionRef.current) {
            const { lat, lng } = lastPositionRef.current;
            mapRef.current?.flyTo([lat, lng], 17, { animate: true, duration: 0.8 });
        }
    };

    // ── Geolocation tracking ──────────────────────────────────────────────────
    function startTracking(map, points) {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported.");
            return null;
        }

        const triggered = new Set(); // prevents proximity from re-firing every second
        let userMarker = null;
        let proximityCircle = null;
        let firstFix = true;

        const PROXIMITY_RADIUS = 61; // 200 ft ≈ 61 m — matches default proximity_radius

        const watchId = navigator.geolocation.watchPosition(function(pos) {
            const { latitude: lat, longitude: lng } = pos.coords;

            // Store the latest position so the follow-toggle handler can use it
            lastPositionRef.current = { lat, lng };

            if (!userMarker) {
                // Location dot + orientation cone combined into one 70×70 SVG divIcon
                // so both are always pixel-perfectly centred on the same anchor point.
                // Using an SVG circle for the dot (instead of a bordered HTML div) avoids
                // the content-box sizing mismatch that caused the previous centering offset.
                const userIcon = L.divIcon({
                    className: '',
                    html: `<svg width="70" height="70" viewBox="0 0 70 70"
                                style="display:block;overflow:visible;">
                        <!-- Orientation cone: points up (north) by default.
                             Rotated by CSS transform in the deviceorientation handler.
                             transform-origin is the SVG centre (35,35) so it always
                             pivots around the dot, not the SVG corner. -->
                        <path class="loc-cone"
                            d="${getConePath(45)}"
                            fill="rgba(59,130,246,0.28)"
                            stroke="none"
                            style="transform-origin:35px 35px;"
                        />
                        <!-- Main location dot -->
                        <circle cx="35" cy="35" r="10"
                            fill="#3b82f6" stroke="white" stroke-width="4" />
                    </svg>`,
                    iconSize: [70, 70],
                    iconAnchor: [35, 35],   // exact centre of the SVG = centre of the dot
                });
                userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindTooltip('You are here');
                // Expose the marker so the deviceorientation handler can query the cone element
                userMarkerRef.current = userMarker;

                // Accuracy ring — dashed outline, no fill, so it reads as a boundary
                // rather than a solid overlay. dashArray + lineCap:'round' give
                // rounded-cap dashes matching the design intent.
                proximityCircle = L.circle([lat, lng], {
                    radius: PROXIMITY_RADIUS,
                    color: '#3b82f6',
                    fill: false,
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '4 7',
                    lineCap: 'round',
                    interactive: false,
                }).addTo(map);

                // On first GPS fix, fly to the user's actual location at walking-tour zoom
                if (firstFix) {
                    firstFix = false;
                    map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
                }
            } else {
                // The dot and circle already exist — just move them to the new position
                userMarker.setLatLng([lat, lng]);
                proximityCircle.setLatLng([lat, lng]);
            }

            // If follow-me mode is active, keep the map centered on the user
            if (isFollowingRef.current) {
                map.panTo([lat, lng]);
            }

            points.forEach(point => {
                if (triggered.has(point.id)) return;

                const dist = getDistanceMeters(lat, lng, point.lat, point.lon);  // API returns "lon" not "lng"
                const radius = point.proximity_radius || 61; // 200 feet ≈ 61 metres

                if (dist <= radius) {
                    triggered.add(point.id);
                    callbacksRef.current.onProximityEnter?.(point);
                }
            });

        }, function(err) {
            console.error("Location error:", err.message);
        }, {
            enableHighAccuracy: true,
            maximumAge: 5000
        });

        return watchId;
    }

    // Haversine formula — calculates real-world distance between two GPS coords
    function getDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    useEffect(() => {
        // Guard: prevents re-initialization on React Strict Mode double-invoke
        // and any other re-render that might trigger this effect.
        if (mapRef.current) return;

        // 1. Create the map using the container ref instead of a string ID,
        //    so this component can safely be mounted more than once.
        //    Start at UA campus as a fallback; geolocation flyTo overrides this.
        //    zoomControl: false — replaced by custom crimson pill buttons below.
        //    attributionControl: false — re-added at topright below so it sits
        //    in the empty corner rather than overlapping the navbar area.
        const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([33.2098, -87.5692], 16);
        mapRef.current = map;

        // Re-add the attribution control at the top-right with no prefix.
        // The tile layer's own credits are added automatically when it is added.
        L.control.attribution({ position: 'topright', prefix: '' }).addTo(map);

        // 2. Add Stadia AlidadeSmooth tile layer (muted, clean style).
        L.tileLayer.provider('Stadia.AlidadeSmooth').addTo(map);

        // 3. Shared landmarks array — declared here so both the event listeners
        //    below and the API fetch further down can reference the same object.
        //    watchPosition reads this by reference, so items pushed in step 6 are
        //    automatically picked up on the next geolocation update.
        const landmarks = [];

        // 4. Map background click — dismisses any open PinCard
        map.on('click', () => callbacksRef.current.onMapClick?.());

        // 5. Map move — keep the PinCard anchored to its pin as the user pans/zooms.
        //    Fires on every animation frame during a pan; reads activePinIdRef to
        //    find the active landmark, recomputes its viewport coordinates, and
        //    calls onPinMove so ExplorePage can update the PinCard anchor in state.
        map.on('move', function() {
            const id = activePinIdRef.current;
            if (!id) return;
            const pt = landmarks.find(l => l.id === id);
            if (!pt) return;
            const containerPoint = map.latLngToContainerPoint([pt.lat, pt.lon]);
            const rect = mapContainerRef.current.getBoundingClientRect();
            callbacksRef.current.onPinMove?.(rect.left + containerPoint.x, rect.top + containerPoint.y);
        });

        // 6. User drag deactivates follow-me mode so the map stops re-centering.
        map.on('dragstart', () => setIsFollowing(false));

        // 7. Start geolocation tracking immediately so the blue dot appears
        //    without waiting for the landmark fetch.
        const watchId = startTracking(map, landmarks);

        // 8. Device orientation — drives the heading cone on the user location dot.
        //    coneEl is queried lazily (marker doesn't exist until first GPS fix).
        //    lastHalfAngle throttles path redraws to when accuracy changes by >3°.
        let coneEl = null;
        let lastHalfAngle = 45;

        function handleOrientation(event) {
            // Lazily resolve the cone element once the marker is in the DOM
            if (!coneEl) {
                coneEl = userMarkerRef.current?.getElement()?.querySelector('.loc-cone') ?? null;
            }
            if (!coneEl) return;

            let heading = null;
            let halfAngle = 45; // fallback: wide cone = uncertain direction

            if (event.webkitCompassHeading != null) {
                // iOS — degrees clockwise from true north, 0–360
                heading = event.webkitCompassHeading;
                // webkitCompassAccuracy: ±° margin; clamp to a useful display range
                const acc = event.webkitCompassAccuracy ?? 45;
                halfAngle = Math.max(15, Math.min(acc, 60));
            } else if (event.alpha != null) {
                // Android/web — alpha is CCW rotation from north; invert to CW
                heading = (360 - event.alpha) % 360;
                halfAngle = 30; // no standard accuracy value — use a moderate cone
            }

            if (heading == null) return;

            // Rotate the cone to match the compass heading
            coneEl.style.transform = `rotate(${heading.toFixed(1)}deg)`;

            // Rebuild the cone path only when accuracy shifts meaningfully
            if (Math.abs(halfAngle - lastHalfAngle) > 3) {
                lastHalfAngle = halfAngle;
                coneEl.setAttribute('d', getConePath(halfAngle));
            }
        }

        // useCapture: true ensures we get the event before any child handlers
        window.addEventListener('deviceorientation', handleOrientation, true);

        // 9. Load landmarks from Django API and push into the shared array.

        // Returns a Leaflet divIcon for the given category.
        // Generic uses the existing crimson teardrop; all others use a colored circle
        // with a Lucide icon (24x24 viewBox) scaled into a 16x16 area via nested SVG.
        function getCategoryIcon(category) {
            if (!category || category === 'generic') {
                return L.divIcon({
                    className: '',
                    html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#9E1B32"/>
                        <circle cx="12" cy="12" r="4" fill="white"/>
                    </svg>`,
                    iconSize: [24, 32],
                    iconAnchor: [12, 32],
                });
            }

            // Lucide SVG paths (24×24 viewBox). Rendered via nested <svg x="6" y="6" width="16" height="16">
            // so the icon fits inside the 28×28 circle with comfortable padding.
            const configs = {
                dining: {
                    color: '#D35400',
                    // Lucide: Utensils
                    paths: `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`,
                    fill: 'none',
                },
                academic: {
                    color: '#2980B9',
                    // Lucide: GraduationCap
                    paths: `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>`,
                    fill: 'none',
                },
                library: {
                    color: '#1E8449',
                    // Lucide: BookOpen
                    paths: `<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>`,
                    fill: 'none',
                },
                athletics: {
                    color: '#7D3C98',
                    // Lucide: Trophy
                    paths: `<path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/>`,
                    fill: 'none',
                },
                housing: {
                    color: '#117A8B',
                    // Lucide: House
                    paths: `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,
                    fill: 'none',
                },
                poi: {
                    color: '#B7950B',
                    // Lucide: Star (filled)
                    paths: `<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>`,
                    fill: 'white',
                },
            };

            const cfg = configs[category] ?? configs.poi;

            return L.divIcon({
                className: '',
                html: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="13" fill="${cfg.color}" stroke="white" stroke-width="1.5"/>
                    <svg x="6" y="6" width="16" height="16" viewBox="0 0 24 24" fill="${cfg.fill}" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        ${cfg.paths}
                    </svg>
                </svg>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
            });
        }

        fetch('https://ua-capstone-backend-845958693022.us-central1.run.app/api/landmarks/')
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(data => {

                data.forEach(point => {

                    // Create category-specific pin marker and attach click handler
                    const pinIcon = getCategoryIcon(point.category);
                    point._marker = L.marker([point.lat, point.lon], { icon: pinIcon }).addTo(map);  // API returns "lon" not "lng"

                    point._marker.on('click', function(e) {
                        // Stop propagation so the map 'click' (which calls onMapClick)
                        // doesn't also fire, which would immediately dismiss the PinCard.
                        L.DomEvent.stopPropagation(e);

                        // Convert the marker's LatLng to viewport pixel coordinates
                        // so PinCard can be positioned at the pin's screen location.
                        const containerPoint = map.latLngToContainerPoint(e.latlng);
                        const rect = mapContainerRef.current.getBoundingClientRect();
                        const viewportX = rect.left + containerPoint.x;
                        const viewportY = rect.top  + containerPoint.y;

                        callbacksRef.current.onPinClick?.(point, viewportX, viewportY);
                    });

                    landmarks.push(point);

                });

            })
            .catch(error => console.error("Error loading landmarks:", error));

        // 10. Cleanup: stop watching position, remove orientation listener, and
        //     destroy the map on unmount so the component can be safely remounted.
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            if (watchId != null) navigator.geolocation.clearWatch(watchId);
            map.remove();
            mapRef.current = null;
        };
    }, []);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
            <div className="map-zoom-controls">
                <button
                    className="map-zoom-btn"
                    onClick={() => mapRef.current?.zoomIn()}
                    aria-label="Zoom in"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
                <button
                    className="map-zoom-btn"
                    onClick={() => mapRef.current?.zoomOut()}
                    aria-label="Zoom out"
                >
                    <Minus size={18} strokeWidth={2.5} />
                </button>
                <div className="map-zoom-divider" />
                <button
                    className={`map-zoom-btn${isFollowing ? ' map-zoom-btn--active' : ''}`}
                    onClick={handleFollowToggle}
                    aria-label={isFollowing ? 'Stop following location' : 'Follow my location'}
                >
                    {isFollowing
                        ? <LocateFixed size={18} strokeWidth={2.5} />
                        : <Locate size={18} strokeWidth={2.5} />}
                </button>
            </div>
        </div>
    );
}
