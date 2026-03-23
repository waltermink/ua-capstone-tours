import { Map, Route, List, PlusCircle } from 'lucide-react';

const TABS = [
    { id: 'explore',    label: 'Explore',    icon: Map },
    { id: 'tours',      label: 'Tours',      icon: Route },
    { id: 'list',       label: 'List',       icon: List },
    { id: 'contribute', label: 'Contribute', icon: PlusCircle },
];

function Navbar({ activeTab, onTabChange }) {
    return (
        <div className="navbar-wrapper">
            <div className="navbar-pill">
                {TABS.map(({id, label, icon: Icon}) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`navbar-tab${isActive ? ' navbar-tab--active' : ''}`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className="navbar-tab-label">{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default Navbar;
