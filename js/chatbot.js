class ChatBot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
     <div class="chatbot">
      <!-- Collapsed chatbot -->
      <div class="chat-init" id="chatInit">
        <span>
            <img src="images/characterIcons/ghost.png" alt="Bot Icon" class="bot-icon" />
            <p class="bot-message">Hi, do you need any help?</p>
        </span>
        <button onclick="expandChat()">Yes</button>
      </div>
    
      <!-- Full chatbot -->
      <div class="chat-container" id="chatContainer">
        <div class="chat-header">
          <h4>Chatbot</h4>
          <button onclick="collapseChat()">❌</button>
        </div>
        <div class="chat-box" id="chatBox"></div>
        <div class="input-area">
          <input type="text" id="userInput" placeholder="Type your message..." />
          <button onclick="sendMessage()">Send</button>
        </div>
      </div>
        `
    }}
customElements.define('chat-bot', ChatBot)