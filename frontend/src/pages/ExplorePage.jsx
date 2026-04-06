import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import MapComponent from '../components/mapComponent.jsx';
import ExploreCard from '../components/exploreCard.jsx';
import PinCard from '../components/pinCard.jsx';
import LandmarkDetailView from '../components/landmarkDetailView.jsx';
import Navbar from '../components/navbar.jsx';

const API_BASE = 'https://ua-capstone-backend-845958693022.us-central1.run.app/api';

// Must match --z-navbar in index.css so the navbar sits above Leaflet's layers.
const NAVBAR_Z = 820;

function ExplorePage({ activeTab, onTabChange }) {
    // ── Overlay state ────────────────────────────────────────────────────────
    // pinCard: { landmark: fullLandmark, anchorX, anchorY } | null
    const [pinCard, setPinCard] = useState(null);
    // exploreCard: fullLandmark | null  (triggered by proximity)
    const [exploreCard, setExploreCard] = useState(null);
    // detailLandmark: fullLandmark | null  (full-screen detail sheet)
    const [detailLandmark, setDetailLandmark] = useState(null);
    // navbarHeight: measured after first layout so ExploreCard floats above it
    const [navbarHeight, setNavbarHeight] = useState(90);

    // ── Refs ─────────────────────────────────────────────────────────────────
    const navbarRef    = useRef(null);
    const detailCache  = useRef(new Map()); // full landmark data keyed by id

    // Shadow the overlay state in refs so stable useCallback closures can read
    // current values without capturing stale state via their dep arrays.
    const pinCardRef        = useRef(null);
    const detailLandmarkRef = useRef(null);

    // Sync state into refs after each render (useEffect, not during render,
    // to satisfy the react-hooks/refs lint rule).
    useEffect(() => {
        pinCardRef.current        = pinCard;
        detailLandmarkRef.current = detailLandmark;
    }, [pinCard, detailLandmark]);

    // ── Navbar height measurement ────────────────────────────────────────────
    // The navbar is position:fixed so this measures its actual rendered height
    // and passes it to ExploreCard so the card floats the right distance above it.
    useLayoutEffect(() => {
        if (navbarRef.current) {
            setNavbarHeight(navbarRef.current.offsetHeight);
        }
    }, []);

    // ── Detail fetch with caching ────────────────────────────────────────────
    async function fetchDetail(id) {
        if (detailCache.current.has(id)) return detailCache.current.get(id);
        const res = await fetch(`${API_BASE}/landmarks/${id}/`);
        if (!res.ok) throw new Error(`Landmark ${id} fetch failed: ${res.status}`);
        const data = await res.json();
        detailCache.current.set(id, data);
        return data;
    }

    // ── Map callbacks ────────────────────────────────────────────────────────
    // All are stable (useCallback with [] deps) and read current state via refs,
    // so MapComponent never needs to re-register its Leaflet event listeners.

    // Called when a landmark pin is tapped. `point` is the list-level object
    // { id, name, short_description, lat, lon } from the /api/landmarks/ fetch.
    const handlePinClick = useCallback(async (point, viewportX, viewportY) => {
        if (!point.id) return;
        setExploreCard(null);
        try {
            const full = await fetchDetail(point.id);
            setPinCard({ landmark: full, anchorX: viewportX, anchorY: viewportY });
        } catch (err) {
            console.error('PinCard detail fetch failed:', err);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Called when the user walks within 200 ft of a landmark.
    const handleProximityEnter = useCallback(async (point) => {
        if (!point.id || pinCardRef.current || detailLandmarkRef.current) return;
        try {
            const full = await fetchDetail(point.id);
            setExploreCard(full);
        } catch (err) {
            console.error('ExploreCard detail fetch failed:', err);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Called when the map background (not a pin) is tapped — dismisses PinCard.
    const handleMapClick = useCallback(() => {
        setPinCard(null);
    }, []);

    // Called on every map move/pan while a PinCard is visible so the card
    // stays anchored to its pin as the map scrolls beneath it.
    const handlePinMove = useCallback((x, y) => {
        setPinCard(prev => prev ? { ...prev, anchorX: x, anchorY: y } : null);
    }, []);

    // ── Card → detail transitions ────────────────────────────────────────────

    const handlePinCardTap = () => {
        setDetailLandmark(pinCard.landmark);
        setPinCard(null);
    };

    const handleExploreCardTap = () => {
        setDetailLandmark(exploreCard);
        setExploreCard(null);
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        // The map fills the full viewport. The navbar floats over it via
        // position:fixed, and all other overlays are also position:fixed.
        <div style={{ height: '100dvh' }}>
            <MapComponent
                onPinClick={handlePinClick}
                onProximityEnter={handleProximityEnter}
                onMapClick={handleMapClick}
                onPinMove={handlePinMove}
                activePinId={pinCard?.landmark.id ?? null}
            />

            {/* Navbar floats over the map at the bottom of the screen */}
            <div
                ref={navbarRef}
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: NAVBAR_Z }}
            >
                <Navbar activeTab={activeTab} onTabChange={onTabChange} />
            </div>

            {/* PinCard: tooltip anchored above the tapped map pin */}
            {pinCard && (
                <PinCard
                    landmark={pinCard.landmark}
                    anchorX={pinCard.anchorX}
                    anchorY={pinCard.anchorY}
                    onTap={handlePinCardTap}
                />
            )}

            {/* ExploreCard: proximity notification floating above the navbar */}
            {exploreCard && (
                <ExploreCard
                    landmark={exploreCard}
                    navbarHeight={navbarHeight}
                    onTap={handleExploreCardTap}
                    onDismiss={() => setExploreCard(null)}
                />
            )}

            {/* LandmarkDetailView: full-screen bottom sheet */}
            {detailLandmark && (
                <LandmarkDetailView
                    landmark={detailLandmark}
                    onClose={() => setDetailLandmark(null)}
                />
            )}
        </div>
    );
}

export default ExplorePage;
