//APIs


const transit_app_api_key = "d2075a8b39fe7d775cf2a672682dfa41ed554d531095786cfe030853c50e8675";

const wmata_api_key = "59390b5927944b7ea2fd0680bb36ec33";


// DOM Elements
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const messagesDiv = document.getElementById("messages") || document.getElementById("chat-container");
const langToggle = document.getElementById('lang-switch');
const closeChatButton = document.getElementById('close-chatbot');

// Socket connection
const socket = io();

// Form variables
let formStarted = false;
let formStep = 0;
let formData = {};
let formCompleted = false;
let currentLanguage = 'en'; // Default language

const formSteps = [
  { key: "name", question: "What is your name?", type: "text" },
  { key: "access_to_kitchen", question: "Do you have access to a kitchen?", type: "radio", options: ["Yes", "No"] },
  {
    key: "food_format", question: "How would you like your food?", type: "checkbox",
    options: ["Loose groceries", "Pre-bagged or boxed groceries", "Prepared meals", "Any"],
    condition: () => formData.access_to_kitchen === "Yes"
  },
  {
    key: "dietary_pref", question: "Do you have any cultural, religious, or dietary preferences?", type: "checkbox",
    options: ["Latin American", "West African", "East African", "Central/South Asian", "East Asian", "Eastern European", "Middle Eastern/ North African", "Halal", "Kosher", "Vegetarian", "Vegan", "None"]
  },
  { key: "can_travel", question: "Are you able to travel to pick up food?", type: "radio", options: ["Yes", "No"] },
  { key: "someone_else", question: "Can someone else pick up food for you?", type: "radio", options: ["Yes", "No"], condition: () => formData.can_travel === "No" },
  {
    key: "delivery_day",
    question: "What delivery day would you prefer?",
    type: "checkbox",
    options: ["Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    condition: () => formData.can_travel === "No" && formData.someone_else === "No"
  },
  {
    key: "delivery_time", question: "Preferred time for delivery?", type: "checkbox",
    options: ["Morning (9am-12pm)", "Afternoon (12pm-4pm)", "Evening (4pm-7pm)", "Night (7pm-11pm)"],
    condition: () => formData.can_travel === "No" && formData.someone_else === "No"
  },
  { key: "delivery_location", question: "Where should we deliver?", type: "text", condition: () => formData.can_travel === "No" && formData.someone_else === "No" },
  {
    key: "day_type", question: () => formData.someone_else === "Yes" ? "When would they like to go?" : "When would you like to go?",
    type: "radio", options: ["Today", "Another day"],
    condition: () => formData.can_travel === "Yes" || formData.someone_else === "Yes"
  },
  {
    key: "days", question: () => formData.someone_else === "Yes" ? "Which day would they like to go?" : "Which day would you like to go?",
    type: "checkbox",
    options: ["Tomorrow", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    condition: () => formData.day_type === "Another day"
  },
  {
    key: "preferred_time", question: () => formData.someone_else === "Yes" ? "Preferred time for them?" : "Preferred time for you?",
    type: "checkbox", options: ["Morning (9am-12pm)", "Afternoon (12pm-4pm)", "Evening (4pm-7pm)", "Night (7pm-11pm)"],
    condition: () => formData.can_travel === "Yes" || formData.someone_else === "Yes"
  },
  { key: "location", question: "What is your location?", type: "text", condition: () => formData.can_travel === "Yes" || formData.someone_else === "Yes" }
];

// Track connection status
let isConnected = false;
let currentAgentMessageId = null;
let pendingToolCalls = {}; // Track tool call IDs

// Language translations for UI elements
const translations = {
  en: {
    welcome: "Hi there! I'm your assistant. How can I help you today?",
    thinking: "Thinking...",
    connectionLost: "Connection lost. Please refresh the page.",
    pleaseAnswer: "Please provide a valid answer.",
    thanks: "Thanks! Here's your summary:",
    placeholderDefault: "Type a message...",
    placeholderAnswer: "Type your answer..."
  },
  es: {
    welcome: "¡Hola! Soy tu asistente. ¿Cómo puedo ayudarte hoy?",
    thinking: "Pensando...",
    connectionLost: "Conexión perdida. Por favor, recarga la página.",
    pleaseAnswer: "Por favor proporciona una respuesta válida.",
    thanks: "¡Gracias! Aquí está tu resumen:",
    placeholderDefault: "Escribe un mensaje...",
    placeholderAnswer: "Escribe tu respuesta..."
  }
};

// Initialize event listeners
function initializeEventListeners() {
  // Send button click event
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }
  
  // Input key press event (Enter key)
  if (chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const currentStep = formSteps[formStep];
    
        if (formStarted && currentStep && currentStep.type === "text" && !formData.hasOwnProperty(currentStep.key)) {
          processFormStep(currentStep);
        } else {
          sendMessage();
        }
      }
    });
  }
  
  // Language toggle
  if (langToggle) {
    langToggle.addEventListener('change', () => {
      currentLanguage = langToggle.checked ? 'es' : 'en';
      console.log(`Language selected: ${currentLanguage}`);
      updateUILanguage();
    });
  }
  
  // Close button
  if (closeChatButton) {
    closeChatButton.addEventListener('click', function () {
      window.history.back();
    });
  }
}

