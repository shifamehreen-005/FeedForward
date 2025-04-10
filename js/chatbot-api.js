const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const chatInit = document.getElementById('chatInit');
const chatContainer = document.getElementById('chatContainer');
const email = localStorage.getItem("user_email");

function expandChat() {
  chatInit.style.display = "none";
  chatContainer.style.display = "flex";
  document.querySelector('.input-area').style.display = "none";
}

function collapseChat() {
chatContainer.style.display = "none";
chatInit.style.display = "flex";
}

function sendMessage(optionText) {
  addMessage(optionText, "user");

  fetch('http://localhost:8000/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_input: optionText })
  })
    .then(res => res.json())
    .then(data => {
      const botResponse = data.assistant_response || "Sorry, I didn't understand that.";
      setTimeout(() => {
        addMessage(botResponse, "bot");
        const options = getNextOptions(botResponse);

        // Only render options if they haven't been rendered already
        if (!optionsRendered) {
          renderOptions(options);
          optionsRendered = true; // Mark options as rendered
        }
      }, 500);
    })
    .catch(error => {
      console.error("API error:", error);
      addMessage("Sorry, there was an error connecting to the server.", "bot");
    });
}

function addMessage(text, sender) {
const message = document.createElement('div');
message.classList.add('message', sender);

const bubble = document.createElement('p');
bubble.textContent = text;
message.appendChild(bubble);

chatBox.appendChild(message);
chatBox.scrollTop = chatBox.scrollHeight;
}

// 🎤 Speech Recognition Setup
const micBtn = document.getElementById('micBtn');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = false;
recognition.lang = 'en-US';

micBtn.addEventListener("click", () => {
  recognition.start();
});

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  userInput.value = transcript;
  sendMessage(); // auto-send
};

document.addEventListener("DOMContentLoaded", function () {
  renderOptions(["Find Your Nearest Food Bank", "Update My Profile"]);
});



