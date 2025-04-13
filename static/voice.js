const fns = {
  getPageHTML: () => {
    return { success: true, html: document.documentElement.outerHTML };
  },
  changeBackgroundColor: ({ color }) => {
    document.body.style.backgroundColor = color;
    return { success: true, color };
  },
  changeTextColor: ({ color }) => {
    document.body.style.color = color;
    return { success: true, color };
  },
  voiceTransit: async ({ location }) => {
      try {
          
          if (!window.userLocation) {
              try {
                 
                  await getUserLocation();
                  if (!window.userLocation) {
                      throw new Error("Could not access your current location");
                  }
              } catch (locError) {
                  return {
                      success: false,
                      error: `Could not access your location: ${locError.message}`
                  };
              }
          }
          
          
          const userLat = window.userLocation.latitude;
          const userLon = window.userLocation.longitude;
          
          
          const locationStr = `${userLat}, ${userLon}`;
          const nearestFoodBank = findNearestFoodBankVoice(locationStr);
          
          if (typeof nearestFoodBank === 'string') {
              return { 
                  success: false,
                  error: nearestFoodBank
              };
          }
          
          const foodBankLat = nearestFoodBank.lat;
          const foodBankLon = nearestFoodBank.lon;
          
          const newInputStr = `${userLat}, ${userLon}, ${foodBankLat}, ${foodBankLon}`;
          const results = await planTransit(newInputStr);
          
          return {
              success: true,
              user_location: {
                  latitude: userLat,
                  longitude: userLon
              },
              nearest_food_bank: nearestFoodBank.name,
              distance_km: haversineDistance(userLat, userLon, foodBankLat, foodBankLon).toFixed(2),
              transit_options: JSON.parse(results)
          };
      } catch (e) {
          return {
              success: false,
              error: `Error: ${e.toString()}`
          };
      }
  },
 
  processFormInput: ({ questionId, answer }) => {
    try {
      const questionElement = document.querySelector(`.form-question[data-question-id="${questionId}"]`);
      
      if (!questionElement) {
        return { success: false, error: "Question not found" };
      }
     
      switch(questionId) {
        case "1": 
          document.getElementById("name").value = answer;
          break;
        case "2":
          document.getElementById("age").value = answer;
          break;
        case "3": 
          document.getElementById("city").value = answer;
          break;
        case "4": 
          const options = answer.toLowerCase().split(',').map(opt => opt.trim());
          document.getElementById("transport-bus").checked = options.includes("bus");
          document.getElementById("transport-subway").checked = options.includes("subway");
          document.getElementById("transport-walk").checked = options.includes("walking");
          break;
        case "5":
          document.getElementById("comments").value = answer;
          break;
      }
      
     
      questionElement.classList.remove("active");
      questionElement.classList.add("completed");

      const nextQuestionElement = document.querySelector(`.form-question[data-question-id="${parseInt(questionId) + 1}"]`);
      if (nextQuestionElement) {
        nextQuestionElement.classList.add("active");
      }
      
      // Update progress bar
      updateFormProgress();
      
      return { 
        success: true, 
        questionId: questionId,
        answer: answer,
        formCompleted: !nextQuestionElement,
        nextQuestionId: nextQuestionElement ? parseInt(questionId) + 1 : null
      };
    } catch (e) {
      return { success: false, error: e.toString() };
    }
  },
  
  getNextFormQuestion: () => {
    const activeQuestion = document.querySelector('.form-question.active');
    if (!activeQuestion) {
      const firstQuestion = document.querySelector('.form-question');
      if (firstQuestion) {
        firstQuestion.classList.add('active');
        updateFormProgress();
        return { 
          success: true, 
          questionId: firstQuestion.dataset.questionId,
          questionText: firstQuestion.querySelector('.form-label').innerText
        };
      } else {
        return { success: false, error: "No questions found" };
      }
    }
    
    return { 
      success: true, 
      questionId: activeQuestion.dataset.questionId,
      questionText: activeQuestion.querySelector('.form-label').innerText
    };
  },
  
  getFormStatus: () => {
    const totalQuestions = document.querySelectorAll('.form-question').length;
    const completedQuestions = document.querySelectorAll('.form-question.completed').length;
    const currentQuestion = document.querySelector('.form-question.active');
    
    return {
      success: true,
      totalQuestions: totalQuestions,
      completedQuestions: completedQuestions,
      progress: Math.round((completedQuestions / totalQuestions) * 100),
      currentQuestionId: currentQuestion ? currentQuestion.dataset.questionId : null,
      isCompleted: completedQuestions === totalQuestions
    };
  }
};

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }
    
    const statusDiv = document.getElementById('locationStatus');
    if (statusDiv) {
      statusDiv.textContent = "Requesting your location...";
      statusDiv.style.display = "block";
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        
        if (statusDiv) {
          statusDiv.textContent = `Location acquired: ${userLat.toFixed(6)}, ${userLon.toFixed(6)}`;
          statusDiv.style.color = "green";
        }
        
        
        window.userLocation = {
          latitude: userLat,
          longitude: userLon
        };
        
        const locationInput = document.getElementById('userLocationInput');
        if (locationInput) {
          locationInput.value = `${userLat}, ${userLon}`;
        }
        
        resolve({ latitude: userLat, longitude: userLon });
      },
      (error) => {
        console.error("Error getting location:", error);
        
        if (statusDiv) {
          statusDiv.textContent = `Error getting location: ${error.message}`;
          statusDiv.style.color = "red";
        }
        
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

function updateFormProgress() {
  const totalQuestions = document.querySelectorAll('.form-question').length;
  const completedQuestions = document.querySelectorAll('.form-question.completed').length;
  const progress = Math.round((completedQuestions / totalQuestions) * 100);
  
  const progressBar = document.getElementById('formProgress');
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${progress}%`;
  progressBar.setAttribute('aria-valuenow', progress);
}

function resetForm() {

  document.getElementById('name').value = '';
  document.getElementById('age').value = '';
  document.getElementById('city').value = '';
  document.getElementById('transport-bus').checked = false;
  document.getElementById('transport-subway').checked = false;
  document.getElementById('transport-walk').checked = false;
  document.getElementById('comments').value = '';
 
  const questions = document.querySelectorAll('.form-question');
  questions.forEach((q, index) => {
    q.classList.remove('active', 'completed');
    if (index === 0) {
      q.classList.add('active');
    }
  });
 
  updateFormProgress();
}



async function getLocationName(lat, lon) {
    const url = "https://nominatim.openstreetmap.org/reverse";
    const params = new URLSearchParams({
        format: "json",
        lat: lat,
        lon: lon,
        zoom: 14,
        addressdetails: 1
    });
    
    const headers = {
        "User-Agent": "TransitApp/1.0 (your-email@example.com)"
    };
    
    try {
        const response = await fetch(`${url}?${params}`, {
            headers: headers,
            timeout: 10000
        });
        
        const data = await response.json();
        return data.display_name || `(${lat}, ${lon})`;
    } catch (e) {
        return `(${lat}, ${lon})`;
    }
}


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

async function planTransit(inputStr) {
try {
    const parts = inputStr.split(",").map(x => x.trim());
    if (parts.length !== 4) {
        return JSON.stringify([{
            error: "Input should be in the format 'from_lat, from_lon, to_lat, to_lon'."
        }]);
    }
    
    const [fromLat, fromLon, toLat, toLon] = parts;
    
    const departureTime = new Date();
    departureTime.setMinutes(departureTime.getMinutes() + 10);
    
    const dateStr = departureTime.toISOString().split('T')[0];
    const timeStr = departureTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    });
    
    const params = new URLSearchParams({
        fromPlace: `${fromLat},${fromLon}`,
        toPlace: `${toLat},${toLon}`,
        numItineraries: 1,
        date: dateStr,
        time: timeStr,
        mode: "TRANSIT,WALK",
        arriveBy: "false"
    });
    
    console.log(`Making transit request to proxy: /proxy-transit?${params}`);
    
    try {
        
        const response = await fetch(` http://localhost:4000/transitPlan?${params}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.plan || !data.plan.itineraries || data.plan.itineraries.length === 0) {
            return JSON.stringify([{
                "start_time": departureTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
                "message": "No transit routes found. Try walking or using another transportation method."
            }]);
        }
        
        const itinerary = data.plan.itineraries[0];
        const totalDurationMinutes = itinerary.duration / 60;
        const itinerarySummary = await createItinerarySummary(itinerary);
        
        return JSON.stringify([{
            "start_from_your_place_at": departureTime.toLocaleString('en-US', { timeZone: 'America/New_York' }),
            "total_duration_minutes": totalDurationMinutes,
            "itinerary": itinerarySummary
        }]);
    } catch (e) {
        console.error("Transit planning error:", e);
        
        return JSON.stringify([{
            "error": e.toString(),
            "fallback_message": "Transit planning service couldn't find a route. The food bank location is available on a map service using the coordinates."
        }]);
    }
} catch (e) {
    return JSON.stringify([{
        "error": `Error parsing transit input: ${e}`
    }]);
}
}

