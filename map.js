// Wait until page loads
document.addEventListener("DOMContentLoaded", function () {

    // 1. Create the map
    const map = L.map('map').setView([39.8283, -98.5795], 4);

    // 2. Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 3. Load JSON file
    fetch('points.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {

            data.forEach(point => {

                L.marker([point.lat, point.lng])
                    .addTo(map)
                    .bindPopup(`
                        <b>${point.name}</b><br>
                        ${point.description}
                    `);

            });

        })
        .catch(error => console.error("Error loading JSON:", error));

});
