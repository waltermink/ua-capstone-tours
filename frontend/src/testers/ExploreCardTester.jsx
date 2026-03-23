import { useState } from 'react';
import ExploreCard from '../components/exploreCard.jsx';
import LandmarkDetailView from '../components/landmarkDetailView.jsx';
import Navbar from '../components/navbar.jsx';

// Same dummy landmarks as LandmarkDetailTester for consistency.
const DUMMY_LANDMARKS = [
    {
        id: 'denny-chimes',
        label: 'Denny Chimes (multi-photo)',
        data: {
            name: 'Denny Chimes',
            short_description: 'The iconic bell tower standing at the heart of the Quad.',
            long_description:
                'Denny Chimes is a 115-foot free-standing campanile located on the University of Alabama Quad. Built in 1929 and named after president George H. Denny, it chimes the Westminster quarters every 15 minutes. The tower is one of the most recognizable landmarks on campus and is listed on the National Register of Historic Places.',
            photos: [
                { url: 'https://placehold.co/600x300/9E1B32/ffffff?text=Denny+Chimes', caption: 'Tower exterior' },
                { url: 'https://placehold.co/600x300/7a1526/ffffff?text=Denny+Chimes+2', caption: 'View from the Quad' },
                { url: 'https://placehold.co/600x300/5a0f1c/ffffff?text=Denny+Chimes+3', caption: 'Bell tower close-up' },
            ],
        },
    },
    {
        id: 'gorgas-library',
        label: 'Gorgas Library (single photo)',
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
        label: 'Coleman Coliseum (no photos)',
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
        label: 'Foster Auditorium (short desc only)',
        data: {
            name: 'Foster Auditorium',
            short_description: 'Historic site of the 1963 "Stand in the Schoolhouse Door."',
            photos: [],
        },
    },
];

// Approximate height of the navbar pill + its wrapper padding in pixels.
// Passed to ExploreCard so it knows how far above the navbar to float.
const NAVBAR_HEIGHT = 90;

function ExploreCardTester({ topBarHeight }) {
    const [selectedId, setSelectedId]   = useState(DUMMY_LANDMARKS[0].id);
    const [cardVisible, setCardVisible] = useState(false);
    const [detailOpen, setDetailOpen]   = useState(false);
    const [showNavbar, setShowNavbar]   = useState(true);
    const [navTab, setNavTab]           = useState('explore');

    const selected = DUMMY_LANDMARKS.find(l => l.id === selectedId);

    // ── Handlers ────────────────────────────────────────────────────────────

    // Tapping the card opens the detail view. The card is hidden at the same
    // time — it should NOT reappear after the detail view is closed.
    const handleCardTap = () => {
        setCardVisible(false);
        setDetailOpen(true);
    };

    // Swiping the card down dismisses it without opening the detail view.
    const handleCardDismiss = () => {
        setCardVisible(false);
    };

    // Closing the detail view returns to the idle state. The card stays hidden.
    const handleDetailClose = () => {
        setDetailOpen(false);
    };

    // The trigger button simulates the user walking near a landmark.
    const handleTrigger = () => {
        setDetailOpen(false);
        setCardVisible(true);
    };

    return (
        <div style={s.body}>

            {/* ── Landmark selector ─────────────────────────────────────── */}
            <div style={s.card}>
                <p style={s.label}>Landmark</p>
                <div style={s.pillRow}>
                    {DUMMY_LANDMARKS.map(l => (
                        <button
                            key={l.id}
                            style={{ ...s.pill, ...(selectedId === l.id ? s.pillActive : {}) }}
                            onClick={() => { setSelectedId(l.id); setCardVisible(false); }}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Options ───────────────────────────────────────────────── */}
            <div style={s.card}>
                <p style={s.label}>Options</p>
                <div style={s.pillRow}>
                    <button
                        style={{ ...s.pill, ...(showNavbar ? s.pillActive : {}) }}
                        onClick={() => setShowNavbar(v => !v)}
                    >
                        {showNavbar ? 'Navbar: visible' : 'Navbar: hidden'}
                    </button>
                </div>
            </div>

            {/* ── Trigger button ────────────────────────────────────────── */}
            <button style={s.triggerButton} onClick={handleTrigger}>
                Trigger Explore Card
            </button>

            <p style={s.hint}>
                Tap the card to open the detail view · Swipe it down to dismiss
            </p>

            {/* ── Navbar ────────────────────────────────────────────────── */}
            {showNavbar && (
                <div style={s.fixedNavbar}>
                    <Navbar activeTab={navTab} onTabChange={setNavTab} />
                </div>
            )}

            {/* ── Explore Card ──────────────────────────────────────────── */}
            {cardVisible && (
                <ExploreCard
                    landmark={selected.data}
                    onTap={handleCardTap}
                    onDismiss={handleCardDismiss}
                    navbarHeight={showNavbar ? NAVBAR_HEIGHT : 16}
                />
            )}

            {/* ── Landmark Detail View ──────────────────────────────────── */}
            {detailOpen && (
                <LandmarkDetailView
                    landmark={selected.data}
                    onClose={handleDetailClose}
                    topInset={topBarHeight}
                />
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
    body: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 200px',
        gap: '20px',
    },
    card: {
        width: '100%',
        maxWidth: '520px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    label: {
        margin: '0 0 12px',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#888',
    },
    pillRow: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    pill: {
        padding: '6px 14px',
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
    triggerButton: {
        padding: '12px 28px',
        borderRadius: '9999px',
        border: 'none',
        backgroundColor: '#9E1B32',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(158,27,50,0.35)',
    },
    hint: {
        margin: 0,
        fontSize: '12px',
        color: '#999',
        textAlign: 'center',
    },
    fixedNavbar: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
    },
};

export default ExploreCardTester;