function findNearestFoodBankVoice(inputStr) {
    try {
        const parts = inputStr.split(",").map(x => x.trim());
        if (parts.length !== 2) {
            return "Error: Input should be in the format 'lat, lon'.";
        }
        const userLat = parseFloat(parts[0]);
        const userLon = parseFloat(parts[1]);

        let nearest = null;
        let minDist = Infinity;
        
        for (const fb of foodBanks) {
            const dist = haversineDistance(userLat, userLon, fb.lat, fb.lon);
            if (dist < minDist) {
                minDist = dist;
                nearest = fb;
            }
        }
        
        return nearest;
    } catch (e) {
        return `Error parsing coordinates: ${e}`;
    }
}




const foodBanks = [
    // {"name": "Food Bank A - Target", "lat": 38.998959, "lon": -76.906453},
    {"name": "Food Bank B - Lidl", "lat": 38.996214, "lon": -76.931543},
    {"name": "Food Bank C - Capitol Hill", "lat": 38.889263, "lon": -76.991530},
    {"name": "Food Bank D - Trader Joe's", "lat": 38.978089, "lon": -76.938279}
];

const transit_app_api_key = "d2075a8b39fe7d775cf2a672682dfa41ed554d531095786cfe030853c50e8675";

const wmata_api_key = "59390b5927944b7ea2fd0680bb36ec33";