function renderOptions(options) {
  const message = document.createElement('div');
  message.classList.add('message', 'user');
  const user_type = localStorage.getItem("user_type");
  const optionsWrapper = document.createElement('div');
  optionsWrapper.classList.add('option-wrapper');

  options.forEach(option => {
    var currentProfile = {};
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add("chat-option");
    button.onclick = async () => {
      message.remove();
      if (option === "Update My Profile" && user_type == "customers") {
        try {
          const res = await fetch(`http://localhost:3000/get-profile?email=${encodeURIComponent(email)}`);
          const profile = await res.json();
          if (profile) {
            currentProfile = {
              name: profile.name ? profile.name : "Full Name",
              email: profile.email ? profile.email : "a@gmail.com",
              phone: profile.phone ? profile.phone : "+1 (234) 567-8901",
              location: profile.location ? profile.location : "New York, USA",
              transport: profile.transport ? profile.transport: "N/A",
              dietary_restrictions: profile.dietary_restrictions ? profile.dietary_restrictions : "N/A",
              culture: profile.culture ? profile.culture : "Middle Eastern",
              kitchen_access: profile.kitchen_access ? profile.kitchen_access : "Yes",
              distribution: profile.distribution ? profile.distribution : "N/A",
              services: profile.services ? profile.services : "N/A",
              bio: profile.bio ? profile.bio : "N/A"
            };
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
        showProfileOptions(currentProfile);
      } else if (option === "Update My Profile" && user_type == "volunteers") {
        try {
          const res = await fetch(`http://localhost:3000/get-profile-volunteer?email=${encodeURIComponent(email)}`);
          const profile = await res.json();
          if (profile) {
            currentProfile = {
              name: profile.name ? profile.name : "Full Name",
              email: profile.email ? profile.email : "a@gmail.com",
              phone: profile.phone ? profile.phone : "+1 (234) 567-8901",
              location: profile.location ? profile.location : "New York, USA",
              transport: profile.transport ? profile.transport : "N/A",
              availability: profile.availability ? profile.availability : "N/A",  // Added based on table schema
              volunteer_interests: profile.volunteer_interests ? profile.volunteer_interests : "N/A", // Added based on table schema
              skills: profile.skills ? profile.skills : "N/A", // Added based on table schema
              experience: profile.experience ? profile.experience : "N/A", // Added based on table schema
              background_check: profile.background_check ? profile.background_check : "No", // Added based on table schema
              bio: profile.bio ? profile.bio : "N/A"
            };            
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
        showProfileOptions(currentProfile);
      } else {
        // For other options, send the message as usual
        sendMessage(option);
      }
    };
    optionsWrapper.appendChild(button);
  });

  message.appendChild(optionsWrapper);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}


function getNextOptions(botResponse) {
  if (botResponse.includes("help")) {
    return ["Account Issues", "Technical Support", "Other"];
  } else if (botResponse.includes("Account")) {
    return ["Reset Password", "Update Info", "Back"];
  } else {
    return ["Start Over", "Talk to Agent"];
  }
}

function showProfileOptions(currentProfile) {
  const message = document.createElement('div');
  message.classList.add('message', 'bot');

  message.innerHTML = `
    <h5>Which profile detail would you like to change?</h5>
  `;

  const optionsWrapper = document.createElement('div');
  optionsWrapper.classList.add('option-wrapper');

  // List of profile fields available for update.
  const fields = [
    { label: "Name", key: "name", default: currentProfile.name },
    { label: "Phone", key: "phone", default: currentProfile.phone },
    { label: "Location", key: "location", default: currentProfile.location },
    { label: "Transport", key: "transport", default: currentProfile.transport },
    { label: "Availability", key: "availability", default: currentProfile.availability },  // Added based on table schema
    { label: "Volunteer Interests", key: "volunteer_interests", default: currentProfile.volunteer_interests }, // Added based on table schema
    { label: "Skills", key: "skills", default: currentProfile.skills }, // Added based on table schema
    { label: "Experience", key: "experience", default: currentProfile.experience }, // Added based on table schema
    { label: "Background Check", key: "background_check", default: currentProfile.background_check }, // Added based on table schema
    { label: "Bio", key: "bio", default: currentProfile.bio }
  ];  

  fields.forEach(field => {
    const btn = document.createElement('button');
    btn.textContent = field.label;
    btn.classList.add("chat-option");
    btn.onclick = () => {
      message.remove();
      // Open a field-specific editor with the default/current value.
      showFieldEditor(currentProfile, field.key, field.default, field.label);
    };
    optionsWrapper.appendChild(btn);
  });

  // Option to go back or cancel the update.
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = "Cancel";
  cancelBtn.classList.add("chat-option");
  cancelBtn.onclick = () => {
    message.remove();
    addMessage("Profile update cancelled.", "bot");
  };
  optionsWrapper.appendChild(cancelBtn);

  message.appendChild(optionsWrapper);
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Function to render an inline editor for a specific profile field.
 * @param {string} field - The profile field key (e.g., "name" or "phone")
 * @param {string} currentValue - The current (or default) value for that field
 * @param {string} label - Human-readable label for the field.
 */
function showFieldEditor(currentProfile, field, currentValue, label) {
  const message = document.createElement('div');
  message.classList.add('message', 'bot', 'profile-editor');

  message.innerHTML = `
    <h3>Update ${label}</h3>
    <input type="text" id="fieldInput" value="${currentValue}" placeholder="Enter new ${label}">
    <div class="button-group">
      <button id="saveField" class="save-button">Save</button>
      <button id="cancelField" class="cancel-button">Cancel</button>
    </div>
  `;

  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;

  document.getElementById('saveField').addEventListener('click', async () => {
    const newValue = document.getElementById('fieldInput').value;
    
    // Construct an update object; in a full system you might merge this with the existing profile data.
    const updateData = {};
    updateData[field] = newValue;

    const finalProfile = { ...currentProfile, ...updateData };
    console.log(finalProfile);
    // Send updated field value to the server.
    try {
      const response = await fetch("http://localhost:3000/save-profile-volunteer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(finalProfile)
      });
  
      const data = await response.json();
      console.log("Server response:", data);
      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    }

    message.remove();
  });

  document.getElementById('cancelField').addEventListener('click', () => {
    message.remove();
    addMessage(`${label} update cancelled.`, "bot");
  });
}
