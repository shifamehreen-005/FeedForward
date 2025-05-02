document.querySelector('.submit-btn').addEventListener('click', async function (e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    visitReason: document.getElementById('visitReason').value,
    exceeded: document.getElementById('exceeded').value,
    improvement: document.getElementById('improvement').value,
    shoutout: document.getElementById('shoutout').value,
    featureUsed: document.getElementById('featureUsed').value,
    featureExperience: document.getElementById('featureExperience').value
  };

  const res = await fetch('http://localhost:3000/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  if (res.ok) {
    alert('Thank you for your feedback! 💚');
    this.reset();
    document.getElementById('experienceGroup').style.display = 'none';
  } else {
    alert('Oops! Something went wrong.');
  }
});

  document.getElementById("featureUsed").addEventListener("change", showExperienceField);

  function showExperienceField() {
    const feature = document.getElementById("featureUsed").value;
    const label = document.getElementById("experienceLabel");
    const group = document.getElementById("experienceGroup");
  
    label.textContent = `How was your experience with ${feature.toLowerCase()}?`;
    group.style.display = "block";
  }


  