// Update UI elements to reflect current language
function updateUILanguage() {
  chatInput.placeholder = translations[currentLanguage].placeholderDefault;
  // Update other UI elements as needed
}

// Socket connection event
socket.on('connect', () => {
  console.log('Connected to server');
  isConnected = true;
  
  // Add welcome message when connected
  addMessage(translations[currentLanguage].welcome, "bot");
});

// Socket disconnection event
socket.on('disconnect', () => {
  console.log('Disconnected from server');
  isConnected = false;
  addMessage(translations[currentLanguage].connectionLost, "system");
});

// Listen for thinking status
socket.on('thinking', (data) => {
  displayThinkingIndicator(data.status || translations[currentLanguage].thinking);
  currentAgentMessageId = null;
});

// Listen for streaming content
socket.on('stream', (data) => {
  if (currentAgentMessageId === null) {
    currentAgentMessageId = 'msg-' + Date.now();
    createNewAgentMessage(data.content, currentAgentMessageId);
  } else {
    appendToAgentMessage(data.content, currentAgentMessageId);
  }
});

// Listen for completion signal
socket.on('complete', (data) => {
  removeThinkingIndicator();
  if (currentAgentMessageId) {
    const messageElement = document.getElementById(currentAgentMessageId);
    if (messageElement) {
      messageElement.classList.add('complete');
    }
    currentAgentMessageId = null;
  }
});

// Haversine formula to calculate distance between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 0.621371; // Distance in miles
}

