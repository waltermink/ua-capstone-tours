import { useState, useRef, useLayoutEffect } from 'react';
import { LayoutGrid, BookOpen, Layers, MapPin, List } from 'lucide-react';
import NavbarTester from './testers/NavbarTester.jsx';
import LandmarkDetailTester from './testers/LandmarkDetailTester.jsx';
import ExploreCardTester from './testers/ExploreCardTester.jsx';
import PinCardTester from './testers/PinCardTester.jsx';
import ListViewTester from './testers/ListViewTester.jsx';

// ─── Tester Registry ──────────────────────────────────────────────────────────

const TESTERS = [
    { id: 'navbar',          label: 'Navbar',    icon: LayoutGrid, component: NavbarTester },
    { id: 'landmark-detail', label: 'Landmark',  icon: BookOpen,   component: LandmarkDetailTester },
    { id: 'explore-card',    label: 'Explore',   icon: Layers,     component: ExploreCardTester },
    { id: 'pin-card',        label: 'Pin Card',  icon: MapPin,     component: PinCardTester },
    { id: 'list-view',       label: 'List',      icon: List,       component: ListViewTester },
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
                    {TESTERS.map(t => {
                        const Icon = t.icon;
                        const isActive = activeTester === t.id;
                        return (
                            <button
                                key={t.id}
                                style={{ ...s.tabBtn, ...(isActive ? s.tabBtnActive : {}) }}
                                onClick={() => setActiveTester(t.id)}
                            >
                                <Icon size={16} />
                                <span style={s.tabLabel}>{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={s.content}>
                <ActiveComponent topBarHeight={topBarHeight} />
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
    // Shell fills exactly the viewport so PinCardTester's map area can use flex:1.
    // Each tester scrolls inside the `content` div if its content overflows.
    shell: {
        height: '100svh',
        backgroundColor: '#f0f0f0',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    topBar: {
        position: 'sticky',
        top: 0,
        zIndex: 200,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e5e5',
        padding: '10px 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        flexShrink: 0,
    },
    topBarTitle: {
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: '#9E1B32',
    },
    // Crimson pill container — mirrors the UA navbar pill visual language.
    tabRow: {
        display: 'flex',
        backgroundColor: '#9E1B32',
        borderRadius: '9999px',
        padding: '5px',
        gap: '4px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 4px 16px rgba(158,27,50,0.25)',
    },
    tabBtn: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '7px 4px',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        backgroundColor: 'transparent',
        color: 'rgba(255,255,255,0.7)',
        transition: 'background-color 0.2s ease, color 0.2s ease',
    },
    tabBtnActive: {
        backgroundColor: '#fff',
        color: '#9E1B32',
    },
    tabLabel: {
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    // Scrollable area beneath the sticky top bar. Each tester can overflow here.
    content: {
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
    },
};

export default ComponentTester;