function configureData(dc) {
  console.log("Configuring data channel for tool calling");
  const event = {
    type: 'session.update',
    session: {
      modalities: ['text', 'audio'],
      tools: [
        {
          type: 'function',
          name: 'changeBackgroundColor',
          description: 'Changes the background color of the page',
          parameters: {
            type: 'object',
            properties: {
              color: { type: 'string', description: 'A hex value of the color' },
            },
          },
        },
        {
          type: 'function',
          name: 'changeTextColor',
          description: 'Changes the text color of the page',
          parameters: {
            type: 'object',
            properties: {
              color: { type: 'string', description: 'A hex value of the color' },
            },
          },
        },
        {
          type: 'function',
          name: 'getPageHTML',
          description: 'Gets the HTML for the current page',
        },
        {
          type: 'function',
          name: 'voiceTransit',
          description: 'Given the current location of the user, finds the nearest food bank and provides transit options',
          parameters: {
            type: 'object',
            properties: {
              location: { 
                type: 'string', 
                description: 'User location in format "latitude,longitude" (e.g. "38.897957,-77.036560")' 
              }
            },
          }
        },
        // New form handling tools
        {
          type: 'function',
          name: 'getNextFormQuestion',
          description: 'Gets the next question to ask in the form',
        },
        {
          type: 'function',
          name: 'processFormInput',
          description: 'Process user input for a form question',
          parameters: {
            type: 'object',
            properties: {
              questionId: { 
                type: 'string', 
                description: 'The ID of the question being answered' 
              },
              answer: {
                type: 'string',
                description: 'The user\'s answer to the question'
              }
            },
            required: ['questionId', 'answer']
          }
        },
        {
          type: 'function',
          name: 'getFormStatus',
          description: 'Gets the current status of the form completion',
        }
      ],
    },
  };
  dc.send(JSON.stringify(event));
  console.log("Tool configuration sent:", event);
}


