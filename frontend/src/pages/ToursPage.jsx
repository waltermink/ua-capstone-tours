import Navbar from '../components/navbar.jsx';

function ToursPage({ activeTab, onTabChange }) {
    return (
        <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '2rem',
            }}>
                <h1 style={{
                    fontFamily: 'var(--font-trade-gothic)',
                    color: 'var(--ua-crimson)',
                    fontSize: '1.75rem',
                    margin: 0,
                }}>Tours</h1>
                <p style={{
                    fontFamily: 'var(--font-minion-pro)',
                    color: 'var(--ua-pachyderm)',
                    fontSize: '1rem',
                    margin: 0,
                    textAlign: 'center',
                }}>Coming soon</p>
            </div>
            <Navbar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
    );
}

export default ToursPage;
