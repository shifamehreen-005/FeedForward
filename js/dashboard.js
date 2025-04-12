document.addEventListener("DOMContentLoaded", () => {
  function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    filterSection.classList.toggle('active');
  }

  const map = L.map('map');
  window.map = map; // Make map accessible globally

  // 1. Try to get user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13);

        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here!")
          .openPopup();
      },
      () => {
        console.warn("Geolocation failed or was denied, using fallback location.");
        map.setView([38.9072, -77.0369], 11); // Default: DC
      }
    );
  } else {
    console.warn("Geolocation not supported, using fallback location.");
    map.setView([38.9072, -77.0369], 11); // Default: DC
  }

  // 2. Load map tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 3. Fetch and add agency markers
  fetch('http://localhost:3000/api/agencies')
    .then(res => res.json())
    .then(agencies => {
      const heatPoints = [];

      agencies.forEach(agency => {
        const lat = parseFloat(agency.latitude);
        const lng = parseFloat(agency.longitude);
        const possibleWeights = [0.1, 0.4, 0.7, 1.0];
        const weight = possibleWeights[Math.floor(Math.random() * possibleWeights.length)];

        if (!isNaN(lat) && !isNaN(lng)) {
          L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`<strong>${agency.agency_name}</strong><br>ID: ${agency.agency_id}<br>Insecurity Index: ${weight}`);
          heatPoints.push([lat, lng, weight]);
        }
      });

      L.heatLayer(heatPoints, {
        radius: 100,
        blur: 50,
        maxZoom: 16,
        gradient: {
          0.1: 'blue',
          0.4: 'lime',
          0.7: 'orange',
          1.0: 'red'
        }
      }).addTo(map);
    })
    .catch(err => {
      console.error("Failed to load agency data", err);
    });

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

  let circle;
  const radiusSlider = document.getElementById('radius');
  const radiusNumber = document.getElementById('radius-number');

  function milesToMeters(miles) {
    return miles * 1609.34;
  }

  function updateRadiusCircle(miles) {
    if (circle && map) {
      circle.setRadius(milesToMeters(miles));
    }
  }

  addressInput.addEventListener('change', () => {
    const selectedValue = addressInput.value;
    const match = addressResults.find(r => r.label === selectedValue);
    if (match) {
      const [lon, lat] = match.coords;

      map.setView([lat, lon], 14);
      L.marker([lat, lon]).addTo(map).bindPopup(selectedValue).openPopup();

      if (circle) {
        map.removeLayer(circle);
      }

      circle = L.circle([lat, lon], {
        radius: milesToMeters(radiusSlider.value),
        color: '#007BFF',
        fillColor: '#007BFF',
        fillOpacity: 0.2
      }).addTo(map);
    }
  });

  // Sync number → slider
  radiusNumber.addEventListener('input', () => {
    let val = Math.min(Math.max(1, radiusNumber.value), 100);
    radiusSlider.value = val;
    updateRadiusCircle(val);
  });

  // Sync slider → number
  radiusSlider.addEventListener('input', () => {
    radiusNumber.value = radiusSlider.value;
    updateRadiusCircle(radiusSlider.value);
  });
});