async function init() {
  try {
    try {
      await getUserLocation();
      console.log("User location acquired:", window.userLocation);
    } catch (locationError) {
      console.error("Could not get user location:", locationError);
      // Continue with the rest of initialization even if location fails
    }
    
    const tokenResponse = await fetch("/session");
    const tokenData = await tokenResponse.json();
    const EPHEMERAL_KEY = tokenData.client_secret.value;
    console.log("Ephemeral key received:", EPHEMERAL_KEY);

    
    const pc = new RTCPeerConnection();

   
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);

    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(micStream.getTracks()[0]);

    let agentStream = null;
    let combinedVisualizerStarted = false;

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        agentStream = e.streams[0];
        audioEl.srcObject = agentStream;
        tryStartCombinedVisualizer();
      }
    };

    function tryStartCombinedVisualizer() {
      if (micStream && agentStream && !combinedVisualizerStarted) {
        combinedVisualizerStarted = true;
        startCombinedVisualizer([micStream, agentStream]);
      }
    }


    
    const dc = pc.createDataChannel("oai-events");

    dc.addEventListener("open", () => {
      console.log("Data channel open");
      configureData(dc);
    });

  
    dc.addEventListener("message", async (e) => {
      // console.log("Data Channel message received:", e.data);
      let msg;
      try {msg = JSON.parse(e.data);
      } catch (err) {
        console.error("Error parsing data channel message:", err);
        return;
      }
    
      if (msg.type === 'response.function_call_arguments.done') {
        const fn = fns[msg.name];
        if (fn !== undefined) {
          console.log(`Calling local function ${msg.name} with arguments: ${msg.arguments}`);
          const args = JSON.parse(msg.arguments);
          try {
            const result = await fn(args);
            console.log('Function result:', result);
           
            dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: msg.call_id, 
                output: JSON.stringify(result)
              }
            }));

            dc.send(JSON.stringify({ type: "response.create" }));
          } catch (error) {
            console.error("Error calling function:", error);
          }
        } else {
          console.warn(`No function defined for name: ${msg.name}`);
        }
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("SDP offer created and set as local description.");

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp"
      },
    });

    const answerSdp = await sdpResponse.text();
    const answer = {
      type: "answer",
      sdp: answerSdp,
    };
    await pc.setRemoteDescription(answer);
    console.log("SDP answer received and set as remote description. WebRTC connection established.");
  } catch (error) {
    console.error("Error initializing WebRTC connection:", error);
  }
}


function startCombinedVisualizer(streams) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const visualizerContainer = document.querySelector('.visualizer-container');
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf9f9f9);
  // document.body.appendChild(renderer.domElement);
  visualizerContainer.appendChild(renderer.domElement);
  const geometry = new THREE.SphereGeometry(4, 70, 60);

  // Gradient Shader
  const material = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;

      void main() {
        float gradient = (vPosition.y + 4.0) / 8.0; // Map y from [-4, 4] to [0, 1]

          vec3 colorTop = vec3(0.85, 0.98, 0.6);   // #bef746
          vec3 colorBottom = vec3(0.0, 0.4, 0.6);      // bluish
          vec3 beige = vec3(0.96, 0.96, 0.86);         // beige center
          vec3 midColor = vec3(1.0, 0.6, 0.4);         // warm orange/pink (new)

          vec3 baseGradient = mix(colorBottom, colorTop, gradient);

          float distFromCenter = length(vPosition) / 4.0; // normalized [0, 1]
          float beigeFade = smoothstep(0.0, 0.3, distFromCenter);    // beige fades early
          float midFade = smoothstep(0.2, 0.6, distFromCenter);      // mid blends mid-way

          vec3 color = mix(beige, midColor, beigeFade);
          vec3 finalColor = mix(color, baseGradient, midFade);
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    transparent: true
  });



  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  camera.position.z = 10;

  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  const initialVertices = geometry.attributes.position.array.slice();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Connect each stream to the analyser
  streams.forEach(stream => {
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    const time = clock.getElapsedTime();
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      const x = initialVertices[i];
      const y = initialVertices[i + 1];
      const z = initialVertices[i + 2];

      const noise = Math.sin(time * 3.5 + x + y + z) * 0.05 * (avg / 150);
      positions[i] = x + (x * noise);
      positions[i + 1] = y + (y * noise);
      positions[i + 2] = z + (z * noise);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    sphere.rotation.y += 0.002 + avg / 2048;
    sphere.rotation.x += 0.001;

    renderer.render(scene, camera);
  }

  animate();
  }


// Add event listeners for form controls
document.addEventListener('DOMContentLoaded', function() {
  const startVoiceFormBtn = document.getElementById('startVoiceForm');
  const resetFormBtn = document.getElementById('resetForm');
  
  if (startVoiceFormBtn) {
    startVoiceFormBtn.addEventListener('click', function() {
      // Reset and start the form
      resetForm();
      
      const startMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'text',
          text: "Let's start filling out the form. I'll ask you questions one by one."
        }
      };
      
      console.log("Form started by user");
    });
  }
  
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', function() {
      resetForm();
    });
  }
});

init().catch(err => console.error("Error initializing connection:", err));