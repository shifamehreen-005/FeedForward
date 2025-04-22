document.addEventListener("DOMContentLoaded", async () => {
  let userLat = null;
  let userLon = null;
  
  try {
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by your browser.");
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });

    userLat = position.coords.latitude;
    userLon = position.coords.longitude;
  } catch (error) {
    console.error("Error getting user location:", error);
  }

  const filterSubmit = document.getElementById("filter_submit");
  const summaryContainer = document.getElementById("summary");

  async function extractLegInfo(legs) {
    return legs.map(leg => ({
      fromLat: leg.from?.lat,
      fromLon: leg.from?.lon,
      toLat: leg.to?.lat,
      toLon: leg.to?.lon,
      mode: leg.mode
    }));
  }

  async function getTransitPlan(userLat, userLon, foodBankLat, foodBankLon) {
    try {
        // Validate input
        if (![userLat, userLon, foodBankLat, foodBankLon].every(coord => typeof coord === 'number')) {
            return JSON.stringify([{
                error: "All coordinates must be numbers: userLat, userLon, foodBankLat, foodBankLon."
            }]);
        }

        // Set fixed departure time to April 15, 2025, 4:30 PM EST
        const departureTime = new Date('2025-04-15T16:30:00-04:00');
        const dateStr = departureTime.toISOString().split('T')[0]; // "2025-04-15"
        const timeStr = "16:30"; // 24-hour format

        const params = new URLSearchParams({
            fromPlace: `${userLat},${userLon}`,
            toPlace: `${foodBankLat},${foodBankLon}`,
            numItineraries: 1,
            date: dateStr,
            time: timeStr,
            mode: "TRANSIT,WALK",
            arriveBy: "false"
        });

        const response = await fetch(`http://localhost:3000/transitPlan?${params}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
            return JSON.stringify([{
                "start_time": departureTime.toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                "message": "No transit routes found. Try walking or using another transportation method."
            }]);
        }

        const itinerary = data.plan.itineraries[0];
        const totalDurationMinutes = itinerary.duration / 60;
        const itinerarySummary = await extractLegInfo(itinerary.legs);
        return itinerarySummary;

    } catch (e) {
        console.error("Transit planning error:", e);

        return JSON.stringify([{
            "error": e.toString(),
            "fallback_message": "Transit planning service couldn't find a route. The food bank location is available on a map service using the coordinates."
        }]);
    }
}

async function getLocationName(lat, lon) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=AIzaSyC3RhvHaf9845y7afG5lsXQuONVtjIoEc0`
  );
  const data = await response.json();
  if (data.status === "OK") {
    return data.results[0]?.formatted_address || "Unknown location";
  } else {
    return "Unknown location";
  }
}

async function generateSummary(steps) {
  let summaryHTML = `<h4 style="color: white;">Journey Summary</h4><ol>`;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const fromName = await getLocationName(step.fromLat, step.fromLon);
    const toName = await getLocationName(step.toLat, step.toLon);

    summaryHTML += `
      <li>
        <strong>${step.mode}</strong> from 
        <em>${fromName}</em> to 
        <em>${toName}</em>.
      </li>
    `;
  }
  summaryHTML += "</ol>";
  summaryContainer.innerHTML = summaryHTML;
}

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
          <button type="button" id="transit-details" class="primary-button w-inline-block transit-details-btn">
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

      const button = card.querySelector(".transit-details-btn");
      button.addEventListener("click", async () => {
        try {
          const result = await getTransitPlan(userLat, userLon, item.latitude, item.longitude);
          document.getElementById("leaflet-map").style.display = "none";
          document.getElementById("google-map").style.display = "block";
          document.getElementById("legend").style.display = "block";
          document.getElementById("summary").style.display = "block";
          initMap(result);
          generateSummary(result);
        } catch (e) {
          console.error("Error getting transit plan:", e);
          alert("Could not retrieve transit details. Please check your location permissions.");
        }
      });
      
    });

    currentIndex += chunkSize;

    if (currentIndex >= currentResults.length) {
      document.getElementById("load-more").style.display = "none";
    }
  }

  document.getElementById("load-more").addEventListener("click", () => {
    renderCardsChunk();
  });

  const kitchenRadios = document.querySelectorAll('input[name="kitchenAccess"]');
  const groceryOptions = document.getElementById("grocery-options");
  const noKitchenMessage = document.getElementById("no-kitchen-message");

  kitchenRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "yes") {
        groceryOptions.style.display = "block";
        noKitchenMessage.style.display = "none";
      } else if (radio.value === "no") {
        groceryOptions.style.display = "none";
        noKitchenMessage.style.display = "block";

        // Set 'Prepared meals' as default
        document.querySelectorAll('input[name="diet"]').forEach(checkbox => {
          checkbox.checked = checkbox.value === "prepared";
        });
      }
    });
  });
  const canTravelRadios = document.getElementsByName("canTravel");
  const someoneElseGroup = document.getElementById("someoneElsePickupGroup");
  const deliveryGroup = document.getElementById("deliveryInfoGroup");
  const pickupTimeGroup = document.getElementById("pickupTimeGroup");
  const pickupDayChoice = document.getElementsByName("pickupDayChoice");
  const pickupDayOptions = document.getElementById("pickupDayOptions");
  const pickupTimeInput = document.getElementById("pickupTimeInput");

  let travel_ok = null;
  let delivery_required = false;

  canTravelRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "yes") {
        travel_ok = true;
        delivery_required = false;
        someoneElseGroup.style.display = "none";
        deliveryGroup.style.display = "none";
        pickupTimeGroup.style.display = "block";
      } else {
        travel_ok = false;
        someoneElseGroup.style.display = "block";
        pickupTimeGroup.style.display = "none";
        pickupDayOptions.style.display = "none";
        pickupTimeInput.style.display = "none";
      }
    });
  });

  const someoneElseRadios = document.getElementsByName("someoneElse");
  someoneElseRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "yes") {
        travel_ok = true;
        delivery_required = false;
        deliveryGroup.style.display = "none";
        pickupTimeGroup.style.display = "block";
      } else {
        travel_ok = false;
        delivery_required = true;
        deliveryGroup.style.display = "block";
        pickupTimeGroup.style.display = "none";
        pickupDayOptions.style.display = "none";
        pickupTimeInput.style.display = "none";
      }
    });
  });

  pickupDayChoice.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "another") {
        pickupDayOptions.style.display = "block";
      } else {
        pickupDayOptions.style.display = "none";
      }
      pickupTimeInput.style.display = "block";
    });
  });


  filterSubmit.addEventListener("click", async (e) => {
    e.preventDefault();
  
    const form = document.querySelector(".wf-form");

    const getCheckedValues = (name) =>
      Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
  
    const getRadioValue = (name) =>
      form.querySelector(`input[name="${name}"]:checked`)?.value;
  
    const data = {
      address: form.querySelector("#address")?.value,
      diet: getCheckedValues("diet"),
      preferences: getCheckedValues("preferences"),
      pickupDayChoice: getRadioValue("pickupDayChoice"), // ✅ fix here
      dayofweek: getCheckedValues("dayofweek"), // in case they chose "Another day"
      pickuptime: form.querySelector('input[name="pickupTime"]')?.value
    };

    const res = await fetch('http://localhost:3000/explore', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
  
    const results = await res.json();
    results.sort((a, b) => {
      const distA = haversineDistance(userLat, userLon, a.latitude, a.longitude);
      const distB = haversineDistance(userLat, userLon, b.latitude, b.longitude);
      return distA - distB;
    });    
    currentResults = results;
    currentIndex = 0;
    document.querySelector(".cards-container").innerHTML = ""; // Clear old results
    document.getElementById("load-more").style.display = "block"; // Show button again if hidden
    renderCardsChunk();
  });
  
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
        Math.pow(Math.sin(dLat / 2), 2) + 
        Math.cos(toRadians(lat1)) * 
        Math.cos(toRadians(lat2)) * 
        Math.pow(Math.sin(dLon / 2), 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c;
  }

  function toRadians(degrees) {
      return degrees * (Math.PI / 180);
  }

  function toggleFilters() {
    const filterSection = document.getElementById('filterSection');
    filterSection.classList.toggle('active');
  }
  window.toggleFilters = toggleFilters; // Make it globally accessible if needed

  // Initialize the map
  const map = L.map("leaflet-map").setView([userLat, userLon], 13); // Default: DC coordinates

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  L.marker([userLat, userLon]).addTo(map).bindPopup("You are here").openPopup();

  // fetch('Capital_Area_Food_Bank_Hunger_Estimates.geojson')
  // .then(response => response.json())
  // .then(geojsonData => {
  //     L.choropleth(geojsonData, {
  //         valueProperty: "F15_FI_RATE", // same as data column
  //         scale: ["#fdd49e", "#f03b20"], // OrRd colormap equivalent
  //         steps: 5,
  //         mode: "q", // quantile scale, like folium
  //         style: {
  //             color: "#fff",
  //             weight: 1,
  //             fillOpacity: 0.6
  //         },
  //         onEachFeature: function (feature, layer) {
  //             const rate = feature.properties.F15_FI_RATE || "N/A";
  //             layer.bindPopup(`Insecurity Rate: ${rate}`);
  //         }
  //     }).addTo(map);
  // })
  // .catch(err => console.error("Error loading GeoJSON:", err));

});

