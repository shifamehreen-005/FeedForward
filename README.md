# 🥗 FeedForward: A Multimodal AI Agent for Combating Food Insecurity

**Created by:** Nithin Skantha M, Shifa Mehreen, Sneha Vellelath, Swapnita Sahu  
**In collaboration with:** Capital Area Food Bank • UMD Robert H. Smith School of Business • NSF Directorate for Technology, Innovation, and Partnerships

---

## 🚀 Overview

**FeedForward** is an AI-powered, multimodal assistant designed to help individuals facing **food insecurity**—especially those with low technological literacy, language barriers, or limited internet access.

Our mission is to **break down barriers** to essential food services through an accessible, inclusive, and intelligent voice + chat companion. Whether it’s through a phone call, website, or chat widget, FeedForward ensures **no one gets left behind** when seeking help.

---

## 💡 Why It Matters

Millions of people in the U.S. struggle with food insecurity. Many are held back from accessing resources due to:

- 🌐 **No access to the internet or smartphones**
- 📱 **Low tech skills**: Especially among elderly or vulnerable populations
- 🗣️ **Language barriers**: English-Spanish divide
- 😔 **Stigma and privacy concerns** when asking for help

**FeedForward** directly addresses these challenges using multimodal AI, allowing users to access services **via phone, voice, or text**—whichever suits them best.

---

## 🧠 Key Features

- 🕐 **24/7 AI Hotline**: Available any time via phone or chat
- 🗣️ **Human-Like Voice Companion**: Understands and speaks both English and Spanish
- 📍 **Smart Navigation**: Provides step-by-step public transit guidance to the nearest food banks
- 🧾 **Personalized Recommendations**: Suggests nearby food banks based on user data and needs
- 🌐 **Multichannel Access**: Voice agent, chatbot, web interface, and Twilio phone support

---

## 🧱 System Architecture

The system has the following modular components:
User → Twilio (Call/SMS) → Flask Backend → GPT-4 & APIs → MySQL → Chat/Web/Voice Agent

- 🧠 **GPT-4 / GPT-4-Turbo**: For dynamic language understanding and user conversation flow  
- 📞 **Twilio**: For inbound calls and SMS handling  
- 🗺️ **Transit APIs + Google Maps**: For real-time public transport recommendations  
- 💾 **AWS RDS MySQL**: For storing and retrieving user preferences and past interactions  
- 🔊 **Voice Agent**: Empathetic and assistive voice response  
- 💻 **Frontend UI**: Web-based chat and information portal  

---

## 🔧 Tech Stack

| Frontend       | Backend         | NLP & Infra           | APIs                         |
|----------------|------------------|------------------------|------------------------------|
| HTML, CSS, JS  | Flask, Node.js   | GPT-4, GPT Audio, AWS  | Google Maps, WMATA, Twilio   |
