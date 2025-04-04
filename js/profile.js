document.addEventListener("DOMContentLoaded", function () {
    const editButton = document.querySelector(".edit-button");
    const profileCard = document.querySelector(".profile-window");
    const profileImageUpload = document.getElementById("profile-image-upload");
    const profileImage = document.getElementById("profile-image");

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
        window.location.href = "login.html"; // Or you can redirect to the home page
    }


    editButton.addEventListener("click", function () {
        openEditForm();
    });

    function openEditForm() {
        const formHtml = `
            <div class="edit-form-container">
                <div class="edit-form">
                    <h2>Edit Profile</h2>
                    <label for="name">Name:</label>
                    <input type="text" id="name" value="John Doe">
                    
                    <label for="email">Email:</label>
                    <input type="email" id="email" value="johndoe@example.com">
                    
                    <label for="phone">Phone:</label>
                    <input type="text" id="phone" value="+1 (234) 567-8901">
                    
                    <label for="location">Location:</label>
                    <input type="text" id="location" value="New York, USA">

                    <label for="kitchen-access">Do you have access to a kitchen to store and/or cook food?</label>
                    <input type="text" id="kitchen-access" name="kitchen-access" value="Yes">

                    <label for="culture">Culture:</label>
                    <input type="text" id="culture" name="culture" value="Middle Eastern">

                    <label for="transport">Own Transport / Public Transport:</label>
                    <input type="text" id="transport" name="transport" value="Public Transport">

                    <label for="dietary-restrictions">Dietary Restrictions:</label>
                    <input type="text" id="dietary-restrictions" name="dietary-restrictions" value="Low sodium, halal">

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
                    <input type="text" id="bio" value="Passionate about community building and organizing local events.">
                    
                    <button class="save-button">Save</button>
                    <button class="cancel-button">Cancel</button>
                </div>
            </div>
        `;

        profileCard.insertAdjacentHTML("afterend", formHtml);
        document.querySelector(".save-button").addEventListener("click", saveChanges);
        document.querySelector(".cancel-button").addEventListener("click", closeEditForm);
    }

    function saveChanges() {
        document.querySelector(".profile-name").textContent = document.getElementById("name").value;
        document.querySelector(".profile-email").textContent = document.getElementById("email").value;
        document.querySelector(".profile-phone").textContent = document.getElementById("phone").value;
        document.querySelector(".profile-info").textContent = `${document.getElementById("location").value}`;
        document.querySelector(".profile-transport").textContent = `${document.getElementById("transport").value}`;
        document.querySelector(".profile-diet").textContent = `${document.getElementById("dietary-restrictions").value}`;
        document.querySelector(".profile-culture").textContent = `${document.getElementById("culture").value}`;
        document.querySelector(".profile-kitchen").textContent = `${document.getElementById("kitchen-access").value}`;
        document.querySelector(".profile-distribution").textContent = `${document.getElementById("distribution").value}`;
        document.querySelector(".profile-bio").textContent = `"${document.getElementById("bio").value}"`;

        var select = document.getElementById('services-needed');
        var selectedOptions = Array.from(select.selectedOptions); // Get all selected options
        var selectedValues = selectedOptions.map(option => option.value); // Get values of selected options
        document.querySelector(".profile-services").textContent = selectedValues.join(', ');
        

        closeEditForm();
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