function initMap(results) {
  console.log(results);
  const directionsService = new google.maps.DirectionsService();
  const map = new google.maps.Map(document.getElementById("google-map"), {
    zoom: 14,
    center: { lat: 38.98, lng: -76.94 },
  });

  // Define colors for each mode
  const modeColors = {
    WALK: "#2a9d8f",   // Teal
    BUS: "#e76f51",    // Coral
    RAIL: "#264653",   // Dark Greenish
  };

  // Draw each leg of the journey
  results.forEach((step, index) => {
    const origin = { lat: step.fromLat, lng: step.fromLon };
    const destination = { lat: step.toLat, lng: step.toLon };
    const mode = step.mode === "WALK" ? "WALKING" : "TRANSIT";
    const color = modeColors[step.mode] || "#000"; // fallback to black

    // Optional: Add marker at each origin
    new google.maps.Marker({
      position: origin,
      map,
      label: `${index + 1}`,
      title: `Step ${index + 1}: ${step.mode}`,
    });

    // Draw the route
    directionsService.route(
      { origin, destination, travelMode: google.maps.TravelMode[mode] },
      (result, status) => {
        if (status === "OK") {
          const isWalking = mode === "WALKING";
          const path = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            strokeColor: color,
            strokeOpacity: isWalking ? 0 : 1.0,
            strokeWeight: 4,
            geodesic: true,
            ...(isWalking && {
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
          console.error(`Route error (Step ${index + 1}): ${status}`);
        }
      }
    );
  });
}
