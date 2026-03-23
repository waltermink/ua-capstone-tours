import { useState } from 'react';
import Navbar from '../components/navbar.jsx';

const TABS = ['explore', 'tours', 'list', 'contribute'];

function NavbarTester() {
    const [activeTab, setActiveTab] = useState('explore');

    return (
        <div style={s.body}>
            <div style={s.card}>
                <p style={s.label}>Active tab: <strong>{activeTab}</strong></p>
                <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div style={s.card}>
                <p style={s.label}>Click a tab to activate</p>
                <div style={s.pillRow}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            style={{ ...s.pill, ...(activeTab === tab ? s.pillActive : {}) }}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ ...s.card, backgroundColor: '#2a2a2a' }}>
                <p style={{ ...s.label, color: '#aaa' }}>On a dark background</p>
                <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
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
};

export default NavbarTester;
