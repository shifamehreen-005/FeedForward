document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".tab-btn");
  const formTitle = document.getElementById("form-title");
  const toggleText = document.querySelector(".toggle-text");
  const logoutButton = document.getElementById("logout-button");
  const toggleLink = document.getElementById("toggle-link");
  const form = document.getElementById("auth-form");
  const submitButton = form.querySelector(".btn"); // Select the submit button
  let currentTab = "customers";
  let isSignUpMode = false;

  // Check login status in localStorage (or sessionStorage, depending on your setup)
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  function addConfirmPassword() {
      if (!document.getElementById("confirm-password")) {
          const confirmPasswordGroup = document.createElement("div");
          confirmPasswordGroup.classList.add("input-group");
          confirmPasswordGroup.innerHTML = '<input type="password" id="confirm-password" placeholder="Confirm Password" required>';
          form.insertBefore(confirmPasswordGroup, form.querySelector(".btn"));
      }
  }

  logoutButton?.addEventListener("click", (e) => {
    e.preventDefault();
    logoutUser();
  });
  
  (function checkAutoLogout() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const loginTime = parseInt(localStorage.getItem("login_time"), 10);
  
    if (isLoggedIn && loginTime) {
      const ONE_HOUR = 60 * 60 * 1000; // milliseconds
      const currentTime = Date.now();
  
      if (currentTime - loginTime > ONE_HOUR) {
        alert("Session expired. You have been logged out.");
        logoutUser();
      }
    }
  })();
  
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_type");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("login_time");
  
    window.location.href = "login.html";
  }
  
  function removeConfirmPassword() {
      const confirmPasswordInput = document.getElementById("confirm-password");
      if (confirmPasswordInput) {
          confirmPasswordInput.parentElement.remove();
      }
  }
  
  tabs.forEach(tab => {
      tab.addEventListener("click", function () {
          tabs.forEach(t => t.classList.remove("active"));
          this.classList.add("active");
          currentTab = this.getAttribute("data-tab");
          if (currentTab === "staff") {
              isSignUpMode = false; 
          }
          updateForm();
      });
  });
  
  function toggleMode(event) {
      event.preventDefault();
      isSignUpMode = !isSignUpMode;
      updateForm();
  }
  
  function updateForm() {
      if (currentTab === "staff") {
          formTitle.textContent = "Login";
          toggleText.style.display = "none";
          removeConfirmPassword();
          submitButton.textContent = "Login";
      } else {
          formTitle.textContent = isSignUpMode ? "Sign Up" : "Login";
          toggleText.style.display = "block";
          toggleText.innerHTML = isSignUpMode 
              ? "Already have an account? <a href='#' id='toggle-link'>Login</a>"
              : "Don't have an account? <a href='#' id='toggle-link'>Sign Up</a>";
          if (isSignUpMode) {
              addConfirmPassword();
              submitButton.textContent = "Sign Up";
          } else {
              removeConfirmPassword();
              submitButton.textContent = "Login";
          }
      }
      attachToggleEvent();
  }
  
  function attachToggleEvent() {
      const newToggleLink = document.getElementById("toggle-link");
      if (newToggleLink) {
          newToggleLink.removeEventListener("click", toggleMode);
          newToggleLink.addEventListener("click", toggleMode);
      }
  }
  
  attachToggleEvent();
  updateForm();
});

async function authenticateUser(endpoint, data) {
  try {
    const response = await fetch(`http://localhost:3000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    alert(result.message);
    if (response.ok && endpoint === "login") {
      const currentTime = Date.now();
      localStorage.setItem("token", result.token);
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_type", data.user_type); // Store user type
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("login_time", currentTime);
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong!");
  }
}

document
  .getElementById("auth-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password");
    const isSignUp =
      document.getElementById("form-title").textContent === "Sign Up";

    if (isSignUp && confirmPassword && confirmPassword.value !== password) {
      alert("Passwords do not match!");
      return;
    }

    const user_type = document
      .querySelector(".tab-btn.active")
      .getAttribute("data-tab");
    const endpoint = isSignUp ? "signup" : "login";
    const data = { email, password, user_type };
    console.log(data);
    authenticateUser(endpoint, data);
  });
