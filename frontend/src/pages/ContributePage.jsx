import Navbar from '../components/navbar.jsx';
import ContributeView from '../components/contributeView.jsx';

function ContributePage({ activeTab, onTabChange }) {
    return (
        <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
            <ContributeView/>
            <Navbar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
    );
}

export default ContributePage;
