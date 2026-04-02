import { useState } from "react";
import {ChevronRight, PlusCircle} from 'lucide-react';

function ContributeView() {
    const [step, setStep] = useState(0);

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
                            <button className="cv-get-started-btn" onClick={() => setStep(1)}>
                                Get Started <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                )
            default:
                return null;
        }
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header className="cv-header">
                <h1 className="cv-title">Contribute</h1>
            </header>
            {renderScreen()}
        </div>
    );
}

export default ContributeView;