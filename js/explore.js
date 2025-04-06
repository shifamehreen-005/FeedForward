// Toggle filter visibility function
function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    filterSection.classList.toggle('active');
  }
  
  // Initialize the map
  window.map = L.map('map').setView([37.7749, -122.4194], 10);  // Default to San Francisco
  
  // Add OpenStreetMap layer to the map
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  
  // Initialize the address input and results storage
  const addressInput = document.getElementById('address');
  const datalist = document.getElementById('address-suggestions');
  let addressResults = [];
  
  // Function to fetch address suggestions
  addressInput.addEventListener('input', async () => {
    const query = addressInput.value;
    if (query.length < 3) return;  // Only fetch results if the query length is 3 or more
  
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
  
  // Function to handle address selection from the input field
  addressInput.addEventListener('change', () => {
    const selectedValue = addressInput.value;
    const match = addressResults.find(r => r.label === selectedValue);
    if (match && window.map) {
      const [lon, lat] = match.coords;
  
      // Update map center and place a marker
      window.map.setView([lat, lon], 14);
      L.marker([lat, lon]).addTo(window.map).bindPopup(selectedValue).openPopup();
  
      // Draw radius circle if the slider value is set
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
  
  // Function to convert miles to meters for the circle radius
  function milesToMeters(miles) {
    return miles * 1609.34;
  }
  
  // Handle slider and number input for radius
  let circle;
  const radiusSlider = document.getElementById('radius');
  const radiusNumber = document.getElementById('radius-number');
  
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
  
  // Update radius circle function
  function updateRadiusCircle(miles) {
    if (circle && window.map) {
      circle.setRadius(milesToMeters(miles));
    }
  }
  
  // Predefined locations for markers (can be dynamic later)
  const locations = [
    { coords: [37.7749, -122.4194], text: "San Francisco, CA" },
    { coords: [37.3382, -121.8863], text: "San Jose, CA" },
    { coords: [37.8044, -122.2711], text: "Oakland, CA" }
  ];
  
  // Add predefined markers to the map
  locations.forEach(function(location) {
    L.marker(location.coords).addTo(window.map)
      .bindPopup(location.text);
  });
  