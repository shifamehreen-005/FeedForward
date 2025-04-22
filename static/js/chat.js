const langToggle = document.getElementById('lang-switch');

langToggle.addEventListener('change', () => {
  const selectedLang = langToggle.checked ? 'es' : 'en';
  console.log(`Language selected: ${selectedLang}`);
  // Add logic here to toggle site content based on `selectedLang`
});


document.getElementById('close-chatbot').addEventListener('click', function () {
    // Go back to the previous page
    window.history.back();
  });

const chatContainer1 = document.getElementById('chat-container');
const userInput1 = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(text, sender) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message', `${sender}-message`);

  if (sender === 'bot' && text.startsWith('LIST:')) {
    const lines = text.replace('LIST:', '').trim().split('\n');
    lines.forEach(item => {
      const optionEl = document.createElement('div');
      optionEl.classList.add('option');

      const optionNumber = document.createElement('div');
      optionNumber.classList.add('option-number');
      optionNumber.innerText = item.split(':')[0].trim();

      const optionDescription = document.createElement('div');
      optionDescription.classList.add('option-description');
      optionDescription.innerText = item.split(':')[1].trim();

      optionEl.appendChild(optionNumber);
      optionEl.appendChild(optionDescription);

      messageEl.appendChild(optionEl);
    });
  } else {
    messageEl.innerText = text;
  }

  chatContainer1.appendChild(messageEl);
  chatContainer1.scrollTop = chatContainer1.scrollHeight;
}

function botReply(userText) {
  let reply;
  if (userText.toLowerCase().includes('options')) {
    reply = 'LIST:\n1: Check balance\n2: Transfer money\n3: Exit';
  } else {
    reply = `You said: "${userText}"`;
  }
  setTimeout(() => addMessage(reply, 'bot'), 500);
}

sendButton.addEventListener('click', () => {
  const text = userInput1.value.trim();
  if (text !== '') {
    addMessage(text, 'user');
    userInput1.value = '';
    botReply(text);
  }
});

userInput1.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendButton.click();
  }
});
