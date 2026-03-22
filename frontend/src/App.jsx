import { useState } from 'react';
import ExplorePage from './pages/ExplorePage.jsx';
import ListPage from './pages/ListPage.jsx';

function App() {
    const [activeTab, setActiveTab] = useState('explore');

    if (activeTab === 'list') {
        return <ListPage activeTab={activeTab} onTabChange={setActiveTab} />;
    }

    // Default: explore page. Tours / Contribute tab clicks set activeTab to
    // those values, but neither matches 'list', so the map stays visible.
    return <ExplorePage activeTab={activeTab} onTabChange={setActiveTab} />;
}

export default App;
