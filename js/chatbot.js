// <chat-bot></chat-bot>

// <script src = "js/chatbot.js"></script>


class ChatBot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <style>
            .chatbot-container {
  position: fixed;
  bottom: 20px;
  left: 2in;
  right: 2in;
  margin: 0 auto;
  background-color: #fff;
  border: 2px solid #ccc;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-family: sans-serif;
  padding: 10px 14px;
  transition: height 0.3s ease;
}

.chatbot-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chatbot-character {
  font-size: 24px;
  margin-right: 10px;
}

.chatbot-text {
  flex-grow: 1;
  font-size: 16px;
  transition: all 0.3s ease;
}

.chatbot-toggle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.chatbot-input {
  margin-top: 10px;
  display: none;
}

.chatbot-input input {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #aaa;
  font-size: 14px;
}

        </style>


<div class="chatbot-container">
  <div class="chatbot-header-row">
    <div class="chatbot-character">🤖</div>
    <div class="chatbot-text" id="chatbotText">Hi do you need my help?</div>
    <button class="chatbot-toggle" onclick="toggleChat()">⬆️</button>
  </div>
  <div class="chatbot-input" id="chatInputBox">
    <input type="text" placeholder="Type your message..." />
  </div>
</div>

<script>
  function toggleChat() {
    const text = document.getElementById("chatbotText");
    const inputBox = document.getElementById("chatInputBox");

    const isOpen = inputBox.classList.contains("open");

    if (!isOpen) {
      text.style.transform = "translateY(-20px)";
      inputBox.classList.add("open");
    } else {
      text.style.transform = "translateY(0)";
      inputBox.classList.remove("open");
    }
  }
</script>



        `
    }
}

customElements.define('chat-bot', ChatBot)