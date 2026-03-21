import { useState } from 'react';
import Navbar from '../components/navbar.jsx';
import LandmarkDetailView from '../components/landmarkDetailView.jsx';

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
        label: 'Foster Auditorium (short description only)',
        data: {
            name: 'Foster Auditorium',
            short_description: 'Historic site of the 1963 "Stand in the Schoolhouse Door."',
            photos: [],
        },
    },
];

function LandmarkDetailTester({ topBarHeight }) {
    const [selectedId, setSelectedId] = useState(DUMMY_LANDMARKS[0].id);
    const [isOpen, setIsOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(false);
    const [navTab, setNavTab] = useState('explore');

    const selected = DUMMY_LANDMARKS.find(l => l.id === selectedId);

    return (
        <div style={s.body}>
            <div style={s.card}>
                <p style={s.label}>Landmark</p>
                <div style={s.pillRow}>
                    {DUMMY_LANDMARKS.map(l => (
                        <button
                            key={l.id}
                            style={{ ...s.pill, ...(selectedId === l.id ? s.pillActive : {}) }}
                            onClick={() => setSelectedId(l.id)}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

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

            <button style={s.openButton} onClick={() => setIsOpen(true)}>
                Open Landmark Detail View
            </button>

            {showNavbar && (
                <div style={s.fixedNavbar}>
                    <Navbar activeTab={navTab} onTabChange={setNavTab} />
                </div>
            )}

            {isOpen && (
                <LandmarkDetailView
                    landmark={selected.data}
                    onClose={() => setIsOpen(false)}
                    topInset={topBarHeight}
                />
            )}
        </div>
    );
}

const s = {
    body: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 120px',
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
    openButton: {
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
    fixedNavbar: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
    },
};

export default LandmarkDetailTester;
