import { useState } from 'react';
import ListView from '../components/listView.jsx';
import LandmarkDetailView from '../components/landmarkDetailView.jsx';
import Navbar from '../components/navbar.jsx';

const DUMMY_LANDMARKS = [
    {
        id: 'denny-chimes',
        data: {
            name: 'Denny Chimes',
            short_description: 'The iconic bell tower standing at the heart of the Quad.',
            long_description:
                'Denny Chimes is a 115-foot free-standing campanile located on the University of Alabama Quad. Built in 1929 and named after president George H. Denny, it chimes the Westminster quarters every 15 minutes. The tower is one of the most recognizable landmarks on campus and is listed on the National Register of Historic Places.',
            photos: [
                { url: 'https://placehold.co/600x300/9E1B32/ffffff?text=Denny+Chimes',   caption: 'Tower exterior' },
                { url: 'https://placehold.co/600x300/7a1526/ffffff?text=Denny+Chimes+2', caption: 'View from the Quad' },
                { url: 'https://placehold.co/600x300/5a0f1c/ffffff?text=Denny+Chimes+3', caption: 'Bell tower close-up' },
            ],
        },
    },
    {
        id: 'gorgas-library',
        data: {
            name: 'Gorgas Library',
            short_description: 'The main library and academic hub of campus.',
            long_description:
                'Gorgas Library is the flagship library of the University of Alabama, named after Josiah Gorgas, university president and Confederate general. The building houses special collections, rare books, and university archives alongside modern research facilities.',
            photos: [
                { url: 'https://placehold.co/600x300/1a3a5c/ffffff?text=Gorgas+Library', caption: null },
            ],
        },
    },
    {
        id: 'coleman-coliseum',
        data: {
            name: 'Coleman Coliseum',
            short_description: 'Home of Alabama Crimson Tide basketball and gymnastics.',
            long_description:
                'Coleman Coliseum is a 15,383-seat multi-purpose arena that has hosted Alabama basketball since 1968. It also serves as the home of the renowned Alabama gymnastics program. The arena underwent a major renovation in 2014 to modernize facilities for both athletes and fans.',
            photos: [],
        },
    },
    {
        id: 'foster-auditorium',
        data: {
            name: 'Foster Auditorium',
            short_description: 'Historic site of the 1963 "Stand in the Schoolhouse Door."',
            photos: [],
        },
    },
    {
        id: 'presidents-mansion',
        data: {
            name: "President's Mansion",
            short_description: 'Antebellum home of UA presidents since 1841.',
            long_description:
                "The President's Mansion is a Greek Revival structure built in 1841 and one of the few buildings to survive the Civil War destruction of the campus. It continues to serve as the official residence of the university president and is a Tuscaloosa landmark.",
            photos: [
                { url: 'https://placehold.co/600x300/2e7d32/ffffff?text=Presidents+Mansion', caption: 'Front facade' },
            ],
        },
    },
    {
        id: 'bryant-denny-stadium',
        data: {
            name: 'Bryant-Denny Stadium',
            short_description: 'One of the largest college football stadiums in the country.',
            long_description:
                'Bryant-Denny Stadium is the home of Alabama Crimson Tide football. With a capacity of over 100,000, it is among the largest stadiums in the nation. The stadium was renamed in 1975 to honor legendary coach Paul "Bear" Bryant and president George Denny.',
            photos: [
                { url: 'https://placehold.co/600x300/9E1B32/ffffff?text=Bryant-Denny', caption: 'Aerial view' },
                { url: 'https://placehold.co/600x300/7a1526/ffffff?text=Bryant-Denny+2', caption: 'Game day' },
            ],
        },
    },
    {
        id: 'woods-quad',
        data: {
            name: 'Woods Quad',
            short_description: 'A quiet green space surrounded by historic academic buildings.',
            long_description:
                'Woods Quad is a smaller, tree-lined quadrangle adjacent to the main Quad. Named for Alva Woods, the first president of the University of Alabama, it provides a tranquil study area and is surrounded by some of the oldest buildings on campus.',
            photos: [],
        },
    },
    {
        id: 'amelia-gayle-gorgas-library',
        data: {
            name: 'McLure Education Library',
            short_description: 'Specialized library supporting the College of Education.',
            long_description:
                'The McLure Education Library serves students and faculty of the College of Education with curriculum materials, research databases, and study spaces. It provides resources for both undergraduate education majors and doctoral research.',
            photos: [
                { url: 'https://placehold.co/600x300/004d80/ffffff?text=McLure+Library', caption: null },
            ],
        },
    },
    {
        id: 'nott-hall',
        data: {
            name: 'Nott Hall',
            short_description: 'Houses the Culverhouse College of Business undergraduate programs.',
            long_description:
                'Nott Hall is a central facility for the Culverhouse College of Business, offering classrooms, faculty offices, and student services for undergraduate business students. The building is named for Josiah Clark Nott, a noted physician and Alabama alumnus.',
            photos: [],
        },
    },
    {
        id: 'tuscaloosa-amphitheater',
        data: {
            name: 'Moody Music Building',
            short_description: 'Home of the UA School of Music and its practice rooms.',
            long_description:
                'The Moody Music Building is the primary facility for the University of Alabama School of Music, featuring rehearsal halls, recording studios, practice rooms, and performance spaces. It hosts regular student and faculty recitals throughout the academic year.',
            photos: [
                { url: 'https://placehold.co/600x300/5a0f1c/ffffff?text=Moody+Music', caption: 'Recital hall' },
            ],
        },
    },
    {
        id: 'smith-hall',
        data: {
            name: 'Smith Hall',
            short_description: 'Natural history museum housing fossils and geological specimens.',
            long_description:
                'Smith Hall is home to the Alabama Museum of Natural History, the oldest natural history museum in Alabama. Its collections include dinosaur fossils, meteorites, Native American artifacts, and geological specimens from across the state.',
            photos: [
                { url: 'https://placehold.co/600x300/1a3a5c/ffffff?text=Smith+Hall', caption: 'Museum entrance' },
                { url: 'https://placehold.co/600x300/004d80/ffffff?text=Smith+Hall+2', caption: 'Fossil gallery' },
            ],
        },
    },
    {
        id: 'rose-administration',
        data: {
            name: 'Rose Administration Building',
            short_description: 'Central administrative hub of the university.',
            long_description:
                'The Rose Administration Building houses the offices of the provost, registrar, and other central administrative units. Named for Frank Rose, a former university president, it is a key point of contact for students navigating enrollment and academic affairs.',
            photos: [],
        },
    },
];

