document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
        window.location.href = "/login";
        return;
    }

    // Get user email from localStorage
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
        window.location.href = "/login";
        return;
    }

    // Fetch user profile data
    fetch(`/api/get-profile?email=${encodeURIComponent(userEmail)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateProfileUI(data.profile);
            } else {
                console.error("Failed to load profile:", data.error);
            }
        })
        .catch(error => {
            console.error("Error fetching profile:", error);
        });
});

function updateProfileUI(profile) {
    // Update all profile fields with the data
    document.querySelector(".profile-name").textContent = profile.name;
    document.querySelector(".profile-email").textContent = profile.email;
    document.querySelector(".profile-phone").textContent = profile.phone;
    document.querySelector(".profile-info").textContent = profile.location;
    document.querySelector(".profile-availability").textContent = profile.availability;
    document.querySelector(".profile-transport").textContent = profile.transport;
    document.querySelector(".profile-interests").textContent = profile.interests;
    document.querySelector(".profile-skills").textContent = profile.skills;
    document.querySelector(".profile-experience").textContent = profile.experience;
    document.querySelector(".profile-background-check").textContent = profile.background_check;
    document.querySelector(".profile-start").textContent = profile.start_date;
    document.querySelector(".profile-bio").textContent = profile.bio;
}

function toggleEditMode() {
    const profileDetails = document.querySelector('.profile-details');
    const isEditMode = profileDetails.classList.contains('edit-mode');
    
    if (!isEditMode) {
        // Enter edit mode
        profileDetails.classList.add('edit-mode');
        const editButton = document.querySelector('.edit-button');
        editButton.textContent = 'Save Changes';
        
        // Convert all text fields to input fields
        const textFields = profileDetails.querySelectorAll('p');
        textFields.forEach(field => {
            const originalText = field.textContent;
            const fieldName = field.classList[0].replace('profile-', '');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = originalText;
            input.className = `edit-${fieldName}`;
            field.parentNode.replaceChild(input, field);
        });
    } else {
        // Save changes and exit edit mode
        profileDetails.classList.remove('edit-mode');
        const editButton = document.querySelector('.edit-button');
        editButton.textContent = 'Edit Profile';
        
        // Collect all changes
        const changes = {};
        const inputs = profileDetails.querySelectorAll('input');
        inputs.forEach(input => {
            const fieldName = input.classList[0].replace('edit-', '');
            changes[fieldName] = input.value;
            
            // Convert back to paragraph
            const p = document.createElement('p');
            p.className = `profile-${fieldName}`;
            p.textContent = input.value;
            input.parentNode.replaceChild(p, input);
        });
        
        // Send changes to server
        const userEmail = localStorage.getItem("userEmail");
        fetch('/api/update-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                ...changes
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Profile updated successfully!');
            } else {
                alert('Error updating profile. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating profile. Please try again.');
        });
    }
}
