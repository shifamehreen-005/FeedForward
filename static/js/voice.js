
const visualiser = {
  canvas   : null,
  ctx      : null,
  analysers: [],          
  width    : 0,
  height   : 0,
  init() {
    this.canvas  = document.getElementById('audioVisualizer');
    this.ctx     = this.canvas.getContext('2d');
    this.width   = this.canvas.offsetWidth;
    this.height  = this.canvas.offsetHeight;
    this.canvas.width  = this.width;
    this.canvas.height = this.height;
    requestAnimationFrame(this.draw.bind(this));
  },
  /** Add a new audio stream in the given colour */
  addStream(stream, colour) {
    const audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    const analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    this.analysers.push({ analyser, colour });
  },
  draw() {
    requestAnimationFrame(this.draw.bind(this));
    // clear
    this.ctx.fillStyle = '#f5f5f5';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.analysers.forEach(({ analyser, colour }) => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray    = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      this.ctx.lineWidth   = 2;
      this.ctx.strokeStyle = colour;
      this.ctx.beginPath();

      const sliceWidth = this.width / bufferLength;
      let   x          = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * this.height / 2;
        i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        x += sliceWidth;
      }
      this.ctx.lineTo(this.width, this.height / 2);
      this.ctx.stroke();
    });
  }
};

let userProfileData = null;

let rtcStarted = false;  

// async function loadUserProfile() {
//   try {
  
//     const email = localStorage.getItem("user_email");
//     const isLoggedIn = localStorage.getItem("isLoggedIn");
    
//     if (!isLoggedIn || !email) {
//       console.log("User not logged in, no profile data to load");
//       return null;
//     }
    
//     const response = await fetch(`http://localhost:3000/get-profile?email=${encodeURIComponent(email)}`);
//     if (!response.ok) {
//       throw new Error("Failed to fetch profile data");
//     }
    
//     const profile = await response.json();
//     console.log("Loaded profile data:", profile);
//     return profile;
//   } catch (error) {
//     console.error("Error loading user profile:", error);
//     return null;
//   }
// }

// visualiser.init();
function teardownRTC() {
  if (window.pc) {
    try {
      window.pc.getSenders().forEach(s => s.track?.stop());
      window.pc.close();
    } catch (e) {
      console.warn("Error closing PC:", e);
    }
    window.pc = null;
  }
  rtcStarted = false;      
}