async function getLocationName(lat, lon) {
  const apiKey = 'AIzaSyC3RhvHaf9845y7afG5lsXQuONVtjIoEc0'; 
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`;

  try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK" && data.results.length > 0) {
          // You can customize what kind of location name you want here
          return data.results[0].formatted_address;
      } else {
          console.error("Geocoding error:", data.status);
          return null;
      }
  } catch (error) {
      console.error("Fetch error:", error);
      return null;
  }
}


// Function to find the nearest food banks
function findNearestFoodBanks(userLat, userLon, filteredBanks) {
  try {
    // Validate user coordinates
    userLat = parseFloat(userLat);
    userLon = parseFloat(userLon);
    
    if (isNaN(userLat) || isNaN(userLon)) {
      console.error("Invalid user coordinates:", userLat, userLon);
      return "Invalid location coordinates provided";
    }
    
    // Calculate distance for each food bank and store with its details
    const foodBanksWithDistance = [];
    
    for (const fb of filteredBanks) {
      const fbLat = parseFloat(fb.latitude);
      const fbLon = parseFloat(fb.longitude);
      
      if (isNaN(fbLat) || isNaN(fbLon)) {
        continue; // Skip invalid coordinates
      }
      
      const dist = haversineDistance(userLat, userLon, fbLat, fbLon);
      
      foodBanksWithDistance.push({
        id: fb.agency_id,
        name: fb.agency_name,
        lat: fbLat,
        lon: fbLon,
        distance: dist.toFixed(2), // Rounded to 2 decimal places
        foodFormat: fb.food_format,
        dayOfWeek: fb.day_of_week,
        frequency: fb.frequency,
        hours: `${fb.starting_time} - ${fb.ending_time}`,
        region: fb.agency_region,
        county: fb.county_ward,
        culturalPopulations: fb.cultural_populations_served
      });
    }
    
    // Sort by distance (ascending)
    foodBanksWithDistance.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    const nearestOne = foodBanksWithDistance.slice(0, 1);

    // Globally define this
    window.selectedFoodBank = nearestOne;

    // Store selected food bank data for the backend
    socket.emit('store_selected_foodbank', {
      selectedFoodBank: nearestOne
    });

    console.log("Found nearest food banks:", nearestOne);
    return nearestOne;
  } catch (e) {
    console.error("Error in findNearestFoodBanks:", e);
    return `Error processing food bank data: ${e}`;
  }
}

// Handler for the findNearestFoodBanks tool
// Update the handler for the findNearestFoodBanks tool to pass form data
function handleFindNearestFoodBanks(toolCallId, params) {
  const { latitude, longitude } = params;
  
  // Use the stored filtered banks from the backend response
  if (!window.filteredFoodBanks || !Array.isArray(window.filteredFoodBanks)) {
    console.error("No filtered food banks available");
    socket.emit('tool_result', {
      tool: 'findNearestFoodBanks',
      result: { error: "No food bank data available" },
      id: toolCallId
    });
    return;
  }

  
  const nearest = findNearestFoodBanks(latitude, longitude, window.filteredFoodBanks);
  
  if (typeof nearest === "string") {
    // Error occurred
    socket.emit('tool_result', {
      tool: 'findNearestFoodBanks',
      result: { error: nearest },
      id: toolCallId
    });
    return;
  }

  
  // Send the results back to the server
  socket.emit('tool_result', {
    tool: 'findNearestFoodBanks',
    result: { foodBanks: nearest },
    id: toolCallId
  });
  
  // Display the nearest food banks to the user
  if (nearest.length > 0) {
    addMessage(`<strong>Here are the ${nearest.length} closest food banks to your location:</strong>`, "bot");
    
    nearest.forEach((fb, index) => {
      addMessage(`
        <div class="result-card">
          <p><strong>${index + 1}. ${fb.name}</strong> (${fb.distance} miles away)</p>
          <p>Format: ${fb.foodFormat || 'N/A'}</p>
          <p>Serves: ${fb.culturalPopulations || 'N/A'}</p>
          <p>Available: ${fb.dayOfWeek || 'N/A'} ${fb.frequency ? `(${fb.frequency})` : ''} from ${fb.hours || 'N/A'}</p>
          <p>Region: ${fb.region || 'N/A'} (${fb.county || 'N/A'})</p>
        </div>
      `, "bot");
    });
    
    // Add transit planning option - now get formData from window
    const transitDiv = document.createElement("div");
    transitDiv.className = "transit-option";
    transitDiv.innerHTML = `
      <p>Would you like to see transit directions to this food bank?</p>
      <button id="get-transit-btn" class="btn-primary">Yes, get directions</button>
      <button id="no-transit-btn" class="btn-secondary">No, thanks</button>
    `;
    messagesDiv.appendChild(transitDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Add event listeners for the transit buttons
    document.getElementById("get-transit-btn").addEventListener("click", () => {
      transitDiv.remove(); // Remove the options
      
      // Show loading message
      addMessage("Planning your route to the food bank...", "bot");
      
      // Get the selected food bank
      const foodBank = nearest[0];
      
      // Use the global form data that was stored during form completion
      const userFormData = window.formData || {};
      console.log("Using form data for transit planning:", userFormData);
      
      // Call the transit planning function with user and food bank coordinates and form data
      planTransitToFoodBank(latitude, longitude, foodBank.lat, foodBank.lon, userFormData);
    });
    
    document.getElementById("no-transit-btn").addEventListener("click", () => {
      transitDiv.remove(); // Remove the options
      addMessage("No problem! Let me know if you need any other assistance.", "bot");
    });
    
  } else {
    addMessage("Sorry, no food banks were found near your location.", "bot");
  }
}

// Add this function to make form data globally available
function storeFormData(data) {
  window.formData = data;
  console.log("Form data stored:", window.formData);
}

// Listen for tool execution instructions
socket.on('tool_execution', (data) => {
  console.log('Tool execution:', data);
  
  // Store the tool call ID if provided
  if (data.id) {
    pendingToolCalls[data.tool] = data.id;
  }
  
  // Execute the tool based on the tool name
  try {
    switch (data.tool) {
      case 'isFormComplete':
        handleIsFormComplete(data.id);
        break;
      case 'showNextQuestion':
        handleShowNextQuestion(data.id);
        break;
      case 'handleFormInput':
        handleProcessFormInput(data.args.userInput, data.id);
        break;
      case 'findNearestFoodBanks':
        handleFindNearestFoodBanks(data.id, data.args);
        break;
      // case 'planTransitToFoodBank':
      //   const { fromLat, fromLon, toLat, toLon } = data.args;
      //   planTransitToFoodBank(fromLat, fromLon, toLat, toLon, data.id, socket);
      //   break;            
      case 'changeBackgroundColor':
        changeBackgroundColor(data.args.color, data.id);
        break;
      case 'toggle_dark_mode':
        toggleDarkMode(data.args.enabled, data.id);
        break;
      default:
        console.log('Unknown tool:', data.tool);
        // Report back that this tool is not recognized
        socket.emit('tool_result', {
          tool: data.tool,
          result: { error: `Unknown tool: ${data.tool}` },
          id: data.id || null
        });
    }
  } catch (err) {
    console.error(`Error executing tool ${data.tool}:`, err);
    socket.emit('tool_result', {
      tool: data.tool,
      result: { error: `Error executing tool: ${err.message}` },
      id: data.id || null
    });
  }
});


// Form handling functions
// Tool 1: Check if the form is complete
function handleIsFormComplete(toolCallId) {
  const isComplete = isFormComplete();
  console.log("Form complete check:", isComplete);
  formCompleted = isComplete;
  
  // Send result back to server with the tool call ID
  socket.emit('tool_result', {
    tool: 'isFormComplete',
    result: { complete: isComplete },
    id: toolCallId || pendingToolCalls['isFormComplete']
  });
}

function isFormComplete() {
  for (let i = 0; i < formSteps.length; i++) {
    const step = formSteps[i];
    if (step.condition && !step.condition()) continue;
    if (!formData.hasOwnProperty(step.key)) return false;
  }
  return true;
}

// Tool 2: Ask the next form question
function handleShowNextQuestion(toolCallId) {
  formStarted = true;
  showNextQuestion();
  
  socket.emit('tool_result', {
    tool: 'showNextQuestion',
    result: { shown: true, step: formStep },
    id: toolCallId || pendingToolCalls['showNextQuestion']
  });
}

function showNextQuestion() {
  while (formStep < formSteps.length) {
    const step = formSteps[formStep];

    if (step.condition && !step.condition()) {
      formStep++;
      continue;
    }

    if (formData.hasOwnProperty(step.key)) {
      formStep++;
      continue;
    }

    const questionText = typeof step.question === "function" ? step.question() : step.question;
    const formDiv = document.createElement("div");
    formDiv.className = "form-question";
    formDiv.id = `form-step-${formStep}`;
    formDiv.innerHTML = `<strong>${questionText}</strong><br/>`;

    if (step.type === "radio" || step.type === "checkbox") {
      step.options.forEach((opt, idx) => {
        const id = `${step.key}-${idx}`;
        formDiv.innerHTML += `
          <label>
            <input type="${step.type}" name="${step.key}" value="${opt}" id="${id}" />
            ${opt}
          </label><br/>
        `;
      });

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "submit-button";
      saveBtn.onclick = () => processFormStep(step);
      formDiv.appendChild(saveBtn);
    } else if (step.type === "text") {
      chatInput.placeholder = translations[currentLanguage].placeholderAnswer;
      chatInput.focus();
    }

    messagesDiv.appendChild(formDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return;
  }

  if (isFormComplete()) {
    formCompleted = true;
    const normalizedForm = normalizeForm(formData);

      // Store the form data globally for use in other functions
      window.formData = normalizedForm;
      storeFormData(normalizedForm);  // This function already exists
  
    addMessage(`<strong>${translations[currentLanguage].thanks}</strong>`, "bot");
  
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "summary";
  
    for (const [key, value] of Object.entries(normalizedForm)) {
      const formattedKey = key.replace(/_/g, " ").toUpperCase();
      const formattedValue = Array.isArray(value) ? value.join(", ") : value;
      summaryDiv.innerHTML += `<p><strong>${formattedKey}:</strong><br/>${formattedValue}</p>`;
    }
  
    messagesDiv.appendChild(summaryDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
    // Reset chat input
    chatInput.placeholder = translations[currentLanguage].placeholderDefault;
  
    // Notify server form is complete
    socket.emit('tool_result', {
      tool: 'isFormComplete',
      result: { complete: true },
      id: pendingToolCalls['isFormComplete']
    });

    // Check if delivery is required — skip backend if so
    const needsDelivery = formData.can_travel === "No" && formData.someone_else === "No";

// When user shares location, modify that part to use the user's coordinates
// This is inside the form completion and location sharing section
fetch('http://localhost:3000/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(normalizedForm)
})
  .then(response => response.json())
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      addMessage("Sorry, no matching food banks found at the moment.", "bot");
      return;
    }

    window.filteredFoodBanks = data;

    // Inform the user that food banks have been found
    addMessage("<strong>We found food banks that match your needs.</strong>", "bot");

    // Prompt user to share location after food banks are found
    addMessage("To find the closest ones, please share your location.", "bot");

    const locationBtn = document.createElement("button");
    locationBtn.textContent = "Share My Location";
    locationBtn.className = "location-button";
    locationBtn.onclick = () => {
      // When user clicks to share location, proceed with geolocation logic
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            // Store globally if needed
            window.userLat = userLat;
            window.userLon = userLon;

            // Send to the backend
            socket.emit("store_user_location", {
              lat: userLat,
              lon: userLon
            });

            addMessage(`<em>Location shared: ${userLat.toFixed(4)}, ${userLon.toFixed(4)}</em>`, "user");

            // Find and display the closest food banks, now with integrated transit option
            handleFindNearestFoodBanks(null, { latitude: userLat, longitude: userLon });
          },
          (error) => {
            console.error("Geolocation error:", error);
            addMessage("Could not access your location. Please enter your coordinates manually.", "bot");
          }
        );
      } else {
        addMessage("Geolocation is not supported by your browser. Please enter your coordinates manually.", "bot");
      }
    };

    messagesDiv.appendChild(locationBtn);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  })
  .catch(err => {
    console.error('Fetch error:', err);
    addMessage("Oops! Something went wrong while retrieving food banks.", "bot");
  });

  }
}

// Socket event handler for user location
socket.on('store_user_location', function(data) {
  // This is just to make sure we're listening to the event from Python
  console.log("Location received from Python:", data);
});

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function extractStationCode(stopId) {
  if (stopId.startsWith("WMATAS:PF_")) {
      const remainder = stopId.substring("WMATAS:PF_".length);
      const parts = remainder.split("_");       
      if (parts.length > 0) {
          return parts[0];
      }
  }
  return stopId;
}

async function station2Station(inputStr1, inputStr2) {
  const headers = { 'api_key': wmata_api_key };
  
  const fromStation = inputStr1;
  const toStation = inputStr2;
  
  const urlCost = `http://api.wmata.com/Rail.svc/json/jSrcStationToDstStationInfo?FromStationCode=${fromStation}&ToStationCode=${toStation}`;
  const responseCost = await fetch(urlCost, { headers });
  const costData = await responseCost.json();
  const costInfo = costData.StationToStationInfos[0];
  const fareInfo = costInfo.RailFare;
  
  const urlPrediction = `http://api.wmata.com/StationPrediction.svc/json/GetPrediction/${fromStation}`;
  const responsePrediction = await fetch(urlPrediction, { headers });
  const predictionData = await responsePrediction.json();
  const predictions = predictionData.Trains;

  const timeNow = new Date();

  const availableTrains = [];
  for (const train of predictions) {
      if (train.Min !== "ARR") {
          try {
              const minutes = parseInt(train.Min);
              if (minutes >= 5) {
                  availableTrains.push(train);
              }
          } catch (e) {
              continue;
          }
      }
  }
  
  const nextTrains = availableTrains.slice(0, 1);
  
  const finalTrains = [];
  for (const train of nextTrains) {
      const minutes = parseInt(train.Min);
      const predictedDeparture = new Date(timeNow);
      predictedDeparture.setMinutes(timeNow.getMinutes() + minutes);
      
      const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/New_York' }).format(predictedDeparture);
      const hour = predictedDeparture.getHours();
      
      let finalCost;
      if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
          finalCost = fareInfo.OffPeakTime;
      } else {
          if ((10 <= hour && hour <= 15) || hour >= 19) {
              finalCost = fareInfo.OffPeakTime;
          } else {
              finalCost = fareInfo.PeakTime;
          }
      }
      
      const trainInfo = {
          Car: train.Car,
          Destination: train.Destination,
          Min: train.Min,
          PredictedDepartureTime: predictedDeparture.toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
          }),
          FinalCost: finalCost
      };
      
      finalTrains.push(trainInfo);
  }
  
  return finalTrains.length > 0 ? finalTrains[0].FinalCost : "$2.00";
}



