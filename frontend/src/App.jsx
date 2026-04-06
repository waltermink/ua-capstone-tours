import { useState } from 'react';
import ExplorePage from './pages/ExplorePage.jsx';
import ListPage from './pages/ListPage.jsx';
import ToursPage from './pages/ToursPage.jsx';
import ContributePage from './pages/ContributePage.jsx';

function App() {
    const [activeTab, setActiveTab] = useState('contribute');
    const [contributeStep, setContributeStep] = useState(0);
    const [contributeData, setContributeData] = useState({
        loc_name: '',
        loc_type: '',
        loc_addr: '',
        loc_short_desc: '',
        loc_long_desc: '',
        loc_lat: null,
        loc_lon: null,
    });

    if (activeTab === 'list')        return <ListPage activeTab={activeTab} onTabChange={setActiveTab} />;
    if (activeTab === 'tours')       return <ToursPage activeTab={activeTab} onTabChange={setActiveTab} />;
    if (activeTab === 'contribute')  return <ContributePage 
                                                activeTab={activeTab} 
                                                onTabChange={setActiveTab} 
                                                contributeStep={contributeStep}
                                                setContributeStep={setContributeStep}
                                                contributeData={contributeData}
                                                setContributeData={setContributeData}
                                            />;

    return <ExplorePage activeTab={activeTab} onTabChange={setActiveTab} />;
}

export default App;
