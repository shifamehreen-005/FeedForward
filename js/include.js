console.log("✅ include.js loaded");

function loadHTML(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error loading ${file}: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById(id).innerHTML = data;
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}

loadHTML('nav-placeholder', 'nav.html');
// loadHTML('footer-placeholder', 'footer.html');
