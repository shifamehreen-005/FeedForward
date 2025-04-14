const feedbacks = [
  {
    author: "Jane D.",
    message: "The volunteers were kind and very helpful. Thank you for everything!"
  },
  {
    author: "Carlos R.",
    message: "Food quality was great, and the staff ensured everyone was treated with respect."
  },
  {
    author: "Aisha B.",
    message: "Please consider extending the opening hours during weekends."
  },
  {
    author: "Tom K.",
    message: "Very organized and clean. Much appreciated!"
  },
  {
    author: "Priya N.",
    message: "Blessed to have such a support system in tough times. You all are angels!"
  },
  {
    author: "David H.",
    message: "I was nervous at first, but the staff made me feel welcome. Thank you for your kindness."
  },
  {
    author: "Fatima Z.",
    message: "There was a little wait time, but I completely understand. Everyone was doing their best."
  },
  {
    author: "Mikhail V.",
    message: "The warm meals were exactly what I needed today. Thank you, sincerely."
  },
  {
    author: "Leila M.",
    message: "The hygiene and organization of the center are impressive. Keep up the great work!"
  },
  {
    author: "Ronnie T.",
    message: "Special thanks to the young man who helped carry my bags to the car. Big heart!"
  }
];

const feedbackList = document.getElementById('feedback-list');

feedbacks.forEach((feedback, index) => {
  const card = document.createElement('div');
  card.className = 'feedback-card';
  card.style.animationDelay = `${index * 0.1}s`;

  card.innerHTML = `
    <div class="feedback-author">${feedback.author}</div>
    <div class="feedback-message">${feedback.message}</div>
  `;

  feedbackList.appendChild(card);
});
