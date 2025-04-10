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

// userInput.addEventListener("keypress", function (e) {
// if (e.key === "Enter") sendMessage();
// });

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
  
  // Fetch and Populate Profile

});



function renderOptions(options) {
  const message = document.createElement('div');
  message.classList.add('message', 'user');

  const optionsWrapper = document.createElement('div');
  optionsWrapper.classList.add('option-wrapper');

  options.forEach(option => {
    var currentProfile = {};
    const button = document.createElement("button");
    button.textContent = option;
    button.classList.add("chat-option");
    button.onclick = async () => {
      message.remove();
      if (option === "Update My Profile") {
        try {
          const res = await fetch(`http://localhost:3000/get-profile?email=${encodeURIComponent(email)}`);
          const profile = await res.json();
          if (profile) {
            currentProfile = {
              name: profile.name ? profile.name : "Full Name",
              phone: profile.phone ? profile.phone : "+1 (234) 567-8901",
              location: profile.location ? profile.location : "New York, USA",
              kitchenAccess: profile.kitchen_access ? profile.kitchen_access : "Yes",
              culture: profile.culture ? profile.culture : "Middle Eastern",
              transport: profile.transport ? profile.transport: "N/A",
              "dietary-restrictions": profile.dietary_restrictions ? profile.dietary_restrictions : "N/A",
              "services-needed": profile.services ? profile.services : "N/A",
              distribution: profile.distribution ? profile.distribution : "N/A",
              bio: profile.bio ? profile.bio : "N/A"
            };
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
        console.log(currentProfile);
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
    { label: "Kitchen Access", key: "kitchenAccess", default: currentProfile.kitchenAccess },
    { label: "Culture", key: "culture", default: currentProfile.culture },
    { label: "Transport", key: "transport", default: currentProfile.transport },
    { label: "Dietary Restrictions", key: "dietary-restrictions", default: currentProfile["dietary-restrictions"] },
    { label: "Services Needed", key: "services-needed", default: currentProfile["services-needed"] },
    { label: "Distribution", key: "distribution", default: currentProfile.distribution },
    { label: "Bio", key: "bio", default: currentProfile.bio }
  ];

  fields.forEach(field => {
    const btn = document.createElement('button');
    btn.textContent = field.label;
    btn.classList.add("chat-option");
    btn.onclick = () => {
      message.remove();
      // Open a field-specific editor with the default/current value.
      showFieldEditor(field.key, field.default, field.label);
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
function showFieldEditor(field, currentValue, label) {
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

  document.getElementById('saveField').addEventListener('click', () => {
    const newValue = document.getElementById('fieldInput').value;
    
    // Construct an update object; in a full system you might merge this with the existing profile data.
    const updateData = {};
    updateData[field] = newValue;

    // Send updated field value to the server.
    fetch('http://localhost:8000/updateProfileField', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    })
      .then(response => response.json())
      .then(data => {
        addMessage(`${label} updated successfully to "${newValue}".`, "bot");
      })
      .catch(error => {
        console.error("Update error:", error);
        addMessage("There was an error updating your profile.", "bot");
      });

    message.remove();
  });

  document.getElementById('cancelField').addEventListener('click', () => {
    message.remove();
    addMessage(`${label} update cancelled.`, "bot");
  });
}
