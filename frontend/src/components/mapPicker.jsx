import {useEffect, useRef} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-providers";

export default function MapPicker({onLocationSelect}) {
    const mapContainerRef = useRef(null); 
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const callbackRef = useRef(null);

    useEffect(() => {
        callbackRef.current = onLocationSelect;
    });

    useEffect(() => {
        if (mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([33.2098, -87.5692], 16);

        mapRef.current = map;

        L.tileLayer.provider('Stadia.AlidadeSmooth').addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    map.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
                },
                () => {
                    // Geolocation failed or denied — stay on campus fallback
                }
            );
        }

        map.on('click', (e) => {
            const {lat, lng} = e.latlng;
            const pinIcon = L.divIcon({
                className: '',
                html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20S24 21 24 12C24 5.373 18.627 0 12 0z" fill="#5F6A72"/>
                        <circle cx="12" cy="12" r="4" fill="white"/>
                        </svg>`,
                iconSize: [24, 32],
                iconAnchor: [12, 32],
            });

            if (markerRef.current) markerRef.current.remove();
            
            markerRef.current = L.marker([lat, lng], {icon: pinIcon}).addTo(map);
            callbackRef.current(lat, lng);
        });

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}