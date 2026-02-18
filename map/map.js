// Initialize map (default to campus center — change if needed)
const map = L.map('map').setView([33.2148, -87.5458], 15);

// OpenStreetMap tiles
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Fetch landmarks from your Django API
fetch('/api/landmarks/')
    .then(response => response.json())
    .then(data => {
        data.forEach(landmark => {
            const marker = L.marker([landmark.lat, landmark.lon]).addTo(map);

            let popupContent = `
                <strong>${landmark.name}</strong><br>
                ${landmark.short_description || ""}
            `;

            if (landmark.cover_photo_url) {
                popupContent += `
                    <br>
                    <img src="${landmark.cover_photo_url}" alt="${landmark.name}">
                `;
            }

            if (landmark.distance_m !== undefined && landmark.distance_m !== null) {
                popupContent += `<br><em>${Math.round(landmark.distance_m)} meters away</em>`;
            }

            marker.bindPopup(popupContent);
        });
    })
    .catch(error => console.error('Error loading landmarks:', error));
