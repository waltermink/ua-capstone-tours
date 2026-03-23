import { useState } from 'react';
import ExplorePage from './pages/ExplorePage.jsx';
import ListPage from './pages/ListPage.jsx';
import ToursPage from './pages/ToursPage.jsx';
import ContributePage from './pages/ContributePage.jsx';

function App() {
    const [activeTab, setActiveTab] = useState('explore');

    if (activeTab === 'list')        return <ListPage activeTab={activeTab} onTabChange={setActiveTab} />;
    if (activeTab === 'tours')       return <ToursPage activeTab={activeTab} onTabChange={setActiveTab} />;
    if (activeTab === 'contribute')  return <ContributePage activeTab={activeTab} onTabChange={setActiveTab} />;

    return <ExplorePage activeTab={activeTab} onTabChange={setActiveTab} />;
}

export default App;
