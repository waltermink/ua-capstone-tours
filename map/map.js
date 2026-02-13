let map;
let buildings = [];
let audio = new Audio();
let userMarker;

function initMap() { //leaflet's website is used for this section
    map = L.map("Map").setview([33.214, -87.545], 16)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);
}

function loadBuildings() {
    fetch("/api/buildings/")
    .then(res => res.json())
    .then(data=> {
        buildings = data.map(b => ({
            ...b, 
            triggered: false,
            marker: L.marker([b.latitude, b.longitude])
        }));
    });
}

function startTour() {
    navigator.geolocation.watchPosition(updatePosition, error, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
    });
}

function updatePosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    if (!userMarker) {
        userMarker = L.marker([lat, lon]).addTo(map);
    }
    else{
        userMarker.setLatLng([lat, lon]);
    }
    checkGeofences(lat, lon);
}