async function createItinerarySummary(itinerary) {

  const legs = itinerary.legs || [];
  const summarySentences = [];
  let totalSubwayCost = 0.0;

  for (const leg of legs) {
      
      const startTime = new Date(leg.startTime);
      const startTimeStr = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false,
          timeZone: 'America/New_York'
      });

      const mode = leg.mode || "travel";

      const fromLocation = leg.from || {};
      let fromName = (fromLocation.name || "").trim();
      if (!fromName) {
          const fromLat = fromLocation.lat;
          const fromLon = fromLocation.lon;
          if (fromLat !== undefined && fromLon !== undefined) {
              fromName = await getLocationName(fromLat, fromLon);
          } else {
              fromName = "Unknown location";
          }
      }

      const toLocation = leg.to || {};
      let toName = (toLocation.name || "").trim();
      if (!toName) {
          const toLat = toLocation.lat;
          const toLon = toLocation.lon;
          if (toLat !== undefined && toLon !== undefined) {
              toName = await getLocationName(toLat, toLon);
          } else {
              toName = "Unknown location";
          }
      }

      let costEstimate = "$5-$10";
      let sentence = "";

      if (mode.toUpperCase() === "WALK") {
          sentence = `At ${startTimeStr}, walk from ${fromName} to ${toName}.`;
      } else if (mode.toUpperCase() === "BUS") {
          const route = (leg.route || "").trim();
          if (route) {
              sentence = `At ${startTimeStr}, board bus ${route} from ${fromName} to ${toName}.`;
          } else {
              sentence = `At ${startTimeStr}, board the bus from ${fromName} to ${toName}.`;
          }
      } else if (mode.toUpperCase() === "SUBWAY") {
          const route = (leg.route || "").trim();
          const fromStationId = (fromLocation.stopId || "").trim();
          const toStationId = (toLocation.stopId || "").trim();
          const fromStationCode = fromStationId ? extractStationCode(fromStationId) : "";
          const toStationCode = toStationId ? extractStationCode(toStationId) : "";

          console.log("From station code", fromStationCode);
          console.log("To station code", toStationCode);

          let currentCost = 0.0;
          if (fromStationCode && toStationCode) {
              try {
                  costEstimate = station2Station(fromStationCode, toStationCode);
                  currentCost = parseFloat(costEstimate.replace('$', ''));
              } catch (e) {
                  costEstimate = "$5-$10";
                  currentCost = 0.0;
              }
          } else {
              currentCost = 0.0;
          }
          totalSubwayCost += currentCost;

          if (route) {
              sentence = `At ${startTimeStr}, take the subway ${route} from ${fromName} to ${toName}. Estimated cost: ${costEstimate}`;
          } else {
              sentence = `At ${startTimeStr}, take the subway from ${fromName} to ${toName}. Estimated cost: ${costEstimate}`;
          }
      } else {
          sentence = `At ${startTimeStr}, travel by ${mode} from ${fromName} to ${toName}.`;
      }

      summarySentences.push(sentence);
  }

  let finalSummary = summarySentences.join(" ");
  finalSummary += ` Total estimated subway cost: $${totalSubwayCost.toFixed(2)}.`;
  return finalSummary;
}

