document.addEventListener("DOMContentLoaded", function () {

  const transitBtn = document.getElementById("transit-details");
  const filterSubmit = document.getElementById("filter_submit");

  let currentIndex = 0;
  let currentResults = [];

  function renderCardsChunk(chunkSize = 5) {
    const container = document.querySelector(".cards-container");
    container.style.display = "grid";

    const slice = currentResults.slice(currentIndex, currentIndex + chunkSize);

    slice.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="images/new/20200728-ASPCapitolArea-0036-scaled.jpg" alt="Company Image">
        <div class="card-content">
          <h3>${item.agency_name}</h3>
          <p><strong>Region:</strong> ${item.agency_region}</p>
          <p><strong>County/Ward:</strong> ${item.county_ward}</p>
          <p><strong>Day:</strong> ${item.day_of_week} (${item.frequency})</p>
          <p><strong>Time:</strong> ${item.starting_time} – ${item.ending_time}</p>
          <p><strong>Appointment Only:</strong> ${item.by_appointment_only}</p>
          <p><strong>Distribution:</strong> ${item.distribution_models}</p>
          <p><strong>Food Format:</strong> ${item.food_format}</p>
          ${item.cultural_populations_served ? `<p><strong>Cultural Populations:</strong> ${item.cultural_populations_served}</p>` : ""}
          <p><strong>Location:</strong> ${item.latitude}, ${item.longitude}</p>
          <button type="button" id="transit-details" class="primary-button w-inline-block">
            <div class="button-bg"></div>
            <div class="button-text">Transit Details</div>
            <div class="button-icon-block">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 19 14" fill="none" class="button-icon">
                <path d="M18.5758 7.89493L14.4485 0.530929C14.3358 0.337808 14.1518 0.196676 13.9361 0.137929C13.7203 0.0791811 13.4901 0.107519 13.2951 0.216839C13.1 0.326159 12.9557 0.507714 12.8932 0.722401C12.8307 0.937088 12.8551 1.16773 12.961 1.36465L16.0818 6.93289L1.64709 2.86716C1.42939 2.80585 1.19626 2.83352 0.998971 2.94409C0.801683 3.05467 0.656401 3.23909 0.595085 3.45678C0.533769 3.67447 0.561443 3.90761 0.672018 4.10489C0.782593 4.30218 0.967011 4.44746 1.1847 4.50878L15.6195 8.57451L10.0512 11.6954C9.9515 11.749 9.86346 11.822 9.79223 11.91C9.72101 11.998 9.66803 12.0993 9.63638 12.2081C9.60474 12.3168 9.59506 12.4307 9.60792 12.5432C9.62078 12.6557 9.65592 12.7645 9.71128 12.8633C9.76664 12.9621 9.84112 13.0488 9.93037 13.1185C10.0196 13.1882 10.1219 13.2394 10.2311 13.2692C10.3404 13.2989 10.4544 13.3066 10.5667 13.2918C10.679 13.277 10.7871 13.24 10.8849 13.1829L18.2489 9.05556C18.4462 8.94497 18.5914 8.76058 18.6527 8.54293C18.714 8.32528 18.6864 8.0922 18.5758 7.89493Z" fill="currentColor"></path>
              </svg>
            </div>
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    currentIndex += chunkSize;

    if (currentIndex >= currentResults.length) {
      document.getElementById("load-more").style.display = "none";
    }
  }

  document.getElementById("load-more").addEventListener("click", () => {
    renderCardsChunk();
  });

  filterSubmit.addEventListener("click", async (e) => {
    e.preventDefault();
  
    const form = document.querySelector(".wf-form");

    const getCheckedValues = (name) =>
      Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
  
    const data = {
      address: form.querySelector("#address")?.value,
      radius: form.querySelector("#radius")?.value,
      culture: form.querySelector("#culture")?.value,
      diet: getCheckedValues("diet"),
      distribution: getCheckedValues("distribution"),
      idinfo: getCheckedValues("idinfo"),
      dayofweek: getCheckedValues("dayofweek")
    };  
  
    const res = await fetch('http://localhost:3000/explore', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
  
    const results = await res.json();
    console.log(results); // TODO: display results in your UI
    // renderCards(results.slice(0, 8));
    currentResults = results;
    currentIndex = 0;
    document.querySelector(".cards-container").innerHTML = ""; // Clear old results
    document.getElementById("load-more").style.display = "block"; // Show button again if hidden
    renderCardsChunk();
  });

  function renderCards(results) {
    const container = document.querySelector(".cards-container");
    container.innerHTML = ""; // Clear previous cards
    container.style.display = "grid"; // Show the container
  
    results.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
  
      card.innerHTML = `
        <img src="images/new/20200728-ASPCapitolArea-0036-scaled.jpg" alt="Company Image">
        <div class="card-content">
          <h3>${item.agency_name}</h3>
          <p><strong>Region:</strong> ${item.agency_region}</p>
          <p><strong>County/Ward:</strong> ${item.county_ward}</p>
          <p><strong>Day:</strong> ${item.day_of_week} (${item.frequency})</p>
          <p><strong>Time:</strong> ${item.starting_time} – ${item.ending_time}</p>
          <p><strong>Appointment Only:</strong> ${item.by_appointment_only}</p>
          <p><strong>Distribution:</strong> ${item.distribution_models}</p>
          <p><strong>Food Format:</strong> ${item.food_format}</p>
          ${item.cultural_populations_served ? `<p><strong>Cultural Populations:</strong> ${item.cultural_populations_served}</p>` : ""}
          <p><strong>Location:</strong> ${item.latitude}, ${item.longitude}</p>
          <button type="button" id="transit-details" class="primary-button w-inline-block">
            <div class="button-bg"></div>
            <div class="button-text">Transit Details</div>
            <div class="button-icon-block">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 19 14" fill="none" class="button-icon">
                <path d="M18.5758 7.89493L14.4485 0.530929C14.3358 0.337808 14.1518 0.196676 13.9361 0.137929C13.7203 0.0791811 13.4901 0.107519 13.2951 0.216839C13.1 0.326159 12.9557 0.507714 12.8932 0.722401C12.8307 0.937088 12.8551 1.16773 12.961 1.36465L16.0818 6.93289L1.64709 2.86716C1.42939 2.80585 1.19626 2.83352 0.998971 2.94409C0.801683 3.05467 0.656401 3.23909 0.595085 3.45678C0.533769 3.67447 0.561443 3.90761 0.672018 4.10489C0.782593 4.30218 0.967011 4.44746 1.1847 4.50878L15.6195 8.57451L10.0512 11.6954C9.9515 11.749 9.86346 11.822 9.79223 11.91C9.72101 11.998 9.66803 12.0993 9.63638 12.2081C9.60474 12.3168 9.59506 12.4307 9.60792 12.5432C9.62078 12.6557 9.65592 12.7645 9.71128 12.8633C9.76664 12.9621 9.84112 13.0488 9.93037 13.1185C10.0196 13.1882 10.1219 13.2394 10.2311 13.2692C10.3404 13.2989 10.4544 13.3066 10.5667 13.2918C10.679 13.277 10.7871 13.24 10.8849 13.1829L18.2489 9.05556C18.4462 8.94497 18.5914 8.76058 18.6527 8.54293C18.714 8.32528 18.6864 8.0922 18.5758 7.89493Z" fill="currentColor"></path>
              </svg>
            </div>
          </button>
        </div>
      `;
  
      container.appendChild(card);
    });
  }
  

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
