document.addEventListener("DOMContentLoaded", function () {

  const transitBtn = document.getElementById("transit-details");
  const filterSubmit = document.getElementById("filter_submit");
  const cardsContainer = document.querySelector(".cards-container");

  filterSubmit.addEventListener("click", function () {
    cardsContainer.style.display = "block";
    cardsContainer.scrollIntoView({ behavior: "smooth" });
  });

  transitBtn.addEventListener("click", () => {
    document.getElementById("leaflet-map").style.display = "none";
    document.getElementById("google-map").style.display = "block";
    initMap();
  });
  
  // Toggle filter visibility function
  function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    filterSection.classList.toggle('active');
  }
  window.toggleFilters = toggleFilters; // Make it globally accessible if needed

  // Initialize the map
  window.map = L.map('leaflet-map').setView([37.7749, -122.4194], 10);  // Default to San Francisco

  // Add OpenStreetMap layer to the map
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(window.map);

  // Predefined locations for markers
  const locations = [
    { coords: [37.7749, -122.4194], text: "San Francisco, CA" },
    { coords: [37.3382, -121.8863], text: "San Jose, CA" },
    { coords: [37.8044, -122.2711], text: "Oakland, CA" }
  ];

  // Add predefined markers to the map
  locations.forEach(function(location) {
    L.marker(location.coords).addTo(window.map).bindPopup(location.text);
  });

  // Address input logic
  const addressInput = document.getElementById('address');
  const datalist = document.getElementById('address-suggestions');
  let addressResults = [];

  addressInput.addEventListener('input', async () => {
    const query = addressInput.value;
    if (query.length < 3) return;

    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      datalist.innerHTML = '';
      addressResults = [];

      data.features.forEach(feature => {
        const name = feature.properties.name || '';
        const street = feature.properties.street || '';
        const city = feature.properties.city || '';
        const country = feature.properties.country || '';
        const fullAddress = [name, street, city, country].filter(Boolean).join(', ');

        const option = document.createElement('option');
        option.value = fullAddress;
        datalist.appendChild(option);

        addressResults.push({
          label: fullAddress,
          coords: feature.geometry.coordinates
        });
      });
    } catch (err) {
      console.error('Error loading address suggestions:', err);
    }
  });

  addressInput.addEventListener('change', () => {
    const selectedValue = addressInput.value;
    const match = addressResults.find(r => r.label === selectedValue);
    if (match && window.map) {
      const [lon, lat] = match.coords;

      window.map.setView([lat, lon], 14);
      L.marker([lat, lon]).addTo(window.map).bindPopup(selectedValue).openPopup();

      if (circle) {
        window.map.removeLayer(circle);
      }

      circle = L.circle([lat, lon], {
        radius: milesToMeters(radiusSlider.value),
        color: '#007BFF',
        fillColor: '#007BFF',
        fillOpacity: 0.2
      }).addTo(window.map);
    }
  });

  function milesToMeters(miles) {
    return miles * 1609.34;
  }

  // Radius control
  let circle;
  const radiusSlider = document.getElementById('radius');
  const radiusNumber = document.getElementById('radius-number');

  radiusNumber.addEventListener('input', () => {
    let val = Math.min(Math.max(1, radiusNumber.value), 100);
    radiusSlider.value = val;
    updateRadiusCircle(val);
  });

  radiusSlider.addEventListener('input', () => {
    radiusNumber.value = radiusSlider.value;
    updateRadiusCircle(radiusSlider.value);
  });

  function updateRadiusCircle(miles) {
    if (circle && window.map) {
      circle.setRadius(milesToMeters(miles));
    }
  }
});

function initMap() {
  const directionsService = new google.maps.DirectionsService();
  const map = new google.maps.Map(document.getElementById("google-map"), {
    zoom: 14,
    center: { lat: 38.98, lng: -76.94 },
  });

  const points = {
    A: { lat: 38.992271, lng: -76.934361 },           // Walk Start
    B: { lat: 38.99238120873557, lng: -76.9334509612648 }, // Bus Start
    C: { lat: 38.97815148541904, lng: -76.92758240998751 }, // Subway Start
    D: { lat: 38.95567864752957, lng: -76.96897303782839 }, // Walk Start
    E: { lat: 38.9542534204, lng: -76.9652870101 },         // Final destination
  };

  const markers = {
    A: new google.maps.Marker({ position: points.A, map, label: "A", title: "Start Walk" }),
    B: new google.maps.Marker({ position: points.B, map, label: "B", title: "Bus Stop: Navahoe Rd" }),
    C: new google.maps.Marker({ position: points.C, map, label: "C", title: "Metro Station: College Park-U of MD" }),
    D: new google.maps.Marker({ position: points.D, map, label: "D", title: "West Hyattsville Metro" }),
    E: new google.maps.Marker({ position: points.E, map, label: "E", title: "Destination: Kirkwood" }),
  };

  // Helper to draw route with custom color
  function drawRoute(origin, destination, mode, color) {
    directionsService.route(
      { origin, destination, travelMode: mode },
      (result, status) => {
        if (status === "OK") {
          const isWalking = mode === "WALKING";
          const path = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 4,
            geodesic: true,
            ...(isWalking && {
              strokeOpacity: 0,
              icons: [{
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 4,
                },
                offset: "0",
                repeat: "15px",
              }],
            }),
          });
          path.setMap(map);
        } else {
          console.error(`Route error: ${status}`);
        }
      }
    );
  }

  drawRoute(points.A, points.B, "WALKING", "#2a9d8f");    // Walk 1: Teal
  drawRoute(points.B, points.C, "TRANSIT", "#e76f51");    // Bus: Coral
  drawRoute(points.C, points.D, "TRANSIT", "#264653");    // Subway: Dark Greenish
  drawRoute(points.D, points.E, "WALKING", "#2a9d8f");    // Walk 2: Teal
}