// Tool: Plan transit to food bank
// Function to plan transit to food bank
// Function to plan transit to food bank
async function planTransitToFoodBank(fromLat, fromLon, toLat, toLon, formData) {
  try {
    // Convert to numbers if they aren't already
    fromLat = parseFloat(fromLat);
    fromLon = parseFloat(fromLon);
    toLat = parseFloat(toLat);
    toLon = parseFloat(toLon);
    
    console.log("Planning transit with form data:", formData);
    
    // Determine the departure date based on user preferences
    // Always work with local time (Eastern Time) for user-facing operations
    let departureDate = new Date();
    const today = new Date();
    const dayOfWeekToday = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Handle date selection
    if (formData.day_type === "Today") {
      // Use today's date, already set in departureDate
      console.log("Using today's date for transit");
    } else if (formData.day_type === "Another day" && formData.days && formData.days.length > 0) {
      const selectedDay = formData.days[0];
      console.log("Selected day for transit:", selectedDay);
      
      if (selectedDay === "Tomorrow") {
        // Set to tomorrow
        departureDate.setDate(today.getDate() + 1);
      } else {
        // Find the next occurrence of the selected day
        const selectedDayIndex = dayNames.indexOf(selectedDay);
        if (selectedDayIndex !== -1) {
          // Calculate days to add to reach the next occurrence of the selected day
          let daysToAdd = selectedDayIndex - dayOfWeekToday;
          if (daysToAdd <= 0) {
            daysToAdd += 7; // Go to next week if the day has already passed this week
          }
          departureDate.setDate(today.getDate() + daysToAdd);
          console.log(`Setting date to next ${selectedDay}, adding ${daysToAdd} days`);
        }
      }
    }
    
    // Handle time selection
    let timeSelected = null; // No default time
    
    if (formData.preferred_time && formData.preferred_time.length > 0) {
      // Use the first time preference
      const timePref = formData.preferred_time[0];
      console.log("Selected time preference:", timePref);
      
      // Map time preferences to actual times
      const timeMap = {
        "Morning (9am-12pm)": "10:00",
        "Afternoon (12pm-4pm)": "14:00",
        "Evening (4pm-7pm)": "17:00",
        "Night (7pm-11pm)": "19:00"
      };
      
      timeSelected = timeMap[timePref];
    }
    
    if (!timeSelected) {
      // If no time was selected or the mapping failed, don't set a time
      addMessage("No time preference found. Please specify a preferred time.", "bot");
      return;
    }
    
    // Set the time on the departure date (still in local time)
    const [hours, minutes] = timeSelected.split(':').map(Number);
    departureDate.setHours(hours, minutes, 0, 0);
    
    console.log("Final local departure date and time:", departureDate.toLocaleString('en-US', {timeZone: 'America/New_York'}));
    
    // Format date for the API request (YYYY-MM-DD format)
    // We use the local date as displayed to the user
    const dateStr = departureDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/New_York'
    }).split('/').reverse().join('-').replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$3-$2');
    
    // Convert the local time to UTC time for the API
    // First, create a string representing the time in Eastern timezone
    const easternDateString = `${dateStr}T${timeSelected}:00-05:00`; // Assuming EST (-05:00)
    // Then parse this into a Date object, which will convert to the JavaScript's internal UTC representation
    const easternDate = new Date(easternDateString);
    // Finally, extract the UTC time in HH:MM format for the API
    const timeStr = easternDate.toISOString().split('T')[1].substring(0, 5);

    console.log(`Using date: ${dateStr} and time: ${timeStr} (UTC) for API request`);
    
    const params = new URLSearchParams({
        fromPlace: `${fromLat},${fromLon}`,
        toPlace: `${toLat},${toLon}`,
        numItineraries: 1,
        date: dateStr,
        time: timeStr,
        mode: "TRANSIT,WALK",
        arriveBy: "false"
    });
  
    console.log(`Making transit request to proxy: /transitPlan?${params}`);
    console.log(`Planning for departure: ${departureDate.toLocaleString('en-US', {timeZone: 'America/New_York'})}`);
  
    try {
        const response = await fetch(`http://localhost:3000/transitPlan?${params}`);
      
        if (!response.ok) {
            const errorText = await response.text();
            addMessage(`Could not plan transit: ${errorText}`, "bot");
            return;
        }
      
        const data = await response.json();
      
        if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
            addMessage("No transit routes found for your selected time and date. Try a different time or day.", "bot");
            return;
        }
      
        const itinerary = data.plan.itineraries[0];
        const totalDurationMinutes = Math.round(itinerary.duration / 60);
        
        // Create itinerary summary 
        const itinerarySummary = await createItinerarySummary(itinerary);

        // Format the date for display with the correct weekday in Eastern Time
        const formattedDate = departureDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/New_York'
        });
        
        // Format the time for display in Eastern Time
        const formattedTime = departureDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/New_York'
        });
        
        // Get the time range from the form data for display
        let timeRangeText = "";
        if (formData.preferred_time && formData.preferred_time.length > 0) {
            timeRangeText = formData.preferred_time[0];
        }
      
        // Display the transit plan to the user
        addMessage(`<strong>Transit Plan for ${formattedDate} during ${timeRangeText}</strong>`, "bot");
        addMessage(`<p>Start from your location at: ${formattedTime}</p>
                   <p>Total journey time: ${totalDurationMinutes} minutes</p>
                   <p>${itinerarySummary}</p>`, "bot");
        
    } catch (e) {
        console.error("Transit planning error:", e);
        addMessage("Transit planning service couldn't find a route for your selected time. The food bank location is available on a map service using the coordinates.", "bot");
    }
  } catch (e) {
    console.error(`Error processing transit request: ${e}`);
    addMessage("Sorry, there was an error planning your transit route.", "bot");
  }
}


