import {useState, useEffect, useRef} from "react";
import {ChevronRight, ChevronDown, RotateCcw} from 'lucide-react';
import MapPicker from "./mapPicker";

const API_BASE = 'https://ua-capstone-backend-845958693022.us-central1.run.app/api';

// ContributeView — multi-step form that lets users suggest new landmarks.
//   step 0: intro card explaining the process
//   step 1: the actual data-entry form
//   step 2: success confirmation (handled by ContributePage)
//   default: error fallback if the step counter somehow goes out of bounds
//
// Props:
//   step            — current step index, controlled by the parent (ContributePage)
//   onStepChange    — callback to advance or reset the step
//   contributeData  — form field values, lifted up to ContributePage
//   setContributeData — updater for contributeData
function ContributeView({step, onStepChange, contributeData, setContributeData}) {
    // Maps each step index to the title shown in the sticky header.
    const stepTitles = ['Contribute', 'Enter Information', 'Submitted','ERROR'];

    // Ref used to auto-resize the long-description textarea as the user types.
    const textareaRef = useRef(null);

    // Animation state — displayedStep lags one fade-cycle behind `step` so
    // the old screen can fade out before the new one fades in.
    // visible drives the opacity; when false the current content fades out,
    // then displayedStep updates and visible flips back to true.
    const [displayedStep, setDisplayedStep] = useState(step);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (step === displayedStep) return;
        // Both setState calls are in async callbacks (not synchronous in the
        // effect body) to satisfy the react-hooks/set-state-in-effect rule.
        // tOut fires on the next tick to start the fade-out; tIn fires after
        // 180 ms to swap the content and fade back in.
        const tOut = setTimeout(() => setVisible(false), 0);
        const tIn  = setTimeout(() => { setDisplayedStep(step); setVisible(true); }, 180);
        return () => { clearTimeout(tOut); clearTimeout(tIn); };
    }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

    // Per-field error flags — set to true on a failed submit attempt,
    // and cleared individually as the user corrects each field.
    const [errors, setErrors] = useState({
        loc_name: false,
        loc_type: false,
        loc_short_desc: false,
        loc_long_desc: false,
        loc_lat: false,
        loc_addr: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Checks all required fields before allowing the form to advance.
    // Sets the errors state so invalid fields are highlighted, and returns
    // false if any field is empty so the caller can bail out early.
    function validateAndSubmit() {
        const newErrors = {
            loc_name: contributeData.loc_name.trim() === '',
            loc_type: contributeData.loc_type === '',
            loc_short_desc: contributeData.loc_short_desc.trim() === '',
            loc_long_desc: contributeData.loc_long_desc.trim() === '',
            loc_lat: contributeData.loc_lat === null,   // null means the user hasn't tapped the map yet
            loc_addr: contributeData.loc_addr.trim() === '',
        };
        setErrors(newErrors);
        const hasErrors = Object.values(newErrors).some(v => v === true);

        return !hasErrors;
    }

    async function handleSubmit() {
        if (!validateAndSubmit()) return;

        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const res = await fetch(`${API_BASE}/landmarks/create/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:              contributeData.loc_name,
                    short_description: contributeData.loc_short_desc,
                    long_description:  contributeData.loc_long_desc,
                    category:          contributeData.loc_type,
                    lat:               contributeData.loc_lat,
                    lon:               contributeData.loc_lng,
                    address:           contributeData.loc_addr,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.detail || `Server error ${res.status}`);
            }

            setContributeData({
                loc_name: '',
                loc_type: '',
                loc_addr: '',
                loc_short_desc: '',
                loc_long_desc: '',
                loc_lat: null,
                loc_lng: null,
            });
            setErrors({
                loc_name: false,
                loc_type: false,
                loc_short_desc: false,
                loc_long_desc: false,
                loc_lat: false,
                loc_addr: false,
            });
            onStepChange(2);
        } catch (err) {
            console.error('Landmark submission failed:', err);
            setSubmitError(err.message || 'Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // Returns the JSX for the current step. Uses displayedStep (not the prop
    // `step`) so the old content stays visible during the fade-out phase.
    function renderScreen() {
        switch (displayedStep) {
            // ── Step 0: Intro ────────────────────────────────────────────────
            // Centered card that explains the contribution process and prompts
            // the user to start the form.
            case 0:
                return (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        // Extra bottom padding shifts the flex center upward so the
                        // card appears centered in the visible area between the
                        // sticky header and the floating navbar (≈100px tall).
                        padding: '3.5rem 3.5rem calc(3.5rem + 100px)',
                    }}>
                        <div className="cv-card">
                            <p className="cv-card-text">
                                Have a location that's missing from our map?
                                Submit it here!
                            </p>
                            <button className="cv-get-started-btn" onClick={() => onStepChange(1)}>
                                Get Started <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                );

            // ── Step 1: Data-entry form ──────────────────────────────────────
            // Scrollable form split into three sections: Name & Type,
            // Description, and Location. Each section uses cv-field-group to
            // pair a label with its input. cv-section-divider visually
            // separates sections; spacing between all elements is driven by
            // the cv-scroll-area gap (see components.css).
            case 1:
                return (
                    <div className="cv-scroll-area">
                        {/* ── Name & Type ── */}
                        <p className="cv-section-header">Name & Type</p>
                        <div className="cv-field-group">
                            <label htmlFor="landmark-name" className="cv-label-text">
                                Please enter the name of the location:
                            </label>
                            <input
                                id="landmark-name"
                                value={contributeData.loc_name}
                                onChange={(e) => {
                                    setContributeData({...contributeData, loc_name: e.target.value});
                                    // Clear the error for this field as soon as the user starts typing
                                    if (errors.loc_name) setErrors({...errors, loc_name: false});
                                }}
                                className={`cv-text-input${errors.loc_name ? ' cv-text-input--error' : ''}`}
                            />
                        </div>
                        <div className="cv-field-group">
                            <label htmlFor="landmark-type" className="cv-label-text">
                                And please select what type of location it is:
                            </label>
                            {/* Wrapper provides relative positioning for the custom ChevronDown icon */}
                            <div className="cv-dropdown-select-wrapper">
                                <select
                                    id="landmark-type"
                                    value={contributeData.loc_type}
                                    onChange={(e) => {
                                        setContributeData({...contributeData, loc_type: e.target.value});
                                        if (errors.loc_type) setErrors({...errors, loc_type: false});
                                    }}
                                    className={`cv-dropdown-select${errors.loc_type ? ' cv-dropdown-select--error' : ''}`}
                                >
                                    <option value="" disabled>Select a type...</option>
                                    <option value="dining">Dining</option>
                                    <option value="academic">Academic Building</option>
                                    <option value="library">Library</option>
                                    <option value="athletics">Athletic Facility</option>
                                    <option value="housing">Housing</option>
                                    <option value="poi">Point of Interest</option>
                                    <option value="generic">Other</option>
                                </select>
                                {/* Decorative icon — pointer-events: none in CSS lets clicks reach the <select> */}
                                <ChevronDown className="cv-dropdown-select-icon"/>
                            </div>
                        </div>
                        <div className="cv-section-divider"/>

                        {/* ── Description ── */}
                        <p className="cv-section-header">Description</p>
                        <div className="cv-field-group">
                            <label htmlFor="landmark-short-desc" className="cv-label-text">
                                Please give a short, single line description of the location:
                            </label>
                            <input
                                id="landmark-short-desc"
                                value={contributeData.loc_short_desc}
                                onChange={(e) => {
                                    setContributeData({...contributeData, loc_short_desc: e.target.value});
                                    if (errors.loc_short_desc) setErrors({...errors, loc_short_desc: false});
                                }}
                                className={`cv-text-input${errors.loc_short_desc ? ' cv-text-input--error' : ''}`}
                            />
                        </div>
                        <div className="cv-field-group">
                            <label htmlFor="landmark-long-desc" className="cv-label-text">
                                Please also give a longer, detailed description of the location. This should be about a paragraph:
                            </label>
                            {/* Auto-growing textarea: on every keystroke we reset the height to 'auto'
                                so the browser recalculates the natural scroll height, then set it
                                explicitly to that value — this creates a smooth expand-as-you-type effect. */}
                            <textarea
                                id="landmark-long-desc"
                                className={`cv-text-input${errors.loc_long_desc ? ' cv-text-input--error' : ''}`}
                                ref={textareaRef}
                                value={contributeData.loc_long_desc}
                                rows='8'
                                onChange={(e) => {
                                    setContributeData({...contributeData, loc_long_desc: e.target.value});
                                    if (errors.loc_long_desc) setErrors({...errors, loc_long_desc: false});
                                    textareaRef.current.style.height = 'auto';
                                    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                                }}
                            />
                        </div>

                        <div className="cv-section-divider"/>

                        {/* ── Location ── */}
                        <p className="cv-section-header">Location</p>
                        <div className="cv-field-group">
                            <label className="cv-label-text">
                                Please tap on the map where the location you are adding is:
                            </label>
                            {/* MapPicker renders a Leaflet map; the onLocationSelect callback stores
                                the chosen lat/lng into contributeData and clears the location error. */}
                            <div className={`cv-map-picker-container${errors.loc_lat ? ' cv-map-picker-container--error' : ''}`}>
                                <MapPicker onLocationSelect={(lat, lng) => {
                                    setContributeData({...contributeData, loc_lat: lat, loc_lng: lng});
                                    if (errors.loc_name) setErrors({...errors, loc_name: false});
                                }}
                            />
                            </div>
                        </div>
                        <div className="cv-field-group">
                            <label htmlFor="landmark-addr" className="cv-label-text">
                                Please enter the address of the location you are adding:
                            </label>
                            <input
                                id="landmark-addr"
                                value={contributeData.loc_addr}
                                onChange={(e) => {
                                    setContributeData({...contributeData, loc_addr: e.target.value})
                                    if (errors.loc_addr) setErrors({...errors, loc_addr: false})
                                }}
                                className={`cv-text-input${errors.loc_addr ? ' cv-text-input--error' : ''}`}
                            />
                        </div>

                        {/* Validation banner — only visible after a failed submit attempt */}
                        {Object.values(errors).some(v => v) && (
                            <p className="cv-error-message">
                                Please fill in all required fields before submitting.
                            </p>
                        )}

                        {submitError && (
                            <p className="cv-error-message">{submitError}</p>
                        )}

                        <button className="cv-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting…' : <> Submit <ChevronRight size={16}/> </>}
                        </button>
                    </div>
                )

            case 2:
                return (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '3.5rem 3.5rem calc(3.5rem + 100px)',
                    }}>
                        <div className="cv-card">
                            <p className="cv-card-text">
                                Thank you for your submission! 
                                Your suggestion will be reviewed by an administrator before being added to the map.
                            </p>
                            <button className="cv-get-started-btn" onClick={() => onStepChange(1)}>
                                Submit another <RotateCcw size={20}/>
                            </button>
                        </div>
                    </div>
                );

            // ── Default: error fallback ──────────────────────────────────────
            // Should never be visible to real users — shown only if the step
            // counter somehow receives a value other than 0, 1, or 2.
            default:
                return (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '3.5rem 3.5rem calc(3.5rem + 100px)',
                    }}>
                        <div className="cv-card">
                            <p className="cv-card-text">
                                The submission step counter has gone out of bounds! This message shouldn't be visible to users!!
                            </p>
                            <button className="cv-get-started-btn" onClick={() => onStepChange(0)}>
                                Reset step counter
                            </button>
                        </div>
                    </div>
                )
        }
    }

    // Shared transition style applied to both the header title and the screen
    // content so they fade (and lift slightly) in sync on every step change.
    const transitionStyle = {
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.18s ease, transform 0.18s ease',
    };

    // Root layout: sticky header + scrollable content area.
    // minHeight: 0 on the outer div is required for the inner cv-scroll-area
    // to shrink correctly inside a flex column parent.
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0}}>
            <header className="cv-header">
                <h1 className="cv-title" style={transitionStyle}>{stepTitles[displayedStep]}</h1>
            </header>
            {/* Wrapper applies the same fade/slide transition to all screen content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, ...transitionStyle }}>
                {renderScreen()}
            </div>
        </div>
    );
}

export default ContributeView;