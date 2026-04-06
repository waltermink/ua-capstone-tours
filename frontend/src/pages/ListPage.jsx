import { useState, useEffect, useRef } from 'react';
import ListView from '../components/listView.jsx';
import LandmarkDetailView from '../components/landmarkDetailView.jsx';
import Navbar from '../components/navbar.jsx';

const API_BASE = 'https://ua-capstone-backend-845958693022.us-central1.run.app/api';

function ListPage({ activeTab, onTabChange }) {
    const [landmarks, setLandmarks]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(false);
    const [detailLandmark, setDetailLandmark] = useState(null);
    const detailCache = useRef(new Map());

    useEffect(() => {
        fetch(`${API_BASE}/landmarks/full/`)
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(data => { setLandmarks(data); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, []);

    async function fetchDetail(id) {
        if (detailCache.current.has(id)) return detailCache.current.get(id);
        const res = await fetch(`${API_BASE}/landmarks/${id}/`);
        if (!res.ok) throw new Error(`Landmark ${id} fetch failed: ${res.status}`);
        const data = await res.json();
        detailCache.current.set(id, data);
        return data;
    }

    const handleSelect = async (landmark) => {
        if (!landmark.id) return;
        try {
            const full = await fetchDetail(landmark.id);
            setDetailLandmark(full);
        } catch (err) {
            console.error('Detail fetch failed:', err);
        }
    };

    return (
        <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
            <header className="lp-header">
                <h1 className="lp-title">Landmarks</h1>
            </header>

            {loading && <div className="lp-status">Loading…</div>}
            {error   && <div className="lp-status">Could not load landmarks.</div>}
            {!loading && !error && (
                <ListView landmarks={landmarks} onSelectLandmark={handleSelect} />
            )}

            {detailLandmark && (
                <LandmarkDetailView
                    landmark={detailLandmark}
                    onClose={() => setDetailLandmark(null)}
                />
            )}

            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 820 }}>
                <Navbar activeTab={activeTab} onTabChange={onTabChange} />
            </div>
        </div>
    );
}

export default ListPage;