// Tool 3: Process form input
function handleProcessFormInput(userInput, toolCallId) {
  if (formStarted && formStep < formSteps.length) {
    const currentStep = formSteps[formStep];
    
    if (currentStep.type === "text") {
      // For text input, use the provided value from the agent
      processInputValue(currentStep, userInput);
    } else {
      // For radio/checkbox, the UI has already collected the input
      // This function is called when the user clicks "Save"
      // No additional action needed here
    }
    
    socket.emit('tool_result', {
      tool: 'handleFormInput',
      result: { processed: true, step: formStep },
      id: toolCallId || pendingToolCalls['handleFormInput']
    });
  }
}

function processFormStep(step) {
  let values = [];

  if (step.type === "radio") {
    const selected = document.querySelector(`input[name="${step.key}"]:checked`);
    if (selected) values = selected.value;
  } else if (step.type === "checkbox") {
    document.querySelectorAll(`input[name="${step.key}"]:checked`).forEach(cb => values.push(cb.value));
  } else if (step.type === "text") {
    values = chatInput.value.trim();
    chatInput.value = "";
    chatInput.placeholder = translations[currentLanguage].placeholderDefault;
    if (values) addMessage(values, "user");
  }

  if (!values || (Array.isArray(values) && values.length === 0)) {
    addMessage(translations[currentLanguage].pleaseAnswer, "bot");
    return;
  }

  processInputValue(step, values);
}

