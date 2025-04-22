// Sample data
const monthlyLogins = [120, 150, 180, 140, 160, 200];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const newUsers = 56;
const visitsToFoodBanks = {
  'North Side': 230,
  'East End': 180,
  'Downtown': 290,
  'West Side': 160,
  'Suburb Center': 210
};

// Update numbers
document.getElementById("monthlyLoginsCount").innerText = monthlyLogins[monthlyLogins.length - 1];
document.getElementById("newUsersCount").innerText = newUsers;

// Logins Line Chart
const loginsCtx = document.getElementById('loginsChart').getContext('2d');
new Chart(loginsCtx, {
  type: 'line',
  data: {
    labels: months,
    datasets: [{
      label: 'Logins',
      data: monthlyLogins,
      fill: false,
      borderColor: '#2a9d8f',
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  }
});

// Food Bank Visits Bar Chart
const visitsCtx = document.getElementById('visitsChart').getContext('2d');
new Chart(visitsCtx, {
  type: 'bar',
  data: {
    labels: Object.keys(visitsToFoodBanks),
    datasets: [{
      label: 'Visits',
      data: Object.values(visitsToFoodBanks),
      backgroundColor: '#e76f51'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

// Extra metrics data
const foodDistributed = 3240; // in lbs
const volunteerHours = 145;
const avgWaitTime = 12; // in minutes
const topItems = {
  "Rice": 120,
  "Canned Beans": 95,
  "Pasta": 80,
  "Peanut Butter": 60,
  "Baby Formula": 40
};
const donations = [400, 350, 500, 460, 530, 600];
const donationMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Update extra card stats
document.getElementById("foodDistributed").innerText = `${foodDistributed} lbs`;
document.getElementById("volunteerHours").innerText = `${volunteerHours} hrs`;
document.getElementById("waitTime").innerText = `${avgWaitTime} min`;

// Top Requested Items - Pie Chart
const itemsCtx = document.getElementById('itemsChart').getContext('2d');
new Chart(itemsCtx, {
  type: 'pie',
  data: {
    labels: Object.keys(topItems),
    datasets: [{
      label: 'Requested',
      data: Object.values(topItems),
      backgroundColor: [
        '#f4a261', '#2a9d8f', '#e76f51', '#264653', '#e9c46a'
      ]
    }]
  },
  options: {
    responsive: true
  }
});

// Donations - Line Chart
const donationCtx = document.getElementById('donationChart').getContext('2d');
new Chart(donationCtx, {
  type: 'line',
  data: {
    labels: donationMonths,
    datasets: [{
      label: 'Donations ($)',
      data: donations,
      borderColor: '#264653',
      fill: false,
      tension: 0.2
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  }
});
