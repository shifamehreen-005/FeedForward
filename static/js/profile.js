document.addEventListener("DOMContentLoaded", function () {
    const editButton = document.querySelector(".edit-button");
    const profileCard = document.querySelector(".profile-window");

    const email = localStorage.getItem("user_email");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        window.location.href = "login.html";
    }

    // Fetch and Populate Profile
    fetch(`http://localhost:3000/get-profile?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(profile => {
            if (profile) {
                document.querySelector(".profile-email").textContent = profile.email || "";
                document.querySelector(".profile-address").textContent = profile.address || profile.location || "";
                document.querySelector(".profile-transport").textContent = profile.transport || "";
                document.querySelector(".profile-diet").textContent = profile.dietary_restrictions || "";
                document.querySelector(".profile-kitchen").textContent = profile.kitchen_access || "";
            }
        })
        .catch(err => {
            console.error("Failed to load profile:", err);
            showNotification("Failed to load profile data", "error");
        });

    editButton.addEventListener("click", function () {
        openEditForm();
    });

    function openEditForm() {
        const formHtml = `
            <div class="edit-form-container">
                <div class="edit-form">
                    <h2>Edit Profile</h2>
                    
                    <div class="form-group">
                        <label for="email">Email:</label>
                        <input type="email" id="email" disabled>
                        <div class="field-help">Email cannot be changed</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="address">Address/Location:</label>
                        <input type="text" id="address" placeholder="Enter your city, state, or country">
                    </div>

                    <div class="form-group">
                        <label for="kitchen-access">Do you have access to a kitchen?</label>
                        <select id="kitchen-access">
                            <option value="">Please select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="transport">Transportation:</label>
                        <select id="transport">
                            <option value="">Please select</option>
                            <option value="Own Transport">Own Transport</option>
                            <option value="Public Transport">Public Transport</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="dietary-restrictions">Dietary Preferences/Restrictions:</label>
                        <select id="dietary-restrictions" multiple size="6">
                            <option value="Latin American">Latin American</option>
                            <option value="West African">West African</option>
                            <option value="East African">East African</option>
                            <option value="Central/South Asian">Central/South Asian</option>
                            <option value="East Asian">East Asian</option>
                            <option value="Eastern European">Eastern European</option>
                            <option value="Middle Eastern/North African">Middle Eastern/North African</option>
                            <option value="Halal">Halal</option>
                            <option value="Kosher">Kosher</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="None">None</option>
                        </select>
                        <div class="field-help">Hold Ctrl/Cmd to select multiple options</div>
                    </div>

                    <div class="form-buttons">
                        <button class="save-button">Save Changes</button>
                        <button class="cancel-button">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        profileCard.insertAdjacentHTML("afterend", formHtml);

        if (!document.getElementById('enhanced-form-styles')) {
            const styleSheet = document.createElement('link');
            styleSheet.rel = 'stylesheet';
            styleSheet.href = 'css/profile-enhanced.css'; 
            styleSheet.id = 'enhanced-form-styles';
            document.head.appendChild(styleSheet);
        }

 
        document.getElementById("email").value = localStorage.getItem("user_email") || "";
        document.getElementById("address").value = document.querySelector(".profile-address").textContent || "";
    
        const kitchenValue = document.querySelector(".profile-kitchen").textContent;
        const kitchenSelect = document.getElementById("kitchen-access");
        setSelectValue(kitchenSelect, kitchenValue);
     
        const transportValue = document.querySelector(".profile-transport").textContent;
        const transportSelect = document.getElementById("transport");
        setSelectValue(transportSelect, transportValue);

        const dietaryValue = document.querySelector(".profile-diet").textContent;
        setMultiSelectValues("dietary-restrictions", dietaryValue);

        document.querySelector(".save-button").addEventListener("click", saveChanges);
        document.querySelector(".cancel-button").addEventListener("click", closeEditForm);
    }
    
    function setSelectValue(selectElement, value) {
        if (!selectElement) return;
        
        for (let i = 0; i < selectElement.options.length; i++) {
            if (selectElement.options[i].value === value || 
                selectElement.options[i].text === value) {
                selectElement.selectedIndex = i;
                break;
            }
        }
    }
  
    function setMultiSelectValues(selectId, valuesString) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;
        
        const values = valuesString.split(',').map(v => v.trim());
        
        for (let i = 0; i < selectElement.options.length; i++) {
            selectElement.options[i].selected = false;
            const option = selectElement.options[i];
            
            if (values.some(val => val === option.value || val === option.text)) {
                option.selected = true;
            }
        }
    }

    function saveChanges() {
        
        const email = document.getElementById("email").value;
        const address = document.getElementById("address").value;
        const kitchenAccess = document.getElementById("kitchen-access").value;
        const transport = document.getElementById("transport").value;
        
        const dietarySelect = document.getElementById('dietary-restrictions');
        const selectedOptions = Array.from(dietarySelect.selectedOptions);
        const selectedRestrictions = selectedOptions.map(option => option.text).join(', ');
        
        const profileData = {
            email: email,
            address: address,
            location: address,
            transport: transport,
            dietary_restrictions: selectedRestrictions,
            kitchen_access: kitchenAccess
        };
        

        document.querySelector(".profile-email").textContent = profileData.email;
        document.querySelector(".profile-address").textContent = profileData.address;
        document.querySelector(".profile-transport").textContent = profileData.transport;
        document.querySelector(".profile-diet").textContent = profileData.dietary_restrictions;
        document.querySelector(".profile-kitchen").textContent = profileData.kitchen_access;
    

        fetch("http://localhost:3000/save-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            console.log("Server response:", data);
            showNotification("Profile saved successfully!");
        })
        .catch(error => {
            console.error("Error saving profile:", error);
            showNotification("Failed to save profile.", "error");
        });
    
        closeEditForm(); 
    }
    
    function closeEditForm() {
        const formContainer = document.querySelector(".edit-form-container");
        if (formContainer) {
            
            formContainer.style.animation = "fadeOut 0.3s forwards";
            
            setTimeout(() => {
                formContainer.remove();
            }, 300);
        }
    }
    
    function showNotification(message, type = "success") {
        // Create notification element
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style based on type
        notification.style.position = "fixed";
        notification.style.top = "20px";
        notification.style.right = "20px";
        notification.style.padding = "15px 25px";
        notification.style.borderRadius = "8px";
        notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        notification.style.zIndex = "1100";
        notification.style.animation = "slideInRight 0.4s, fadeOut 0.4s 3s forwards";
        
        if (type === "success") {
            notification.style.backgroundColor = "#2ecc71";
            notification.style.color = "white";
        } else {
            notification.style.backgroundColor = "#e74c3c";
            notification.style.color = "white";
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3500);
    }
});