function processInputValue(step, values) {
  formData[step.key] = values;

  // Auto-set food_format if no kitchen access
  if (step.key === "access_to_kitchen" && values === "No") {
    formData.food_format = ["Prepared meals"];
    console.log("Auto-setting food_format to Prepared meals");
  }

  const shownValue = Array.isArray(values) ? values.join(", ") : values;
  addMessage(`<strong>${step.key.replace(/_/g, " ")}:</strong> ${shownValue}`, "bot");

  const currentDiv = document.getElementById(`form-step-${formStep}`);
  if (currentDiv) currentDiv.remove();

  formStep++;
  showNextQuestion();
}

// Normalization Logic
function normalizeForm(form) {
  const updatedForm = { ...form };

  // Ensure proper setting of food_format
  if (updatedForm.access_to_kitchen === "No") {
    updatedForm.food_format = ["Prepared meals"];
  } else if (updatedForm.food_format?.includes("Any")) {
    updatedForm.food_format = ["Loose groceries", "Pre-bagged or boxed groceries", "Prepared meals"];
  }

  const cultureMap = {
    "Halal": ["Middle Eastern/ North African"],
    "Kosher": ["Eastern European", "Middle Eastern/ North African"],
    "Vegetarian": ["Central/South Asian", "East Asian"],
    "Vegan": ["Central/South Asian", "East Asian"]
  };

  if (updatedForm.dietary_pref) {
    let dietary = updatedForm.dietary_pref;
    let expanded = [];

    if (dietary.includes("None")) {
      expanded = [
        "Latin American", "West African", "East African", "Central/South Asian",
        "East Asian", "Eastern European", "Middle Eastern/ North African"
      ];
    } else {
      dietary.forEach(item => {
        expanded.push(...(cultureMap[item] || [item]));
      });
    }

    updatedForm.dietary_pref = [...new Set(expanded)];
  }

  console.log("Normalized Data:", updatedForm);
  return updatedForm;
}