async function loadUserProfile() {
  // Return cached profile data if available
  if (userProfileData !== null) {
    console.log("Using cached profile data");
    return userProfileData;
  }
  
  try {
    // Check if user is logged in
    const email = localStorage.getItem("user_email");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    if (!isLoggedIn || !email) {
      console.log("User not logged in, no profile data to load");
      userProfileData = null;
      return null;
    }
    
    // Fetch profile data
    const response = await fetch(`http://localhost:3000/get-profile?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error("Failed to fetch profile data");
    }
    
    const profile = await response.json();
    console.log("Loaded profile data:", profile);
    
    // Cache the profile data
    userProfileData = profile;
    return profile;
  } catch (error) {
    console.error("Error loading user profile:", error);
    userProfileData = null;
    return null;
  }
}

// Function to check if a question has been answered
function checkIfQuestionHasResponse(questionId) {
  switch(questionId) {
    case "1": // Name
      return !!document.getElementById("name")?.value;
    
    case "2": // Kitchen access
      return document.getElementById("kitchen-yes")?.checked || 
             document.getElementById("kitchen-no")?.checked;
    
    case "3": // Food format
      return document.getElementById("food-loose")?.checked || 
             document.getElementById("food-packaged")?.checked ||
             document.getElementById("food-prepared")?.checked ||
             document.getElementById("food-any")?.checked;
    
    case "4": // Dietary preferences
      const dietaryCheckboxes = [
        "pref-latin", "pref-westafrican", "pref-eastafrican", "pref-southasian",
        "pref-eastasian", "pref-easteuropean", "pref-middleeastern", "pref-halal",
        "pref-kosher", "pref-vegetarian", "pref-vegan", "pref-none"
      ];
      return dietaryCheckboxes.some(id => document.getElementById(id)?.checked);
    
    case "5": // Travel ability
      return document.getElementById("travel-yes")?.checked || 
             document.getElementById("travel-no")?.checked;
    
    case "6": // Someone else can pick up
      return document.getElementById("someone-yes")?.checked || 
             document.getElementById("someone-no")?.checked;
    
    case "7": // Day preference
      return document.getElementById("day-today")?.checked || 
             document.getElementById("day-another")?.checked;
    
    case "8": // Specific day selection
      const dayCheckboxes = [
        "day-tomorrow", "day-monday", "day-tuesday", "day-wednesday",
        "day-thursday", "day-friday", "day-saturday", "day-sunday"
      ];
      return dayCheckboxes.some(id => document.getElementById(id)?.checked);
    
    case "9": // Preferred pickup time (now checkboxes)
      return document.getElementById("time-morning")?.checked || 
            document.getElementById("time-afternoon")?.checked ||
            document.getElementById("time-evening")?.checked;
    
    case "10": // Location
      return !!document.getElementById("location")?.value;
    
    case "11": // Delivery time
      return !!document.getElementById("delivery-time")?.value;
    
    case "12": // Comments

      return !!document.getElementById("comments")?.value;
    
    default:
      return false;
  }
}

function getNextQuestionElement(currentQuestionId) {
  let nextQuestionId = parseInt(currentQuestionId) + 1;
  
  if (currentQuestionId === "2" && document.getElementById("kitchen-no")?.checked) {
    nextQuestionId = 4;
  } else if (currentQuestionId === "5") {
   
    if (document.getElementById("travel-no")?.checked) {
      nextQuestionId = 12;
    } else {
      nextQuestionId = 7;
    }
  } else if (currentQuestionId === "7" && document.getElementById("day-today")?.checked) {
    nextQuestionId = 9;
  }
  
  const nextQuestionElement = document.querySelector(`.form-question[data-question-id="${nextQuestionId}"]`);
  return nextQuestionElement;
}

function getCurrentLanguage() {
  const langSwitch = document.getElementById('lang-switch');
  return langSwitch.checked ? "ES" : "EN";
}

document.getElementById('close-chatbot').addEventListener('click', function () {
  window.history.back();
});

function switchLanguage() {
  
  if (window.pc) {
    console.log("Closing existing peer connection");
    

    
    const dataChannels = window.pc.getDataChannels?.() || [];
    dataChannels.forEach(channel => {
      if (channel) {
        channel.close();
      }
    });
   
    window.pc.close();
    window.pc = null;
  }
  
  teardownRTC();  
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(element => {
    element.pause();
    element.srcObject = null;
    element.remove();
  });
  

  console.log("Reinitializing with new language");
  setTimeout(() => {
    init().catch(err => console.error("Error reinitializing connection:", err));
  }, 500);
}

function resetAgent() {
  console.log("Resetting agent for language change...");
  
  if (window.pc) {
    console.log("Closing existing peer connection");
    window.pc.close();
    window.pc = null;
  }
  
  teardownRTC(); 
  
  const existingAudio = document.querySelector('audio');
  if (existingAudio) {
    console.log("Removing existing audio element");
    existingAudio.remove();
  }

  updateUIForLanguage(getCurrentLanguage());
}

function updateUIForLanguage(language) {
  console.log(`Updating UI for language: ${language}`);
  const pageTitle = document.querySelector('.page-title');
  
  if (language === 'EN') {
    pageTitle.textContent = 'One voice. One step closer to the help you need.';

    const formTitle = document.querySelector('.form-container h3');
    if (formTitle) {
      formTitle.textContent = 'Food Bank Assistance Form';
    }
    const formDescription = document.querySelector('.form-container .text-muted');
    if (formDescription) {
      formDescription.textContent = 'Our voice assistant will guide you through these questions to help find the right food bank services for your needs.';
    }
  } else {
    pageTitle.textContent = 'Una voz. Un paso más cerca de la ayuda que necesitas.';

    const formTitle = document.querySelector('.form-container h3');
    if (formTitle) {
      formTitle.textContent = 'Formulario de Asistencia del Banco de Alimentos';
    }
    const formDescription = document.querySelector('.form-container .text-muted');
    if (formDescription) {
      formDescription.textContent = 'Nuestro asistente de voz le guiará a través de estas preguntas para ayudarle a encontrar los servicios del banco de alimentos adecuados para sus necesidades.';
    }
  }
}


// document.addEventListener('DOMContentLoaded', function() {
//   console.log("Setting up language toggle event listener");
  
//   const langToggle = document.getElementById('lang-switch');
//   if (langToggle) {
//     updateUIForLanguage(getCurrentLanguage());
  
//     langToggle.addEventListener('change', function() {
//       const newLanguage = getCurrentLanguage();
//       console.log(`Language changed to: ${newLanguage}`);
    
//       resetAgent();
    
//       setTimeout(() => {
//         init().catch(err => console.error("Error reinitializing connection:", err));
//       }, 300);
//     });
    
//     console.log("Language toggle listener setup complete");
//   } else {
//     console.warn("Language toggle element not found in the DOM");
//   }
// });

document.addEventListener('DOMContentLoaded', function() {
  console.log("Setting up language toggle event listener");
  
  const langToggle = document.getElementById('lang-switch');
  if (langToggle) {
    // Add change event listener
    langToggle.addEventListener('change', function() {
      const newLanguage = getCurrentLanguage();
      console.log(`Language changed to: ${newLanguage}`);
      
      // Switch to new language
      switchLanguage();
    });
    
    console.log("Language toggle listener setup complete");
  } else {
    console.warn("Language toggle element not found in the DOM");
  }
});



  async function loadFoodBankData() {
  try {
    const response = await fetch('/static/cafb_db.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const foodBanks = await response.json();
    console.log(`Loaded ${foodBanks.length} food bank records`);
    return foodBanks;
  } catch (error) {
    console.error("Error loading food bank data:", error);
   
    return defaultFoodBanks;
  }
  }

  function normalizeFormData(formData) {
    const updatedForm = {...formData};
    
    // Normalize food_format
    if (updatedForm.foodFormat && updatedForm.foodFormat.includes("Any")) {
      updatedForm.foodFormat = [
        "Loose groceries",
        "Pre-bagged or boxed groceries",
        "Prepared meals"
      ];
    }
    
    // Normalize dietary_pref
    const cultureMap = {
      "Halal": ["Middle Eastern/North African"],
      "Kosher": ["Eastern European", "Middle Eastern/North African"],
      "Vegetarian": ["Central/South Asian", "East Asian"],
      "Vegan": ["Central/South Asian", "East Asian"]
    };
    
    if (updatedForm.dietaryPreferences) {
      let expanded = [];
      if (updatedForm.dietaryPreferences.includes("None")) {
        expanded = [
          "Latin American", "West African", "East African",
          "Central/South Asian", "East Asian", "Eastern European", "Middle Eastern/North African"
        ];
      } else {
        updatedForm.dietaryPreferences.forEach(item => {
          if (cultureMap[item]) {
            expanded.push(...cultureMap[item]);
          } else {
            expanded.push(item);
          }
        });
      }
      
      // Remove duplicates
      updatedForm.dietaryPreferences = [...new Set(expanded)];
    }
    
    return updatedForm;
  }
  
  function getSelectedCheckboxValues(idArray) {
    return idArray
      .filter(id => document.getElementById(id)?.checked)
      .map(id => document.getElementById(id).value);
  }
  
  function shouldShowQuestion(questionId) {
    switch(questionId) {
      case "3": 
        return document.getElementById("kitchen-yes")?.checked || false;
        
      case "6": 
        return false;
        
      case "7": 
        return document.getElementById("travel-yes")?.checked || 
               document.getElementById("someone-yes")?.checked || false;
        
      case "8": 
        return document.getElementById("day-another")?.checked || false;
        
      case "9":
      case "10": 
        return document.getElementById("travel-yes")?.checked || 
               document.getElementById("someone-yes")?.checked || false;
        
      case "11":
        return false;

      case "12":
        return true;

      // case "1":
      // case "2": 
      // case "4":
      // case "5":
      // case "12":
      //   return true;
    
        
      default:
        return true;
    }
  }
  
  function generateFormSummary(formData) {
    let summary = [];
    
    if (formData.name) {
      summary.push(`Name: ${formData.name}`);
    }
    
    if (formData.hasKitchen) {
      summary.push("Has access to a kitchen");
    } else {
      summary.push("Does not have access to a kitchen");
    }
    
    if (formData.foodFormat && formData.foodFormat.length > 0) {
      summary.push(`Food format preference: ${formData.foodFormat.join(", ")}`);
    }
    
    if (formData.dietaryPreferences && formData.dietaryPreferences.length > 0 && !formData.dietaryPreferences.includes("None")) {
      summary.push(`Dietary preferences: ${formData.dietaryPreferences.join(", ")}`);
    }
    
    if (formData.canTravel) {
      summary.push("Can travel to pick up food");
      
      if (formData.dayPreference) {
        if (formData.dayPreference === "Today") {
          summary.push("Preferred pickup day: Today");
        } else if (formData.specificDays && formData.specificDays.length > 0) {
          summary.push(`Preferred pickup days: ${formData.specificDays.join(", ")}`);
        }
      }
      
      if (formData.preferredTime && formData.preferredTime.length > 0) {
        summary.push(`Preferred pickup time: ${formData.preferredTime.join(", ")}`);
      }
    } else {
      summary.push("Needs home delivery");
    }
    
    if (formData.location) {
      summary.push(`Location: ${formData.location}`);
    }
    
    if (formData.comments) {
      summary.push(`Additional comments: ${formData.comments}`);
    }
    
    return summary.join(". ");
  }
  
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
      const formStatus = fns.getFormStatus();
      if (!formStatus.isCompleted) {
        return {
          success: false,
          message: "User has not filled all details in the form yet - get next question in the form, fill it and once complete come back again"
        };
      }

      try {
        if (!window.userLocation) {
          await getUserLocation();
          if (!window.userLocation) {
            throw new Error("Could not access your current location");
          }
        }
        const userLat = window.userLocation.latitude;
        const userLon = window.userLocation.longitude;
        const locationStr = `${userLat}, ${userLon}`;
        const nearestFoodBank = findNearestFoodBankVoice(locationStr);
        if (typeof nearestFoodBank === 'string') {
          return { success: false, error: nearestFoodBank };
        }
        const foodBankLat = nearestFoodBank.lat;
        const foodBankLon = nearestFoodBank.lon;
        const newInputStr = `${userLat}, ${userLon}, ${foodBankLat}, ${foodBankLon}`;
        const results = await planTransit(newInputStr);

        return {
          success: true,
          user_location: { latitude: userLat, longitude: userLon },
          nearest_food_bank: nearestFoodBank.name,
        food_bank_details: {
          address: nearestFoodBank.address,
          phone: nearestFoodBank.phone,
          food_format: nearestFoodBank.foodFormat,
          day_available: nearestFoodBank.dayOfWeek,
          hours: nearestFoodBank.hours,
          frequency: nearestFoodBank.frequency,
          appointment_required: nearestFoodBank.appointment,
          requirements: nearestFoodBank.requirements,
          offers_delivery: nearestFoodBank.offersDelivery
        },
          distance_km: haversineDistance(userLat, userLon, foodBankLat, foodBankLon).toFixed(2),
          transit_options: JSON.parse(results)
        };

      } catch (e) {
        return { success: false, error: `Error: ${e.toString()}` };
      }
    },
     
    
    processFormInput: ({ questionId, answer }) => {
      try {
 // First try to find the question by ID
 let questionElement = document.querySelector(`.form-question[data-question-id="${questionId}"]`);
        
  // If not found, try to infer the question ID from field names or labels
        if (!questionElement) {
    // Handle case where agent passes the field name instead of the question ID
    const nameToIdMap = {
      'name': '1',
      'kitchen': '2', 'kitchen access': '2',
      'food': '3', 'food format': '3',
      'dietary': '4', 'preferences': '4', 'dietary preferences': '4',
      'travel': '5', 'travel ability': '5',
      'someone': '6', 'someone else': '6',
      'day': '7', 'when': '7',
      'which day': '8', 'specific day': '8',
      'time': '9', 'preferred time': '9',
      'location': '10',
      'delivery': '11', 'delivery time': '11',
      'comments': '12'
    };
    
    // Try to look up the correct ID
    const correctedId = nameToIdMap[questionId.toLowerCase()];
    if (correctedId) {
      questionId = correctedId;
      questionElement = document.querySelector(`.form-question[data-question-id="${questionId}"]`);
    }
    
    // If still not found, try to find the active question
    if (!questionElement) {
      questionElement = document.querySelector('.form-question.active');
      if (questionElement) {
        questionId = questionElement.dataset.questionId;
        console.log(`Using active question with ID: ${questionId}`);
      }
    }
  }
  
  if (!questionElement) {
    return { success: false, error: "Question not found. Please try again with the correct question ID." };
        }
       
        // Process the answer based on question ID
        switch(questionId) {
          case "1": // Name
          const nameInput = document.getElementById("name");
          nameInput.value = answer;
          console.log(`Set name input value to: ${nameInput.value}`);
            break;
            
          case "2": // Kitchen access
            const kitchenAccess = answer.toLowerCase();
          const kitchenYes = document.getElementById("kitchen-yes");
          const kitchenNo = document.getElementById("kitchen-no");
          
          // Clear previous selection first
          kitchenYes.checked = false;
          kitchenNo.checked = false;
            
          // Set new selection with debug logs
          if (kitchenAccess.includes("yes")) {
            kitchenYes.checked = true;
            console.log("Set kitchen-yes to checked");
          } else if (kitchenAccess.includes("no")) {
            kitchenNo.checked = true;
            console.log("Set kitchen-no to checked");
          }
          
          // Manually trigger change event to ensure UI updates
          const changeEvent = new Event('change', { bubbles: true });
          kitchenYes.checked ? kitchenYes.dispatchEvent(changeEvent) : kitchenNo.dispatchEvent(changeEvent);
            break;
            
          case "3": // Food format
  // Food format
            const foodOptions = answer.toLowerCase().split(',').map(opt => opt.trim());
          const foodLoose = document.getElementById("food-loose");
          const foodPackaged = document.getElementById("food-packaged");
          const foodPrepared = document.getElementById("food-prepared");
          const foodAny = document.getElementById("food-any");
          
          // Clear previous selections
          foodLoose.checked = false;
          foodPackaged.checked = false;
          foodPrepared.checked = false;
          foodAny.checked = false;
          
          // Set new selections with debug logs
          if (foodOptions.some(opt => opt.includes("loose"))) {
            foodLoose.checked = true;
            console.log("Set food-loose to checked");
          }
          if (foodOptions.some(opt => opt.includes("bagged") || opt.includes("boxed"))) {
            foodPackaged.checked = true;
            console.log("Set food-packaged to checked");
          }
          if (foodOptions.some(opt => opt.includes("prepared") || opt.includes("meal"))) {
            foodPrepared.checked = true;
            console.log("Set food-prepared to checked");
          }
          if (foodOptions.some(opt => opt.includes("any"))) {
            foodAny.checked = true;
            console.log("Set food-any to checked");
          }
          
          // Trigger change events
          [foodLoose, foodPackaged, foodPrepared, foodAny].forEach(checkbox => {
            if (checkbox.checked) {
              checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
            break;
            
// Continuing from the previous case statements...
            
          case "4": // Dietary preferences
            const dietaryPrefs = answer.toLowerCase().split(',').map(pref => pref.trim());
          
          // Clear all previous dietary preference selections
          const dietaryCheckboxes = [
            "pref-latin", "pref-westafrican", "pref-eastafrican", "pref-southasian",
            "pref-eastasian", "pref-easteuropean", "pref-middleeastern", "pref-halal",
            "pref-kosher", "pref-vegetarian", "pref-vegan", "pref-none"
          ];
          
          // Uncheck all first
          dietaryCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
              checkbox.checked = false;
            }
          });
          
          // Then check the ones mentioned in answer
          const dietaryKeywords = {
            "latin": "pref-latin",
            "west african": "pref-westafrican", 
            "east african": "pref-eastafrican",
            "central asian": "pref-southasian", "south asian": "pref-southasian",
            "east asian": "pref-eastasian",
            "eastern european": "pref-easteuropean",
            "middle eastern": "pref-middleeastern", "north african": "pref-middleeastern",
            "halal": "pref-halal",
            "kosher": "pref-kosher",
            "vegetarian": "pref-vegetarian",
            "vegan": "pref-vegan",
            "none": "pref-none"
          };
          
          // Check matching preferences
          dietaryPrefs.forEach(pref => {
            for (const [keyword, id] of Object.entries(dietaryKeywords)) {
              if (pref.includes(keyword)) {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                  checkbox.checked = true;
                  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(`Set ${id} to checked`);
                }
              }
            }
          });
            break;
            
          case "5": // Travel ability
            const canTravel = answer.toLowerCase();
          const travelYes = document.getElementById("travel-yes");
          const travelNo = document.getElementById("travel-no");
          
          // Clear previous selection first
          travelYes.checked = false;
          travelNo.checked = false;
            
          // Set new selection
          if (canTravel.includes("yes")) {
            travelYes.checked = true;
            console.log("Set travel-yes to checked");
          } else if (canTravel.includes("no")) {
            travelNo.checked = true;
            console.log("Set travel-no to checked");
          }
          
          // Trigger change event
          travelYes.checked ? travelYes.dispatchEvent(new Event('change', { bubbles: true })) : 
                            travelNo.dispatchEvent(new Event('change', { bubbles: true }));
            break;
            
          case "6": // Someone else can pick up
            const someoneElse = answer.toLowerCase();
          const someoneYes = document.getElementById("someone-yes");
          const someoneNo = document.getElementById("someone-no");
          
          // Clear previous selection
          someoneYes.checked = false;
          someoneNo.checked = false;
            
          // Set new selection
          if (someoneElse.includes("yes")) {
            someoneYes.checked = true;
            console.log("Set someone-yes to checked");
          } else if (someoneElse.includes("no")) {
            someoneNo.checked = true;
            console.log("Set someone-no to checked");
          }
          
          // Trigger change event
          someoneYes.checked ? someoneYes.dispatchEvent(new Event('change', { bubbles: true })) : 
                              someoneNo.dispatchEvent(new Event('change', { bubbles: true }));
            break;
            
        case "7": // Day preference
            const dayPref = answer.toLowerCase();
          const dayToday = document.getElementById("day-today");
          const dayAnother = document.getElementById("day-another");
          
          // Clear previous selection
          dayToday.checked = false;
          dayAnother.checked = false;
            
          // Set new selection
          if (dayPref.includes("today")) {
            dayToday.checked = true;
            console.log("Set day-today to checked");
          } else if (dayPref.includes("another")) {
            dayAnother.checked = true;
            console.log("Set day-another to checked");
          }
          
          // Trigger change event
          dayToday.checked ? dayToday.dispatchEvent(new Event('change', { bubbles: true })) : 
                            dayAnother.dispatchEvent(new Event('change', { bubbles: true }));
            break;
            
          case "8": // Specific day selection
            const dayOptions = answer.toLowerCase().split(',').map(day => day.trim());
          
          // Clear all previous day selections
          const dayCheckboxes = [
            "day-tomorrow", "day-monday", "day-tuesday", "day-wednesday",
            "day-thursday", "day-friday", "day-saturday", "day-sunday"
          ];
          
          // Uncheck all first
          dayCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
              checkbox.checked = false;
            }
          });
          
          // Then check the ones mentioned in answer
          const dayKeywords = {
            "tomorrow": "day-tomorrow",
            "monday": "day-monday",
            "tuesday": "day-tuesday",
            "wednesday": "day-wednesday",
            "thursday": "day-thursday",
            "friday": "day-friday",
            "saturday": "day-saturday",
            "sunday": "day-sunday"
          };
          
          // Check matching days
          dayOptions.forEach(day => {
            for (const [keyword, id] of Object.entries(dayKeywords)) {
              if (day.includes(keyword)) {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                  checkbox.checked = true;
                  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log(`Set ${id} to checked`);
                }
              }
            }
          });
            break;
            
          case "9": // Preferred pickup time
            const timeOptions = answer.toLowerCase().split(',').map(time => time.trim());
            
            // Clear previous selections
            const timeCheckboxes = ["time-morning", "time-afternoon", "time-evening"];
            timeCheckboxes.forEach(id => {
              const checkbox = document.getElementById(id);
              if (checkbox) {
                checkbox.checked = false;
              }
            });
            
            // Then check the ones mentioned in answer
            const timeKeywords = {
              "morning": "time-morning",
              "9": "time-morning",
              "10": "time-morning",
              "11": "time-morning",
              "afternoon": "time-afternoon",
              "12": "time-afternoon",
              "1": "time-afternoon",
              "2": "time-afternoon",
              "3": "time-afternoon",
              "evening": "time-evening",
              "4": "time-evening",
              "5": "time-evening",
              "6": "time-evening",
              "7": "time-evening"
            };
            
            // Check matching times
            timeOptions.forEach(time => {
              for (const [keyword, id] of Object.entries(timeKeywords)) {
                if (time.includes(keyword)) {
                  const checkbox = document.getElementById(id);
                  if (checkbox) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`Set ${id} to checked`);
                  }
                }
              }
            });
            break;
          
            
          case "10": // Location
          const locationInput = document.getElementById("location");
          if (locationInput) {
            locationInput.value = answer;
            console.log(`Set location to: ${locationInput.value}`);
            
            // Trigger input and change events
            locationInput.dispatchEvent(new Event('input', { bubbles: true }));
            locationInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
            break;
            
          case "11": // Delivery time
            const deliveryTime = document.getElementById("delivery-time");
          if (deliveryTime) {
            // Set the value directly first
            deliveryTime.value = "";
            
            // Try to find the best match for the time in the options
            for (let i = 0; i < deliveryTime.options.length; i++) {
              const optionText = deliveryTime.options[i].text.toLowerCase();
              if (answer.toLowerCase().includes(optionText) || 
                  optionText.includes(answer.toLowerCase())) {
                deliveryTime.selectedIndex = i;
                console.log(`Set delivery time to option ${i}: ${deliveryTime.options[i].text}`);
                break;
              }
            }
            
            // If no match found but answer contains time indicators, try best guess
            if (deliveryTime.selectedIndex === 0) {
              if (answer.toLowerCase().includes("morning") || 
                  answer.toLowerCase().includes("9") || 
                  answer.toLowerCase().includes("10") || 
                  answer.toLowerCase().includes("11")) {
                deliveryTime.selectedIndex = 1; // Morning option
              } else if (answer.toLowerCase().includes("afternoon") || 
                        answer.toLowerCase().includes("12") || 
                        answer.toLowerCase().includes("1") || 
                        answer.toLowerCase().includes("2") || 
                        answer.toLowerCase().includes("3")) {
                deliveryTime.selectedIndex = 2; // Afternoon option
              } else if (answer.toLowerCase().includes("evening") || 
                        answer.toLowerCase().includes("4") || 
                        answer.toLowerCase().includes("5") || 
                        answer.toLowerCase().includes("6")) {
                deliveryTime.selectedIndex = 3; // Evening option
              }
            }
            
            // Trigger change event
            deliveryTime.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break;
            
          case "12": // Comments
          const commentsInput = document.getElementById("comments");
          if (commentsInput) {
            commentsInput.value = answer;
            console.log(`Set comments to: ${commentsInput.value}`);
            
            // Trigger input and change events
            commentsInput.dispatchEvent(new Event('input', { bubbles: true }));
            commentsInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          questionElement.classList.remove("active");
          questionElement.classList.add("completed");
          
          const formQuestions = document.getElementById('formQuestions');
          const formControls = document.querySelector('.form-controls');
          const completionImage = document.querySelector('.completion-image');
          
          if (formQuestions) formQuestions.style.display = 'none';
          if (formControls) formControls.style.display = 'none';
          if (completionImage) completionImage.style.display = 'flex';
          
          const progressBar = document.getElementById('formProgress');
          if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
            progressBar.setAttribute('aria-valuenow', 100);
          }
          
          return {
            success: true,
            questionId: questionId,
            answer: answer,
            formCompleted: true,
            nextQuestionId: null,
            skipLogicApplied: false,
            recordedAnswer: answer,
            message: "Form has been completed successfully! Proceed to finding transit options to the nearest food bank"
          };
          break;
        }
        
        // Mark current question as completed
        questionElement.classList.remove("active");
        questionElement.classList.add("completed");
        
        // Determine next question based on user's answers and logic
        let nextQuestionId = parseInt(questionId) + 1;
        
        // Apply skip logic
        if (questionId === "2" && document.getElementById("kitchen-no").checked) {
          // Skip food format question
          nextQuestionId = 4;
        } else if (questionId === "5" && document.getElementById("travel-yes").checked) {
          // Skip the someone else question
          nextQuestionId = 7;
        } else if (questionId === "6" && document.getElementById("someone-no").checked) {
          // Skip to delivery time question
          nextQuestionId = 11;
        } else if (questionId === "7" && document.getElementById("day-today").checked) {
          // Skip specific day selection
          nextQuestionId = 9;
        }
        
        // Activate next question
        const nextQuestionElement = document.querySelector(`.form-question[data-question-id="${nextQuestionId}"]`);
        if (nextQuestionElement) {
          nextQuestionElement.classList.add("active");
          setTimeout(scrollToActiveQuestion, 100); 
        }
        
        // Update progress bar
        updateFormProgress();
        // if (nextQuestionId > 9) {
        //   // Mark the form as completed by setting nextQuestionId = null
        //   nextQuestionId = null;
        // }
        return {
          success: true,
          questionId: questionId,
          answer: answer,
          formCompleted: !nextQuestionElement,
          nextQuestionId: nextQuestionElement ? nextQuestionId : null,
          skipLogicApplied: nextQuestionId > parseInt(questionId) + 1,
          recordedAnswer: answer,            // 📣 echo back what was set
          message: `Recorded answer for question ${questionId}: "${answer}"`
        };
      } catch (e) {
        return { success: false, error: e.toString() };
      }
    },
    
    // Updated getNextFormQuestion function

    // getNextFormQuestion: async() => {
    //   const profileData = await loadUserProfile();
    //   const activeQuestion = document.querySelector('.form-question.active');
    //   if(!activeQuestion){
    //     const questions = document.querySelectorAll('.form-question');
    //     let firstUnansweredQuestion = null;

    //     for (const question of questions){
    //       const questionId = question.dataset.questionId;
    //       if (prodileData && isQuestionAnsweredFromProfile(questionId, profileData)){
    //         autoFillQuestionFromProfile(questionId, profileData);

    //       }
    //     }
    //   }

    // }

    

    // getNextFormQuestion: async () => {
    //   // First load profile data if available
    //   const profileData = await loadUserProfile();
      
    //   // If there's no active question, find the first unanswered question
    //   const activeQuestion = document.querySelector('.form-question.active');
      
    //   if (!activeQuestion) {
    //     // Start from the beginning and find first unanswered question
    //     const questions = document.querySelectorAll('.form-question');
    //     let firstUnansweredQuestion = null;
        
    //     for (const question of questions) {
    //       const questionId = question.dataset.questionId;
          
    //       // Check if this question is already answered from profile
    //       if (profileData && isQuestionAnsweredFromProfile(questionId, profileData)) {
    //         // Auto-fill this question with profile data
    //         autoFillQuestionFromProfile(questionId, profileData);
    //         question.classList.add('completed');
    //       } else if (!firstUnansweredQuestion) {
    //         // This is the first question without an answer
    //         firstUnansweredQuestion = question;
    //         break;
    //       }
    //     }
        
    //     // Activate the first unanswered question
    //     if (firstUnansweredQuestion) {
    //       firstUnansweredQuestion.classList.add('active');
    //       updateFormProgress();
    //       setTimeout(scrollToActiveQuestion, 100);
    //       return {
    //         success: true,
    //         questionId: firstUnansweredQuestion.dataset.questionId,
    //         questionText: firstUnansweredQuestion.querySelector('.form-label').innerText,
    //         exactQuestion: true
    //       };
    //     } else {
    //       // All questions are answered
    //       return { 
    //         success: true,
    //         formCompleted: true,
    //         message: "All questions have been answered based on your profile data."
    //       };
    //     }
    //   }
      
    //   // Get the current active question information
    //   const currentQuestionId = activeQuestion.dataset.questionId;
    //   const questionText = activeQuestion.querySelector('.form-label').innerText;
      
    //   // Modify question text based on previous answers (same as your existing code)
    //   let modifiedText = questionText;
      
    //   if (currentQuestionId === "6" && document.getElementById("travel-no")?.checked) {
    //     modifiedText = "Can someone else pick up food for you?";
    //   }
      
    //   if (currentQuestionId === "7") {
    //     const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
    //     if (someoneElse) {
    //       modifiedText = "When would they like to go?";
    //     }
    //   }
      
    //   if (currentQuestionId === "8") {
    //     const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
    //     if (someoneElse) {
    //       modifiedText = "Which day would they prefer?";
    //     }
    //   }
      
    //   if (currentQuestionId === "9") {
    //     const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
    //     if (someoneElse) {
    //       modifiedText = "What time would they prefer?";
    //     }
    //   }
      
    //   return {
    //     success: true,
    //     questionId: currentQuestionId,
    //     questionText: modifiedText,
    //     originalText: questionText
    //   };
    // },

    getNextFormQuestion: async () => {
      // Load profile data if not already loaded
      if (userProfileData === null) {
        userProfileData = await loadUserProfile();
        
        if (userProfileData) {
          console.log("First load of profile data, auto-filling form");
          const questions = document.querySelectorAll('.form-question');
          questions.forEach(question => {
            const questionId = question.dataset.questionId;
            if (isQuestionAnsweredFromProfile(questionId, userProfileData)) {
              autoFillQuestionFromProfile(questionId, userProfileData);
              question.classList.add('completed');
            }
          });
          updateFormProgress();
        }
      }
      
      const activeQuestion = document.querySelector('.form-question.active');
      
      if (!activeQuestion) {
        // Find first unanswered question
        const questions = document.querySelectorAll('.form-question');
        let firstUnansweredQuestion = null;
        
        for (const question of questions) {
          if (!question.classList.contains('completed')) {
            firstUnansweredQuestion = question;
            break;
          }
        }
        
        if (firstUnansweredQuestion) {
          firstUnansweredQuestion.classList.add('active');
          updateFormProgress();
          setTimeout(scrollToActiveQuestion, 100);
          return {
            success: true,
            questionId: firstUnansweredQuestion.dataset.questionId,
            questionText: firstUnansweredQuestion.querySelector('.form-label').innerText,
            exactQuestion: true
          };
        } else {
          return { 
            success: true,
            formCompleted: true,
            message: "All questions have been answered based on your profile data."
          };
        }
      }
      
      const currentQuestionId = activeQuestion.dataset.questionId;
      const hasValue = checkIfQuestionHasResponse(currentQuestionId);
      
      if (!hasValue) {
        // Current question hasn't been answered yet, don't move to next question
        return {
          success: false,
          questionId: currentQuestionId,
          questionText: activeQuestion.querySelector('.form-label').innerText,
          message: "Please answer this question before moving to the next one.",
          needsAnswer: true
        };
      }
      
      // Current question has been answered but not marked as completed yet
      // This means processFormInput wasn't called, so we need to keep asking this question
      if (!activeQuestion.classList.contains('completed')) {
        const questionText = activeQuestion.querySelector('.form-label').innerText;
        
        // Apply question text modifications based on previous answers
        let modifiedText = questionText;
        
        if (currentQuestionId === "6" && document.getElementById("travel-no")?.checked) {
          modifiedText = "Can someone else pick up food for you?";
        }
        
        if (currentQuestionId === "7") {
          const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
          if (someoneElse) {
            modifiedText = "When would they like to go?";
          }
        }
        
        if (currentQuestionId === "8") {
          const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
          if (someoneElse) {
            modifiedText = "Which day would they prefer?";
          }
        }
        
        if (currentQuestionId === "9") {
          const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
          if (someoneElse) {
            modifiedText = "What time would they prefer?";
          }
        }
        
        return {
          success: false,
          questionId: currentQuestionId,
          questionText: modifiedText,
          originalText: questionText,
          message: "Please process this answer with processFormInput before continuing.",
          needsProcessing: true
        };
      }
      
      // If we reach here, the question is completed, find the next question
      const nextQuestion = getNextQuestionElement(currentQuestionId);
      
      if (nextQuestion) {
        return {
          success: true,
          questionId: nextQuestion.dataset.questionId,
          questionText: nextQuestion.querySelector('.form-label').innerText,
          exactQuestion: true
        };
      } else {
        return {
          success: true,
          formCompleted: true,
          message: "All questions have been answered. The form is complete."
        };
      }
    },

    // getNextFormQuestionNext: (async) => {
    //   const activequestion = document.querySelector('.form-question.active')

    //   const firstquestion = document.querySelector('.form-question')

    // }
    // getNextFormQuestion: () => {
    //   const activeQuestion = document.querySelector('.form-question.active');
      
    //   if (!activeQuestion) {
    //     // If no question is active, activate the first one
    //     const firstQuestion = document.querySelector('.form-question');
    //     if (firstQuestion) {
    //       firstQuestion.classList.add('active');
    //       updateFormProgress();
    //       setTimeout(scrollToActiveQuestion, 100);
    //       return {
    //         success: true,
    //         questionId: firstQuestion.dataset.questionId,
    //         questionText: firstQuestion.querySelector('.form-label').innerText,
    //         exactQuestion: true
    //       };
    //     } else {
    //       return { success: false, error: "No questions found" };
    //     }
    //   }
      
    //   // Get the current active question information
    //   const currentQuestionId = activeQuestion.dataset.questionId;
    //   const questionText = activeQuestion.querySelector('.form-label').innerText;
      
    //   // Handle conditional text based on previous answers
    //   let modifiedText = questionText;
      
    //   // Modify question text based on previous answers
    //   if (currentQuestionId === "6" && document.getElementById("travel-no").checked) {
    //     modifiedText = "Can someone else pick up food for you?";
    //   }
      
    //   if (currentQuestionId === "7") {
    //     // Check if someone else is picking up
    //     const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
    //     if (someoneElse) {
    //       modifiedText = "When would they like to go?";
    //     }
    //   }
      
    //   if (currentQuestionId === "8") {
    //     // Check if someone else is picking up
    //     const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
    //     if (someoneElse) {
    //       modifiedText = "Which day would they prefer?";
    //     }
    //   }
      
    //   if (currentQuestionId === "9") {
    //     // Check if someone else is picking up
    //     const someoneElse = document.getElementById("someone-yes") && document.getElementById("someone-yes").checked;
    //     if (someoneElse) {
    //       modifiedText = "What time would they prefer?";
    //     }
    //   }
      
    //   return {
    //     success: true,
    //     questionId: currentQuestionId,
    //     questionText: modifiedText,
    //     originalText: questionText
    //   };
    // },
    
    // Updated getFormStatus function
    getFormStatus: () => {
      const totalQuestions = document.querySelectorAll('.form-question').length;
      // const visibleQuestions = document.querySelectorAll('.form-question:not([style*="display: none"])').length || totalQuestions;
      const completedQuestions = document.querySelectorAll('.form-question.completed').length;
      const currentQuestion = document.querySelector('.form-question.active');
      let visibleQuestions = 0;
      document.querySelectorAll('.form-question').forEach(question => {
        const questionId = question.dataset.questionId;
        if (shouldShowQuestion(questionId)) {
          visibleQuestions++;
        }
      });
    
      // Calculate completed visible questions
      let completedVisibleQuestions = 0;
      document.querySelectorAll('.form-question.completed').forEach(question => {
        const questionId = question.dataset.questionId;
        if (shouldShowQuestion(questionId)) {
          completedVisibleQuestions++;
        }
      });
      
      // Calculate progress based on visible questions only, accounting for skip logic
      const progress = visibleQuestions === 0 ? 0 : Math.round((completedVisibleQuestions / visibleQuestions) * 100);


              // Check if form is completed
      const isCompleted = visibleQuestions > 0 && completedVisibleQuestions >= visibleQuestions;
      
      if (isCompleted) {
        // Hide the form questions and controls
        const formQuestions = document.getElementById('formQuestions');
        const formControls = document.querySelector('.form-controls');
        const completionImage = document.querySelector('.completion-image');
        
        if (formQuestions) formQuestions.style.display = 'none';
        if (formControls) formControls.style.display = 'none';
        if (completionImage) completionImage.style.display = 'flex';
      }
      
      // For backward compatibility with existing code
      if (document.getElementById("name") && document.getElementById("kitchen-yes")) {
        // New food bank form is present
        // Gather form data to summarize user preferences
        const formData = {
          name: document.getElementById("name")?.value || "",
          hasKitchen: document.getElementById("kitchen-yes")?.checked || false,
          foodFormat: getSelectedCheckboxValues([
            "food-loose", "food-packaged", "food-prepared", "food-any"
          ]),
          dietaryPreferences: getSelectedCheckboxValues([
            "pref-latin", "pref-westafrican", "pref-eastafrican", "pref-southasian",
            "pref-eastasian", "pref-easteuropean", "pref-middleeastern", "pref-halal",
            "pref-kosher", "pref-vegetarian", "pref-vegan", "pref-none"
          ]),
          canTravel: document.getElementById("travel-yes")?.checked || false,
          // Remove someoneElseCanPickup field
          dayPreference: document.getElementById("day-today")?.checked ? "Today" : 
                        (document.getElementById("day-another")?.checked ? "Another day" : ""),
          specificDays: getSelectedCheckboxValues([
            "day-tomorrow", "day-monday", "day-tuesday", "day-wednesday",
            "day-thursday", "day-friday", "day-saturday", "day-sunday"
          ]),
          preferredTime: getSelectedCheckboxValues([
            "time-morning", "time-afternoon", "time-evening"
          ]),
          location: document.getElementById("location")?.value || "",
          comments: document.getElementById("comments")?.value || ""
        };
        
        // Determine if home delivery is required
        const needsHomeDelivery = !formData.canTravel;


        // const check_summary = generateFormSummary(formData)
        // console.log(check_summary)

        const check_summary = generateFormSummary(formData)
        console.log(check_summary)
        
        return {
          success: true,
          totalQuestions: totalQuestions,
          visibleQuestions: visibleQuestions,
          completedQuestions: completedQuestions,
          progress: progress,
          currentQuestionId: currentQuestion ? currentQuestion.dataset.questionId : null,
          isCompleted: completedQuestions === visibleQuestions,
          formData: formData,
          needsHomeDelivery: needsHomeDelivery,
          summary: generateFormSummary(formData)
        };
      } else {
        // Original form is present - backward compati
        // bility
        return {
          success: true,
          totalQuestions: totalQuestions,
          completedQuestions: completedQuestions,
          progress: Math.round((completedQuestions / totalQuestions) * 100),
          currentQuestionId: currentQuestion ? currentQuestion.dataset.questionId : null,
          isCompleted: completedQuestions === totalQuestions
        };
      }
    }
  };

  // Checks if a question can be answered from profile data
function isQuestionAnsweredFromProfile(questionId, profileData) {
  if (!profileData) return false;
  
  switch(questionId) {
    case "2": 
      return !!profileData.kitchen_access;
    
    case "4": 
      return !!profileData.dietary_restrictions;
    
    case "5": 
      return !!profileData.transport;
    
    case "10":
      return !!(profileData.address || profileData.location);
    
    default:
      return false;
  }
}

function autoFillQuestionFromProfile(questionId, profileData) {
  if (!profileData) return;
  
  console.log(`Auto-filling question ${questionId} from profile data`);
  
  switch(questionId) {
    case "2": 
      if (profileData.kitchen_access === "Yes") {
        document.getElementById("kitchen-yes").checked = true;
      } else if (profileData.kitchen_access === "No") {
        document.getElementById("kitchen-no").checked = true;
      }
      
      const kitchenEvent = new Event('change', { bubbles: true });
      document.getElementById("kitchen-yes").checked ? 
        document.getElementById("kitchen-yes").dispatchEvent(kitchenEvent) : 
        document.getElementById("kitchen-no").dispatchEvent(kitchenEvent);
      break;
    
    case "4": 
      if (profileData.dietary_restrictions) {
        const dietaryPrefs = profileData.dietary_restrictions.split(',').map(pref => pref.trim());
        
        const dietaryMap = {
          "Latin American": "pref-latin",
          "West African": "pref-westafrican", 
          "East African": "pref-eastafrican",
          "Central/South Asian": "pref-southasian",
          "East Asian": "pref-eastasian",
          "Eastern European": "pref-easteuropean",
          "Middle Eastern/North African": "pref-middleeastern",
          "Halal": "pref-halal",
          "Kosher": "pref-kosher",
          "Vegetarian": "pref-vegetarian",
          "Vegan": "pref-vegan"
        };
       
        dietaryPrefs.forEach(pref => {
          const checkboxId = dietaryMap[pref];
          if (checkboxId && document.getElementById(checkboxId)) {
            document.getElementById(checkboxId).checked = true;
            document.getElementById(checkboxId).dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        if (!dietaryPrefs.some(pref => dietaryMap[pref])) {
          document.getElementById("pref-none").checked = true;
          document.getElementById("pref-none").dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      break;
    
    case "5": 
      if (profileData.transport) {
        if (profileData.transport.includes("Own Transport")) {
          document.getElementById("travel-yes").checked = true;
        } else {
          document.getElementById("travel-no").checked = true;
        }
       
        const travelEvent = new Event('change', { bubbles: true });
        document.getElementById("travel-yes").checked ? 
          document.getElementById("travel-yes").dispatchEvent(travelEvent) : 
          document.getElementById("travel-no").dispatchEvent(travelEvent);
      }
      break;
    
    case "10": 
      const locationInput = document.getElementById("location");
      if (locationInput) {
        locationInput.value = profileData.address || profileData.location || "";
        locationInput.dispatchEvent(new Event('input', { bubbles: true }));
        locationInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      break;
  }
}

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

  // Updated to handle both form formats
  function updateFormProgress() {
    // Check which form is present by looking for a distinctive element
    const isFoodBankForm = !!document.getElementById("kitchen-yes");
    
    if (isFoodBankForm) {
      // For food bank form with skip logic
      const visibleQuestions = document.querySelectorAll('.form-question:not([style*="display: none"])').length;
      const completedQuestions = document.querySelectorAll('.form-question.completed').length;
      const progress = Math.round((completedQuestions / visibleQuestions) * 100);
      
      const progressBar = document.getElementById('formProgress');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
      }
    } else {
      // Original form logic
      const totalQuestions = document.querySelectorAll('.form-question').length;
      const completedQuestions = document.querySelectorAll('.form-question.completed').length;
      const progress = Math.round((completedQuestions / totalQuestions) * 100);
      
      const progressBar = document.getElementById('formProgress');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
      }
    }
  }

  // Updated resetForm function to handle food bank form
  // function resetForm() {
  //   // Check which form is present by looking for a distinctive element
  //   const isFoodBankForm = !!document.getElementById("kitchen-yes");
    
  //   if (isFoodBankForm) {
  //     // Reset all input fields
  //     document.getElementById('name').value = '';
      
  //     // Reset all radio buttons
  //     const radioButtons = document.querySelectorAll('input[type="radio"]');
  //     radioButtons.forEach(radio => {
  //       radio.checked = false;
  //     });
      
  //     // Reset all checkboxes
  //     const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  //     checkboxes.forEach(checkbox => {
  //       checkbox.checked = false;
  //     });
      
  //     // Reset select elements
  //     if (document.getElementById('preferred-time')) {
  //       document.getElementById('preferred-time').selectedIndex = 0;
  //     }
  //     if (document.getElementById('delivery-time')) {
  //       document.getElementById('delivery-time').selectedIndex = 0;
  //     }
      
  //     // Reset textarea
  //     document.getElementById('comments').value = '';
  //   } else {
  //     // Original form reset
  //     document.getElementById('name').value = '';
  //     document.getElementById('age').value = '';
  //     document.getElementById('city').value = '';
  //     document.getElementById('transport-bus').checked = false;
  //     document.getElementById('transport-subway').checked = false;
  //     document.getElementById('transport-walk').checked = false;
  //     document.getElementById('comments').value = '';
  //   }
    
  //   // Reset question states (works for both forms)
  //   const questions = document.querySelectorAll('.form-question');
  //   questions.forEach((q, index) => {
  //     q.classList.remove('active', 'completed');
  //     if (index === 0) {
  //       q.classList.add('active');
  //     }
  //   });
   
  //   // Show form questions and controls, hide completion image
  //   const formQuestions = document.getElementById('formQuestions');
  //   const formControls = document.querySelector('.form-controls');
  //   const completionImage = document.querySelector('.completion-image');
    
  //   if (formQuestions) formQuestions.style.display = 'block';
  //   if (formControls) formControls.style.display = 'flex';
  //   if (completionImage) completionImage.style.display = 'none';
   
  //   setTimeout(scrollToActiveQuestion, 100);
  //   // Update progress bar
  //   updateFormProgress();
  // }
  
async function resetForm() {

  const isFoodBankForm = !!document.getElementById("kitchen-yes");
  
  if (isFoodBankForm) {

    document.getElementById('name').value = '';
    
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
      radio.checked = false;
    });
    
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
   
    if (document.getElementById('preferred-time')) {
      document.getElementById('preferred-time').selectedIndex = 0;
    }
    if (document.getElementById('delivery-time')) {
      document.getElementById('delivery-time').selectedIndex = 0;
    }
  
    document.getElementById('comments').value = '';
  } else {

  }
  

  const questions = document.querySelectorAll('.form-question');
  questions.forEach(q => {
    q.classList.remove('active', 'completed');
  });
  
  const formQuestions = document.getElementById('formQuestions');
  const formControls = document.querySelector('.form-controls');
  const completionImage = document.querySelector('.completion-image');
  
  if (formQuestions) formQuestions.style.display = 'block';
  if (formControls) formControls.style.display = 'flex';
  if (completionImage) completionImage.style.display = 'none';

  if (userProfileData) {
    console.log("Auto-filling form from cached profile after reset");
    for (const question of questions) {
      const questionId = question.dataset.questionId;
      if (isQuestionAnsweredFromProfile(questionId, userProfileData)) {
        autoFillQuestionFromProfile(questionId, userProfileData);
        question.classList.add('completed');
      }
    }
  }
  

  const firstUnansweredQuestion = Array.from(questions).find(q => !q.classList.contains('completed'));
  if (firstUnansweredQuestion) {
    firstUnansweredQuestion.classList.add('active');
  } else if (questions.length > 0) {
    questions[0].classList.add('active');
  }
  
  setTimeout(scrollToActiveQuestion, 100);
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



function getCurrentLanguage() {

  const langSwitch = document.getElementById('lang-switch');

  return langSwitch.checked ? "ES" : "EN" ;

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
      
      // Set fixed departure time to April 15, 2025, 4:30 PM EST
      const departureTime = new Date('2025-04-15T16:30:00-04:00');
      
      // Format date and time for the API
      const dateStr = departureTime.toISOString().split('T')[0]; // "2025-04-15"
      const timeStr = "16:30"; // 24-hour format for 4:30 PM
      
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
          const itinerarySummary = await createItinerarySummary(itinerary);
          
          return JSON.stringify([{
              "start_from_your_place_at": "April 15, 2025, 4:30 PM EDT",
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

    function scrollToActiveQuestion() {
      const activeQuestion = document.querySelector('.form-question.active');
      const formContainer = document.querySelector('.form-container');
      
      if (activeQuestion && formContainer) {
       
        const containerRect = formContainer.getBoundingClientRect();
        const questionRect = activeQuestion.getBoundingClientRect();
        const relativePosition = questionRect.top - containerRect.top;
        
        // Scroll with some padding at the top
        const padding = 20;
        formContainer.scrollTo({
          top: formContainer.scrollTop + relativePosition - padding,
          behavior: 'smooth' // Add smooth scrolling effect
        });
      }
    }



async function findNearestFoodBankVoice(inputStr) {
      try {

    

    const formData = formStatus.formData;
    console.log("Sending form data to filter-foodbanks:", formData);
    

    const response = await fetch('http://localhost:3000/filter-foodbanks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.foodBanks || data.foodBanks.length === 0) {
      return { 
        success: false, 
        error: "No matching food banks found based on your preferences." 
      };
    }

    let nearest = null;
    let minDist = Infinity;
    
    const foodBanks = data.foodBanks;
    
    
    // filteredBanks = [{"Agency ID":"14545-PART-01","Agency Name":"Mt. Rainier Seventh Day Adventist Spanish Church : Mount Rainier Seventh Day Adventist Spanish Church","Agency Region":"MD","County\/Ward":"MD Prince George's County","Shipping Address":"Attn: Mount Rainier Seventh Day Adventist Spanish Chuch 6012 Ager Road Hyattsville MD 20782","Cleaned Address":"6012 Ager Road Hyattsville MD 20782","Latitude":38.9542534204,"Longitude":-76.9652870101,"Phone":"(240) 346-9272","Day of Week":"Wednesday","Frequency":"2nd of the Month","Starting Time":"19:00:00","Ending Time":"21:00:00","By Appointment Only":"Yes","Food Pantry Requirements":"ID","Food Format":"Loose groceries","Loose groceries":"Yes","Pre-bagged or boxed groceries":"No","Prepared meals":"No","Distribution Models":"Drive thru,Home Delivery,Walk up","Cultural Populations Served":"East African,Eastern European,Latin American,West African","Latin American":"Yes","West African":"Yes","East African":"Yes","Central\/South Asian":"No","East Asian":"No","Eastern European":"Yes","Middle Eastern\/North African":"No","Last SO Create Date":"2024-12-02","Date of Last Verification":"2024-10-09","Additional Note on Hours of Operations":null}]
    for (const fb of filteredBanks) {
      const fbLat = parseFloat(fb["Latitude"]);
      const fbLon = parseFloat(fb["Longitude"]);
      
      if (isNaN(fbLat) || isNaN(fbLon)) {
        continue; 
      }
      
      const dist = haversineDistance(userLat, userLon, fbLat, fbLon);
              if (dist < minDist) {
                  minDist = dist;
        nearest = {
          name: fb["Agency Name"],
          lat: fbLat,
          lon: fbLon,
          foodFormat: fb["Food Format"],
          address: fb["Cleaned Address"],
          phone: fb["Phone"],
          dayOfWeek: fb["Day of Week"],
          hours: `${fb["Starting Time"]} - ${fb["Ending Time"]}`,
          frequency: fb["Frequency"],
          offersDelivery: (fb["Distribution Models"] || "").toLowerCase().includes("delivery"),
          region: fb["Agency Region"],
          requirements: fb["Food Pantry Requirements"] || "None specified",
          appointment: fb["By Appointment Only"] === "Yes"
        };
      }
    }
    
    console.log("Found nearest food bank:", nearest);
          return nearest;
      } catch (e) {
    console.error("Error in findNearestFoodBankVoice:", e);
    return `Error processing food bank data: ${e}`;
      }
  }

function updateUIForLanguage(language) {
  console.log(`Updating UI for language: ${language}`);
  const pageTitle = document.querySelector('.page-title');
  
  if (language === 'EN') {
    pageTitle.textContent = 'One voice. One step closer to the help you need.';
    const formTitle = document.querySelector('.form-container h3');
    if (formTitle) {
      formTitle.textContent = 'Food Bank Assistance Form';
    }
    const formDescription = document.querySelector('.form-container .text-muted');
    if (formDescription) {
      formDescription.textContent = 'Our voice assistant will guide you through these questions to help find the right food bank services for your needs.';
    }
  } else {
    pageTitle.textContent = 'Una voz. Un paso más cerca de la ayuda que necesitas.';
    const formTitle = document.querySelector('.form-container h3');
    if (formTitle) {
      formTitle.textContent = 'Formulario de Asistencia del Banco de Alimentos';
    }
    const formDescription = document.querySelector('.form-container .text-muted');
    if (formDescription) {
      formDescription.textContent = 'Nuestro asistente de voz le guiará a través de estas preguntas para ayudarle a encontrar los servicios del banco de alimentos adecuados para sus necesidades.';
    }
  }
}

window.addEventListener('load', function() {

  init().catch(err => console.error("Error initializing connection:", err));
});

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
            description: 'Given the current location of the user , finds the nearest food bank and provides transit options- before that check if form is filled, if not fill the form using the tools',
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
            description: 'Gets the EXACT next question to ask in the food bank form. ALWAYS call this before asking any question to ensure you ask the correct question as shown in the form. Do not make up your own questions. Make sure the previous input is not empty',
          },
          {
            type: 'function',
            name: 'processFormInput',
            description: 'Process user input for a food bank form question. Call this after receiving user\'s answer to store their response. ALWAYS process current input before going to next question',
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






      const profileData = await loadUserProfile();
      if (profileData) {
        console.log("User profile loaded, will auto-fill form fields");
      }



      
      try {


        
        await getUserLocation();
        console.log("User location acquired:", window.userLocation);
      } catch (locationError) {
        console.error("Could not get user location:", locationError);
       
      }
      
      const set_language = getCurrentLanguage();
      updateUIForLanguage(set_language);
      let tokenResponse;
      if (set_language === "EN") {
        tokenResponse = await fetch("/session_english")
      }
      else {
        tokenResponse = await fetch("/session_spanish")
      }

      const tokenData = await tokenResponse.json();
      const EPHEMERAL_KEY = tokenData.client_secret.value;
      console.log("Ephemeral key received:", EPHEMERAL_KEY);


      if (rtcStarted) return;    // guard
      rtcStarted = true;

      window.pc = new RTCPeerConnection();
    

      const pc = window.pc;

      

     
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      document.body.appendChild(audioEl);

          pc.ontrack = e => {
            if (e.streams && e.streams[0]) {
              audioEl.srcObject = e.streams[0];
              visualiser.addStream(e.streams[0], '#ff0000'); // agent voice – red
            }
          };

      
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(micStream.getTracks()[0]);
     
      visualiser.addStream(micStream, '#007bff');  

      
      const dc = pc.createDataChannel("oai-events");

      dc.addEventListener("open", () => {
        console.log("Data channel open");
        configureData(dc);
      });

    
      dc.addEventListener("message", async (e) => {
        console.log("Data Channel message received:", e.data);
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
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
      });



      if (!sdpResponse.ok) {
        const err = await sdpResponse.json();  
        console.error("Realtime API error", err);
        alert(JSON.stringify(err, null, 2)); 
        console.error("Realtime API error:", await sdpResponse.json());
        return;
        }
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


  function startLocalVisualizer(stream) {
    const localCanvas = document.getElementById('localVisualizer');
    const localCtx = localCanvas.getContext('2d');
    localCanvas.width = localCanvas.offsetWidth;
    localCanvas.height = localCanvas.offsetHeight;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      localCtx.fillStyle = '#f5f5f5';
      localCtx.fillRect(0, 0, localCanvas.width, localCanvas.height);
      localCtx.lineWidth = 2;
      localCtx.strokeStyle = '#007bff';
      localCtx.beginPath();
      const sliceWidth = localCanvas.width / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * localCanvas.height / 2;
        if (i === 0) {
          localCtx.moveTo(x, y);
        } else {
          localCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      localCtx.lineTo(localCanvas.width, localCanvas.height / 2);
      localCtx.stroke();
    }
    draw();
  }

  function startBackendVisualizer(remoteStream) {
    const backendCanvas = document.getElementById('backendVisualizer');
    const backendCtx = backendCanvas.getContext('2d');
    backendCanvas.width = backendCanvas.offsetWidth;
    backendCanvas.height = backendCanvas.offsetHeight;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const source = audioContext.createMediaStreamSource(remoteStream);
    source.connect(analyser);

    function draw() {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      backendCtx.fillStyle = '#f5f5f5';
      backendCtx.fillRect(0, 0, backendCanvas.width, backendCanvas.height);
      backendCtx.lineWidth = 2;
      backendCtx.strokeStyle = '#ff0000';
      backendCtx.beginPath();
      const sliceWidth = backendCanvas.width / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * backendCanvas.height / 2;
        if (i === 0) {
          backendCtx.moveTo(x, y);
        } else {
          backendCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      backendCtx.lineTo(backendCanvas.width, backendCanvas.height / 2);
      backendCtx.stroke();
    }
    draw();
  }

  // Add event listeners for form controls
  document.addEventListener('DOMContentLoaded', function() {
    visualiser.init()
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

