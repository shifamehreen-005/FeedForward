// <chat-bot></chat-bot>

// <script src = "js/chatbot.js"></script>


class ChatBot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
/* Reset & base */
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f2f4f8;
}

/* Chat log area */
#chat-log {
  position: fixed;
  bottom: 130px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 998;
}

/* Chatbar */
.chatbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: 999px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  max-width: 90%;
  z-index: 999;
  transition: all 0.3s ease;
  justify-content: space-between;
}

.chat-message {
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.chat-send-btn {
  background-color: #38c172;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 12px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: background 0.2s ease;
}

.chat-send-btn:hover {
  background-color: #2faa5c;
}

/* Input area */
.chat-input-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  display: none;
  z-index: 1000;
  width: 90%;
  max-width: 420px;
  align-items: center;
  gap: 10px;
}

.chat-input-container input {
  flex: 1;
  width: 70%;
  padding: 10px;
  font-size: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
}

.chat-input-container button {
  background-color: #38c172;
  color: white;
  border: none;
  padding: 10px 16px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.chat-input-container button:hover {
  background-color: #2faa5c;
}

/* Message bubbles */
.bubble {
  padding: 10px 14px;
  max-width: 80%;
  border-radius: 16px;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin-left: auto;
  margin-right: auto;
  animation: fadeIn 0.3s ease;
}

.bubble.user {
  background-color: #e6f7f1;
  color: #333;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.bubble.bot

.chat-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-clear-btn {
  background-color: #e3342f;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: background 0.2s ease;
}

.chat-clear-btn:hover {
  background-color: #cc1f1a;
}


        </style>


  <div id="chat-log"></div>

  <!-- Text Input Box (Initially Hidden) -->
  <div class="chat-input-container" id="input-container">
    <input type="text" id="user-input" placeholder="Ask me anything..." />
    <button id="submit-btn">Send</button>
  </div>

  <!-- Floating Bot Prompt -->
  <div class="chatbar">
    <div class="chat-message">
      🤖 <span>Hi! Do you need my help?...</span>
          <span></span>
          <span></span>
          <span></span>
    </div>
    <div class="chat-actions">
      <button class="chat-send-btn" id="send-btn" title="Type a message">⬆️</button>
      <button class="chat-clear-btn" id="clear-btn" title="Clear chat">🗑️</button>
    </div>
  </div>
        `;

        const sendBtn = document.getElementById('send-btn');
const inputContainer = document.getElementById('input-container');
const submitBtn = document.getElementById('submit-btn');
const userInput = document.getElementById('user-input');
const chatLog = document.getElementById('chat-log');
const clearBtn = document.getElementById('clear-btn');

// Toggle input box
sendBtn.addEventListener('click', () => {
  const isVisible = inputContainer.style.display === 'flex';
  inputContainer.style.display = isVisible ? 'none' : 'flex';
  if (!isVisible) userInput.focus();
});

// Submit message
submitBtn.addEventListener('click', () => {
  const message = userInput.value.trim();
  if (!message) return;

  const userBubble = document.createElement('div');
  userBubble.className = 'bubble user';
  userBubble.innerText = message;
  chatLog.appendChild(userBubble);

  userInput.value = '';
  inputContainer.style.display = 'none';
  chatLog.scrollTop = chatLog.scrollHeight;

  // Optional bot response
  setTimeout(() => {
    const botBubble = document.createElement('div');
    botBubble.className = 'bubble bot';
    botBubble.innerText = `🤖 I see! Let me help you with: "${message}"`;
    chatLog.appendChild(botBubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  }, 800);
});

userInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    submitBtn.click(); // Trigger the existing button logic
  }
});

// Clear chat
clearBtn.addEventListener('click', () => {
  chatLog.innerHTML = '';
});

    }
}

customElements.define('chat-bot', ChatBot)