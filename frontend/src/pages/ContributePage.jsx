import Navbar from '../components/navbar.jsx';
import ContributeView from '../components/contributeView.jsx';

function ContributePage({activeTab, onTabChange, contributeStep, setContributeStep, contributeData, setContributeData}) {
    return (
        <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
            <ContributeView 
                step={contributeStep} 
                onStepChange={setContributeStep}
                contributeData={contributeData}
                setContributeData={setContributeData}
            />
            <Navbar activeTab={activeTab} onTabChange={onTabChange} />
        </div>
    );
}

export default ContributePage;