function ListViewTester({ topBarHeight }) {
    // The landmark whose detail view is open (null when closed).
    const [detailLandmark, setDetailLandmark] = useState(null);
    const [showNavbar, setShowNavbar]         = useState(true);
    const [navTab, setNavTab]                 = useState('list');

    const handleSelect = (landmark) => setDetailLandmark(landmark);
    const handleDetailClose = () => setDetailLandmark(null);

    return (
        <div style={s.body}>

            {/* ── Controls ────────────────────────────────────────────────── */}
            <div style={s.controls}>
                <button
                    style={{ ...s.pill, ...(showNavbar ? s.pillActive : {}) }}
                    onClick={() => setShowNavbar(v => !v)}
                >
                    {showNavbar ? 'Navbar: visible' : 'Navbar: hidden'}
                </button>
            </div>

            {/* ── List View ───────────────────────────────────────────────── */}
            <ListView
                landmarks={DUMMY_LANDMARKS.map(l => l.data)}
                onSelectLandmark={handleSelect}
            />

            {/* ── Navbar ──────────────────────────────────────────────────── */}
            {showNavbar && (
                <div style={s.fixedNavbar}>
                    <Navbar activeTab={navTab} onTabChange={setNavTab} />
                </div>
            )}

            {/* ── Landmark Detail View ─────────────────────────────────────── */}
            {detailLandmark && (
                <LandmarkDetailView
                    landmark={detailLandmark}
                    onClose={handleDetailClose}
                    topInset={topBarHeight}
                />
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
    // Flex column that fills the content area handed down by ComponentTester.
    // ListView's lv-scroll-area (flex: 1) fills the remaining height.
    body: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
    },
    controls: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '10px 16px',
        borderBottom: '1px solid #e5e5e5',
        backgroundColor: '#f8f8f8',
        flexShrink: 0,
    },
    pill: {
        padding: '6px 16px',
        borderRadius: '9999px',
        border: '1px solid #ccc',
        backgroundColor: '#fff',
        color: '#333',
        fontSize: '13px',
        cursor: 'pointer',
    },
    pillActive: {
        borderColor: '#9E1B32',
        backgroundColor: '#9E1B32',
        color: '#fff',
    },
    fixedNavbar: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
    },
};

export default ListViewTester;
