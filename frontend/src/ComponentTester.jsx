import { useState, useRef, useLayoutEffect } from 'react';
import NavbarTester from './testers/NavbarTester.jsx';
import LandmarkDetailTester from './testers/LandmarkDetailTester.jsx';
import ExploreCardTester from './testers/ExploreCardTester.jsx';

// ─── Tester Registry ──────────────────────────────────────────────────────────

const TESTERS = [
    { id: 'navbar',          label: 'Navbar',               component: NavbarTester },
    { id: 'landmark-detail', label: 'Landmark Detail View', component: LandmarkDetailTester },
    { id: 'explore-card',    label: 'Explore Card',         component: ExploreCardTester },
];

// ─── Root Tester Shell ────────────────────────────────────────────────────────

function ComponentTester() {
    const [activeTester, setActiveTester] = useState(TESTERS[0].id);
    const [topBarHeight, setTopBarHeight] = useState(0);
    const topBarRef = useRef(null);

    useLayoutEffect(() => {
        if (topBarRef.current) {
            setTopBarHeight(topBarRef.current.offsetHeight);
        }
    }, []);

    const ActiveComponent = TESTERS.find(t => t.id === activeTester).component;

    return (
        <div style={s.shell}>
            <div ref={topBarRef} style={s.topBar}>
                <span style={s.topBarTitle}>Component Tester</span>
                <div style={s.tabRow}>
                    {TESTERS.map(t => (
                        <button
                            key={t.id}
                            style={{ ...s.tabBtn, ...(activeTester === t.id ? s.tabBtnActive : {}) }}
                            onClick={() => setActiveTester(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <ActiveComponent topBarHeight={topBarHeight} />
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
    shell: {
        minHeight: '100vh',
        backgroundColor: '#f0f0f0',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
    },
    topBar: {
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    topBarTitle: {
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#9E1B32',
    },
    tabRow: {
        display: 'flex',
        gap: '8px',
    },
    tabBtn: {
        padding: '7px 18px',
        borderRadius: '9999px',
        border: '2px solid #ddd',
        backgroundColor: '#fff',
        color: '#555',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    tabBtnActive: {
        borderColor: '#9E1B32',
        backgroundColor: '#9E1B32',
        color: '#fff',
    },
};

export default ComponentTester;
