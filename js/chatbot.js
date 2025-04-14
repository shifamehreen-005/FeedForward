class ChatBot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
     <div class="chatbot">
      <!-- Collapsed chatbot -->
      <div class="chat-init" id="chatInit">
        <span>
            <img src="images/characterIcons/shiba-inu.png" alt="Bot Icon" class="bot-icon" />
            <p class="bot-message">Hi, do you need any help?</p>
        </span>
        <div class="chat-buttons">          
          <button id="micBtn" aria-label="Microphone"">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2z"/>
            </svg>
          </button>
          <button id = "helpBtn" onclick="expandChat()">Let's Chat</button>
        </div>

      </div>
    
      <!-- Full chatbot -->
      <div class="chat-container" id="chatContainer">
        <div class="chat-header">
          <img src="images/characterIcons/shiba-inu.png" alt="Bot Icon" class="expanded-bot-icon" />
          <h4>Eliot</h4>
          <button onclick="collapseChat()" style = "color: black;">X</button>
        </div>
        <div class="chat-box" id="chatBox"></div>
        <div class="input-area">
          <div id="optionButtons" class="chat-buttons">
            <!-- Options will be dynamically inserted here -->
          </div>
        </div>
      </div>
        `
    }}
customElements.define('chat-bot', ChatBot)