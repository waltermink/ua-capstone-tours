// Wait until page loads
document.addEventListener("DOMContentLoaded", function () {

    // 1. Create the map
    const map = L.map('map').setView([39.8283, -98.5795], 4);

    // 2. Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 3. Load landmarks from Django API
    fetch('https://ua-capstone-backend-845958693022.us-central1.run.app/api/landmarks/')
        .then(response => response.json())
        .then(data => {

            data.forEach(point => {

                // Store marker reference on the point so proximity code can open it
                point._marker = L.marker([point.lat, point.lon])  // API returns "lon" not "lng"
                    .addTo(map)
                    .bindPopup(`
                        <b>${point.name}</b><br>
                        ${point.short_description}
                    `);                                            // API returns "short_description" not "description"

            });

            startTracking(data);

        })
        .catch(error => console.error("Error loading JSON:", error));


    function startTracking(points) {
        if (!navigator.geolocation) {
            console.warn("Geolocation not supported.");
            return;
        }

        const triggered = new Set(); // prevents a popup re-firing every second

        let userMarker = null;

        navigator.geolocation.watchPosition(function(pos) {
            const { latitude: lat, longitude: lng } = pos.coords;

            if (!userMarker) {
                // First time we have a position — create the blue dot marker
                const userIcon = L.divIcon({
                    className: '',
                    html: `<div style="
                        width: 16px;
                        height: 16px;
                        background: #3b82f6;
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
                    "></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]  // centers the dot on the exact coordinate
                });
                userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindTooltip('You are here');
            } else {
                // Dot already exists — just move it to the new position
                userMarker.setLatLng([lat, lng]);
            }

            points.forEach(point => {
                if (triggered.has(point.name)) return;

                const dist = getDistanceMeters(lat, lng, point.lat, point.lon);  // API returns "lon" not "lng"
                const radius = point.proximity_radius || 50; // meters

                if (dist <= radius) {
                    triggered.add(point.name);
                    point._marker.openPopup();
                }
            });

        }, function(err) {
            console.error("Location error:", err.message);
        }, {
            enableHighAccuracy: true,
            maximumAge: 5000
        });
    }

    // Haversine formula — calculates real-world distance between two GPS coords
    function getDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

});
