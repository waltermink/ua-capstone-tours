import Navbar from '../components/navbar.jsx';

function ListPage({ activeTab, onTabChange }) {
    return (
        <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ua-capstone-gray)',
                fontFamily: 'var(--font-trade-gothic-regular)',
                fontSize: '18px',
            }}>
                Coming Soon
            </div>
            <Navbar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
    );
}

export default ListPage;
