document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-btn");
    const formTitle = document.getElementById("form-title");
    const toggleText = document.querySelector(".toggle-text");
    const toggleLink = document.getElementById("toggle-link");
    const form = document.getElementById("auth-form");
    let currentTab = "customers";
    let isSignUpMode = false;
    
    function addConfirmPassword() {
        if (!document.getElementById("confirm-password")) {
            const confirmPasswordGroup = document.createElement("div");
            confirmPasswordGroup.classList.add("input-group");
            confirmPasswordGroup.innerHTML = '<input type="password" id="confirm-password" placeholder="Confirm Password" required>';
            form.insertBefore(confirmPasswordGroup, form.querySelector(".btn"));
        }
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
        } else {
            formTitle.textContent = isSignUpMode ? "Sign Up" : "Login";
            toggleText.style.display = "block";
            toggleText.innerHTML = isSignUpMode 
                ? "Already have an account? <a href='#' id='toggle-link'>Login</a>"
                : "Don't have an account? <a href='#' id='toggle-link'>Sign Up</a>";
            if (isSignUpMode) {
                addConfirmPassword();
            } else {
                removeConfirmPassword();
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
