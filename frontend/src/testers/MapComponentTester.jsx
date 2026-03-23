import MapComponent from '../components/mapComponent.jsx';

// ─── MapComponent Tester ──────────────────────────────────────────────────────

export default function MapComponentTester({ topBarHeight }) {
    return (
        <div style={{ ...s.body, paddingTop: topBarHeight || 0 }}>

            {/* ── Info card ───────────────────────────────────────────────── */}
            <div style={s.card}>
                <span style={s.label}>Backend required</span>
                <div style={s.pillRow}>
                    <span style={s.pill}>Django API at http://localhost:8000</span>
                </div>
                <p style={s.note}>
                    Tiles load without a backend. Landmark markers and geolocation
                    proximity detection require the Django server to be running.
                </p>
            </div>

            {/* ── Map fills remaining space ────────────────────────────────── */}
            <div style={s.mapWrapper}>
                <MapComponent />
            </div>

        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
    body: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        gap: '12px',
        padding: '16px',
        boxSizing: 'border-box',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: '14px',
        padding: '14px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0,
    },
    label: {
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#888',
    },
    pillRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
    },
    pill: {
        fontSize: '13px',
        padding: '6px 14px',
        borderRadius: '9999px',
        border: '1.5px solid #e5e5e5',
        color: '#333',
        backgroundColor: '#fafafa',
    },
    note: {
        margin: 0,
        fontSize: '12px',
        color: '#999',
        lineHeight: 1.5,
    },
    mapWrapper: {
        flex: 1,
        minHeight: 0,
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
};
