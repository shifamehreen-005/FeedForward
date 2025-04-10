document.addEventListener("DOMContentLoaded", function () {
    const editButton = document.querySelector(".edit-button");
    const profileCard = document.querySelector(".profile-window");
    const profileImageUpload = document.getElementById("profile-image-upload");
    const profileImage = document.getElementById("profile-image");

    const email = localStorage.getItem("user_email");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        window.location.href = "login.html"; // Or you can redirect to the home page
    }


    // Fetch and Populate Profile
    fetch(`http://localhost:3000/get-profile?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(profile => {
            if (profile) {
                document.querySelector(".profile-name").textContent = profile.name;
                document.querySelector(".profile-email").textContent = profile.email;
                document.querySelector(".profile-phone").textContent = profile.phone;
                document.querySelector(".profile-info").textContent = profile.location;
                document.querySelector(".profile-transport").textContent = profile.transport;
                document.querySelector(".profile-diet").textContent = profile.dietary_restrictions;
                document.querySelector(".profile-culture").textContent = profile.culture;
                document.querySelector(".profile-kitchen").textContent = profile.kitchen_access;
                document.querySelector(".profile-distribution").textContent = profile.distribution;
                document.querySelector(".profile-services").textContent = profile.services;
                document.querySelector(".profile-bio").textContent = `"${profile.bio}"`;
            }
        })
        .catch(err => console.error("Failed to load profile:", err));

    editButton.addEventListener("click", function () {
        openEditForm();
    });

    function openEditForm() {
        const formHtml = `
            <div class="edit-form-container">
                <div class="edit-form">
                    <h2>Edit Profile</h2>
                    <label for="name">Name:</label>
                    <input type="text" id="name" value="Full Name">
                    
                    <label for="email">Email:</label>
                    <input type="email" id="email" disabled style="background-color:#eee; cursor:not-allowed;">
                    
                    <label for="phone">Phone:</label>
                    <input type="text" id="phone" value="+1 (234) 567-8901">
                    
                    <label for="location">Location:</label>
                    <input type="text" id="location" value="New York, USA">

                    <label for="kitchen-access">Do you have access to a kitchen to store and/or cook food?</label>
                    <input type="text" id="kitchen-access" name="kitchen-access" value="Yes">

                    <label for="culture">Culture:</label>
                    <input type="text" id="culture" name="culture" value="Middle Eastern">

                    <label for="transport">Own Transport / Public Transport:</label>
                    <select id="transport" name="transport" mutliple size = "1">
                        <option value="Own">Own Transport</option>
                        <option value="Public">Public Transport</option>
                    </select>

                    <label for="dietary-restrictions">Dietary Restrictions:</label>
                    <select id="dietary-restrictions" name="dietary-restrictions" multiple size="3">
                        <option value="diabetic">Diabetic</option>
                        <option value="hypertension">Have Hypertension</option>
                        <option value="low-sodium">Need Low Sodium</option>
                        <option value="low-sugar">Need Low Sugar</option>
                        <option value="fresh-produce">Want Fresh Produce</option>
                        <option value="all-produce">All-Produce Menu</option>
                        <option value="halal">Halal</option>
                    </select>

                    <label for="services-needed">Do you also need any of these other services?</label>
                    <select id="services-needed" name="services-needed" multiple size="3">
                        <option value="housing">Housing</option>
                        <option value="government-benefits">Government benefits</option>
                        <option value="financial-assistance">Financial assistance</option>
                        <option value="services-for-older-adults">Services for older adults</option>
                        <option value="behavioral-health">Behavioral health</option>
                        <option value="health-care">Health care</option>
                        <option value="child-care">Child care</option>
                        <option value="english-language-classes">English language classes</option>
                        <option value="job-training">Job training</option>
                    </select>

                    <label for="distribution">Distribution?</label>
                    <select id="distribution" name="distribution" multiple>
                        <option value="home-delivery">Home Delivery</option>
                        <option value="in-person-pickup">In Person Pickup</option>
                    </select>

                    <label for="bio">Bio:</label>
                    <input type="text" id="bio" value="Add about you">
                    
                    <button class="save-button">Save</button>
                    <button class="cancel-button">Cancel</button>
                </div>
            </div>
        `;

        profileCard.insertAdjacentHTML("afterend", formHtml);

        // Pre-fill fields from profile page
        document.getElementById("name").value = document.querySelector(".profile-name").textContent;
        document.getElementById("email").value = localStorage.getItem("user_email") || "";
        document.getElementById("phone").value = document.querySelector(".profile-phone").textContent;
        document.getElementById("location").value = document.querySelector(".profile-info").textContent;
        document.getElementById("kitchen-access").value = document.querySelector(".profile-kitchen").textContent;
        document.getElementById("culture").value = document.querySelector(".profile-culture").textContent;
        document.getElementById("transport").value = document.querySelector(".profile-transport").textContent;
        document.getElementById("distribution").value = document.querySelector(".profile-distribution").textContent;
        document.getElementById("bio").value = document.querySelector(".profile-bio").textContent.replace(/"/g, "");


        document.querySelector(".save-button").addEventListener("click", saveChanges);
        document.querySelector(".cancel-button").addEventListener("click", closeEditForm);
    }

    function saveChanges() {
        // Update DOM elements with new input values
        document.querySelector(".profile-name").textContent = document.getElementById("name").value;
        document.querySelector(".profile-email").textContent = document.getElementById("email").value;
        document.querySelector(".profile-phone").textContent = document.getElementById("phone").value;
        document.querySelector(".profile-info").textContent = document.getElementById("location").value;
        document.querySelector(".profile-transport").textContent = document.getElementById("transport").value;
        document.querySelector(".profile-culture").textContent = document.getElementById("culture").value;
        document.querySelector(".profile-kitchen").textContent = document.getElementById("kitchen-access").value;
        document.querySelector(".profile-distribution").textContent = document.getElementById("distribution").value;
        document.querySelector(".profile-bio").textContent = `"${document.getElementById("bio").value}"`;
    

        // Get selected dietary-restrictions  as comma-separated string
        const dietary_select = document.getElementById('dietary-restrictions');
        const dietary_selectedOptions = Array.from(dietary_select.selectedOptions);
        const selectedRestrictions = dietary_selectedOptions.map(option => option.value).join(', ');
        document.querySelector(".profile-diet").textContent = selectedRestrictions;

        // Get selected services as comma-separated string
        const services_select = document.getElementById('services-needed');
        const services_selectedOptions = Array.from(services_select.selectedOptions);
        const selectedServices = services_selectedOptions.map(option => option.value).join(', ');
        document.querySelector(".profile-services").textContent = selectedServices;
    
        // Prepare data to send to backend
        const profileData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            location: document.getElementById("location").value,
            transport: document.getElementById("transport").value,
            dietary_restrictions: selectedRestrictions,
            culture: document.getElementById("culture").value,
            kitchen_access: document.getElementById("kitchen-access").value,
            distribution: document.getElementById("distribution").value,
            services: selectedServices,
            bio: document.getElementById("bio").value
        };


        // Update profile page
        document.querySelector(".profile-name").textContent = profileData.name;
        document.querySelector(".profile-email").textContent = profileData.email;
        document.querySelector(".profile-phone").textContent = profileData.phone;
        document.querySelector(".profile-info").textContent = profileData.location;
        document.querySelector(".profile-transport").textContent = profileData.transport;
        document.querySelector(".profile-diet").textContent = profileData.dietary_restrictions;
        document.querySelector(".profile-culture").textContent = profileData.culture;
        document.querySelector(".profile-kitchen").textContent = profileData.kitchen_access;
        document.querySelector(".profile-distribution").textContent = profileData.distribution;
        document.querySelector(".profile-services").textContent = profileData.services;
        document.querySelector(".profile-bio").textContent = `"${profileData.bio}"`;
    
        // Send to server
        fetch("http://localhost:3000/save-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Server response:", data);
            alert("Profile saved successfully!");
        })
        .catch(error => {
            console.error("Error saving profile:", error);
            alert("Failed to save profile.");
        });
    
        closeEditForm(); // Close the form after saving
    }
    

    function closeEditForm() {
        document.querySelector(".edit-form-container").remove();
    }

    profileImageUpload.addEventListener("change", function (event) {
        const reader = new FileReader();
        reader.onload = function () {
            profileImage.src = reader.result;
        };
        reader.readAsDataURL(event.target.files[0]);
    });
});
