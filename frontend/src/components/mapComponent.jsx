import { useEffect, useRef, useState } from "react";
import { Plus, Minus, Locate, LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-providers";

export default function MapComponent({ onPinClick, onProximityEnter, onMapClick, onPinMove, activePinId }) {
    const mapContainerRef = useRef(null); // ref for the DOM div element
    const mapRef = useRef(null);          // ref for the Leaflet map instance

    // ── Follow-me toggle state ────────────────────────────────────────────────
    const [isFollowing, setIsFollowing] = useState(false);

    // ── Refs ──────────────────────────────────────────────────────────────────
    // Callback ref — holds the latest prop callbacks so the one-time Leaflet
    // useEffect always calls the current versions without being in its dep array.
    // activePinIdRef, isFollowingRef, and lastPositionRef are also kept as refs
    // so Leaflet's closed-over callbacks always read the current values.
    // All are updated via a single no-dep useEffect (not during render) to
    // satisfy the react-hooks/refs lint rule.
    const callbacksRef   = useRef({ onPinClick, onProximityEnter, onMapClick, onPinMove });
    const activePinIdRef = useRef(activePinId);
    const isFollowingRef = useRef(false);
    const lastPositionRef = useRef(null); // { lat, lng } of most recent GPS fix

    useEffect(() => {
        callbacksRef.current   = { onPinClick, onProximityEnter, onMapClick, onPinMove };
        activePinIdRef.current = activePinId;
        isFollowingRef.current = isFollowing;
    });

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
                // First time we have a position — create the blue dot marker
                const userIcon = L.divIcon({
                    className: '',
                    html: `<div style="
                        width: 16px;
                        height: 16px;
                        background: #3b82f6;
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
                    "></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]  // centers the dot on the exact coordinate
                });
                userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindTooltip('You are here');

                // Proximity radius circle — shows the 200 ft detection range
                proximityCircle = L.circle([lat, lng], {
                    radius: PROXIMITY_RADIUS,
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.08,
                    weight: 1.5,
                    opacity: 0.35,
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

        // 8. Load landmarks from Django API and push into the shared array.
        fetch('https://ua-capstone-backend-845958693022.us-central1.run.app/api/landmarks/')
            .then(response => response.json())
            .then(data => {

                data.forEach(point => {

                    // Create marker and attach click handler
                    point._marker = L.marker([point.lat, point.lon]).addTo(map);  // API returns "lon" not "lng"

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

        // 9. Cleanup: stop watching position and destroy the map on unmount so
        //    the component can be safely remounted (e.g. switching tabs).
        return () => {
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
