document.addEventListener("DOMContentLoaded", function () {
    const editButton = document.querySelector(".edit-button");
    const profileCard = document.querySelector(".profile-window");

    const email = localStorage.getItem("user_email");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
        window.location.href = "login.html"; // Or you can redirect to the home page
    }


    // Fetch and Populate Profile
    fetch(`http://localhost:3000/get-profile-volunteer?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(profile => {
            if (profile) {
                document.querySelector(".profile-name").textContent = profile.name;
                document.querySelector(".profile-email").textContent = profile.email;
                document.querySelector(".profile-phone").textContent = profile.phone;
                document.querySelector(".profile-info").textContent = profile.location;
                document.querySelector(".profile-availability").textContent = profile.availability;
                document.querySelector(".profile-transport").textContent = profile.transport;
                document.querySelector(".profile-interests").textContent = profile.volunteer_interests;
                document.querySelector(".profile-skills").textContent = profile.skills;
                document.querySelector(".profile-experience").textContent = profile.experience;
                document.querySelector(".profile-background-check").textContent = profile.background_check;
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
        <h2>Edit Volunteer Profile</h2>

        <label for="name">Name:</label>
        <input type="text" id="name" value="Full Name">

        <label for="email">Email:</label>
        <input type="email" id="email" disabled style="background-color:#eee; cursor:not-allowed;">

        <label for="phone">Phone:</label>
        <input type="text" id="phone" value="+1 (234) 567-8901">

        <label for="location">Location:</label>
        <input type="text" id="location" value="New York, USA">

        <label for="availability">Availability (Days/Times):</label>
        <input type="text" id="availability" value="Weekends, Evenings">

        <label for="transport">Mode of Transport:</label>
        <select id="transport" name="transport" size="1">
            <option value="Own">Own Transport</option>
            <option value="Public">Public Transport</option>
        </select>

        <label for="volunteer-interests">Areas of Interest:</label>
        <select id="volunteer-interests" name="volunteer-interests" multiple size="4">
            <option value="food-packing">Food Packing</option>
            <option value="delivery">Delivery</option>
            <option value="client-intake">Client Intake</option>
            <option value="event-support">Event Support</option>
            <option value="administration">Administrative Support</option>
            <option value="outreach">Community Outreach</option>
            <option value="language-support">Language Support</option>
        </select>

        <label for="skills">Skills or Certifications:</label>
        <input type="text" id="skills" value="e.g., CPR certified, bilingual, data entry">

        <label for="experience">Previous Volunteer Experience:</label>
        <input type="text" id="experience" value="e.g., Volunteered at XYZ Shelter">

        <label for="background-check">Background Check Completed?</label>
        <select id="background-check" name="background-check" size="1">
            <option value="yes">Yes</option>
            <option value="no">No</option>
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
        document.getElementById("availability").value = document.querySelector(".profile-availability").textContent;
        document.getElementById("transport").value = document.querySelector(".profile-transport").textContent;
        document.getElementById("volunteer-interests").value = document.querySelector(".profile-interests").textContent;
        document.getElementById("skills").value = document.querySelector(".profile-skills").textContent;
        document.getElementById("experience").value = document.querySelector(".profile-experience").textContent;
        document.getElementById("background-check").value = document.querySelector(".profile-background-check").textContent;
        document.getElementById("bio").value = document.querySelector(".profile-bio").textContent.replace(/"/g, "");        


        document.querySelector(".save-button").addEventListener("click", saveChanges);
        document.querySelector(".cancel-button").addEventListener("click", closeEditForm);
    }

    function saveChanges() {
        // Update DOM elements with new input values
        // Update volunteer profile preview from form fields
        document.querySelector(".profile-name").textContent = document.getElementById("name").value;
        document.querySelector(".profile-email").textContent = document.getElementById("email").value;
        document.querySelector(".profile-phone").textContent = document.getElementById("phone").value;
        document.querySelector(".profile-info").textContent = document.getElementById("location").value;
        document.querySelector(".profile-availability").textContent = document.getElementById("availability").value;
        document.querySelector(".profile-transport").textContent = document.getElementById("transport").value;
        document.querySelector(".profile-skills").textContent = document.getElementById("skills").value;
        document.querySelector(".profile-experience").textContent = document.getElementById("experience").value;
        document.querySelector(".profile-background-check").textContent = document.getElementById("background-check").value;
        document.querySelector(".profile-bio").textContent = `"${document.getElementById("bio").value}"`;

        // Get selected volunteer interests as comma-separated string
        const interestsSelect = document.getElementById('volunteer-interests');
        const selectedInterests = Array.from(interestsSelect.selectedOptions)
            .map(option => option.value)
            .join(', ');
        document.querySelector(".profile-interests").textContent = selectedInterests;

        // Prepare data to send to backend
        const profileData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            location: document.getElementById("location").value,
            availability: document.getElementById("availability").value,
            transport: document.getElementById("transport").value,
            volunteer_interests: selectedInterests,
            skills: document.getElementById("skills").value,
            experience: document.getElementById("experience").value,
            background_check: document.getElementById("background-check").value,
            bio: document.getElementById("bio").value
        };

        // Update profile preview using `profileData`
        document.querySelector(".profile-name").textContent = profileData.name;
        document.querySelector(".profile-email").textContent = profileData.email;
        document.querySelector(".profile-phone").textContent = profileData.phone;
        document.querySelector(".profile-info").textContent = profileData.location;
        document.querySelector(".profile-availability").textContent = profileData.availability;
        document.querySelector(".profile-transport").textContent = profileData.transport;
        document.querySelector(".profile-interests").textContent = profileData.volunteer_interests;
        document.querySelector(".profile-skills").textContent = profileData.skills;
        document.querySelector(".profile-experience").textContent = profileData.experience;
        document.querySelector(".profile-background-check").textContent = profileData.background_check;
        document.querySelector(".profile-bio").textContent = `"${profileData.bio}"`;

    
        // Send to server
        fetch("http://localhost:3000/save-profile-volunteer", {
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
});
