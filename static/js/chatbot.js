class ChatBot extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
     <div class="chatbot">

      <!-- Hotline Floating Button -->
      <button id="hotlineBtn" aria-label="Call Hotline" onclick="window.location.href='tel:+18554482346'">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.464 15.464 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.2.49 2.52.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1C10.61 21.5 2.5 13.39 2.5 3a1 1 0 011-1H7a1 1 0 011 1c0 1.36.27 2.68.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z"/>
        </svg>
      </button>

      <!-- Collapsed chatbot -->
      <div class="chat-init" id="chatInit">
        <span>
            <img src="static/images/characterIcons/shiba-inu.png" alt="Bot Icon" class="bot-icon" />
            <p class="bot-message">Hi, do you need any help?</p>
        </span>
        <div class="chat-buttons">          
          <button id="micBtn" aria-label="Microphone" >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2z"/>
            </svg>
          </button>
          <button id = "helpBtn" onclick="window.location.href='chat.html'">Let's Chat</button>
        </div>
      </div>
    
        `
    }}
customElements.define('chat-bot', ChatBot)