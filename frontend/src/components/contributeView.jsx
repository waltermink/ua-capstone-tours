import {useState} from "react";
import {ChevronRight, PlusCircle} from 'lucide-react';

function ContributeView({step, onStepChange, contributeData, setContributeData}) {
    const stepTitles = [
        'Contribute',
        'Name & Type',
        'Location',
        'Description',
        'Review & Submit',
    ];

    function renderScreen() {
        switch (step) {
            case 0:
                return (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '3.5rem',
                    }}>
                        <div className="cv-card">
                            <p className="cv-card-text">
                                Have a location that's missing from our map? 
                                Submit it here — your suggestion will be reviewed by an administrator before being added.
                            </p>
                            <button className="cv-get-started-btn" onClick={() => onStepChange(1)}>
                                Get Started <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        gap: '0.5rem',
                        padding: '1rem',
                    }}>
                        <div className="cv-field-group">
                            <label 
                                htmlFor="landmark-name"
                                className="cv-label-text"
                            >
                                Please enter the name of the location:
                            </label>
                            <input 
                                id="landmark-name" 
                                value={contributeData.loc_name}
                                onChange={(e) => setContributeData({...contributeData, loc_name: e.target.value})}
                                className="cv-text-input-small"
                            />
                        </div>
                        <div className="cv-field-group">
                            <label 
                                htmlFor="landmark-type"
                                className="cv-label-text"
                            >
                                And please select what type of location it is:
                            </label>
                            <select
                                id="landmark-type"
                                value={contributeData.loc_type}
                                onChange={(e) => setContributeData({...contributeData, loc_type: e.target.value})}
                                className="cv-dropdown-select"
                            >
                                <option value="" disabled>Select a type...</option>
                                <option value="dining">Dining - restaurants, dining halls, & other places to eat</option>
                                <option value="academic">Academic Building - lecture halls, labratories, & more</option>
                                <option value="library">Library - Places to read, study, & work</option>
                                <option value="athletics">Athletic Facility - gyms, courts, running tracks, & more</option>
                                <option value="housing">Housing - dormitories & apartments</option>
                                <option value="poi">Point of Interest - stautes, landmarks, & locations of note</option>
                                <option value="generic">Generic - any location that doesn't fall under the other categories</option>
                            </select>
                        </div>
                    </div>
                )
            default:
                return (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '3.5rem',
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

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header className="cv-header">
                <h1 className="cv-title">{stepTitles[step]}</h1>
            </header>
            {renderScreen()}
        </div>
    );
}

export default ContributeView;