// Send message function
function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage || !isConnected) return;

  addMessage(userMessage, "user");
  chatInput.value = "";
  
  // Send the message to the server via WebSocket
  socket.emit('message', { message: userMessage });
}

// Display message helpers - Enhanced with support for formatted messages
function addMessage(text, sender = "bot") {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${sender}`;
  
  // Handle list format (from second script)
  if (sender === 'bot' && text.startsWith('LIST:')) {
    const lines = text.replace('LIST:', '').trim().split('\n');
    lines.forEach(item => {
      const optionEl = document.createElement('div');
      optionEl.classList.add('option');

      const optionNumber = document.createElement('div');
      optionNumber.classList.add('option-number');
      optionNumber.innerText = item.split(':')[0].trim();

      const optionDescription = document.createElement('div');
      optionDescription.classList.add('option-description');
      optionDescription.innerText = item.split(':')[1].trim();

      optionEl.appendChild(optionNumber);
      optionEl.appendChild(optionDescription);

      messageEl.appendChild(optionEl);
    });
  } else {
    // Support HTML content
    messageEl.innerHTML = text;
  }
  
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Display thinking indicator
function displayThinkingIndicator(text) {
  removeThinkingIndicator();
  
  const thinkingDiv = document.createElement("div");
  thinkingDiv.id = "thinking-indicator";
  thinkingDiv.className = "message bot thinking";
  thinkingDiv.textContent = text || translations[currentLanguage].thinking;
  messagesDiv.appendChild(thinkingDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Remove thinking indicator
function removeThinkingIndicator() {
  const existingIndicator = document.getElementById("thinking-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }
}

// Create a new agent message
function createNewAgentMessage(content, messageId) {
  const messageDiv = document.createElement("div");
  messageDiv.id = messageId;
  messageDiv.className = "message bot";
  messageDiv.innerHTML = content;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Append content to a specific agent message
function appendToAgentMessage(content, messageId) {
  const messageElement = document.getElementById(messageId);
  if (messageElement) {
    const currentContent = messageElement.innerHTML;
    messageElement.innerHTML = currentContent + content;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

// Tool: Change background color
function changeBackgroundColor(color, toolCallId) {
  document.body.style.backgroundColor = color;
  addMessage(`Background color changed to ${color}.`, "system");
  
  socket.emit('tool_result', {
    tool: 'changeBackgroundColor',
    result: { success: true, color: color },
    id: toolCallId || pendingToolCalls['changeBackgroundColor']
  });
}

// Tool: Toggle dark mode
function toggleDarkMode(enabled, toolCallId) {
  if (enabled) {
    document.body.classList.add('dark-mode');
    addMessage("Dark mode enabled.", "system");
  } else {
    document.body.classList.remove('dark-mode');
    addMessage("Light mode enabled.", "system");
  }
  
  socket.emit('tool_result', {
    tool: 'toggle_dark_mode',
    result: { success: true, enabled: enabled },
    id: toolCallId || pendingToolCalls['toggle_dark_mode']
  });
}

// Initialize with welcome message
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  
  // if (isConnected) {
    // addMessage(translations[currentLanguage].welcome, "bot");
  // }
});
