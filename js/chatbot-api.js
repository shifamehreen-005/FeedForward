const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const chatInit = document.getElementById('chatInit');
const chatContainer = document.getElementById('chatContainer');

function expandChat() {
chatInit.style.display = "none";
chatContainer.style.display = "flex";
}

function collapseChat() {
chatContainer.style.display = "none";
chatInit.style.display = "flex";
}

async function sendMessage() {
const input = userInput.value.trim();
if (input === "") return;

addMessage(input, "user");

try {
    const response = await fetch('http://localhost:8000', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        user_input: input
    })
    });

    const data = await response.json();
    const botResponse = data.response || "Sorry, I didn't understand that.";

    setTimeout(() => {
    addMessage(botResponse, "bot");
    }, 500);

} catch (error) {
    console.error("API error:", error);
    addMessage("Sorry, there was an error connecting to the server.", "bot");
}

userInput.value = "";
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

userInput.addEventListener("keypress", function (e) {
if (e.key === "Enter") sendMessage();
});