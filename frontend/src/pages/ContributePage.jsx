import Navbar from '../components/navbar.jsx';
import ContributeView from '../components/contributeView.jsx';

function ContributePage({activeTab, onTabChange, contributeStep, setContributeStep, contributeData, setContributeData}) {
    return (
        <div style={{ height: '100svh', display: 'flex', flexDirection: 'column'}}>
            <ContributeView 
                step={contributeStep} 
                onStepChange={setContributeStep}
                contributeData={contributeData}
                setContributeData={setContributeData}
            />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 820 }}>
                <Navbar activeTab={activeTab} onTabChange={onTabChange} />
            </div>
        </div>
    );
}

export default ContributePage;
