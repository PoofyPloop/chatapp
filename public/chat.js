import { supabase } from './supabaseClient.js';

console.log(supabase);

let currentUserId = null;

// Redirect if no username is found
const username = localStorage.getItem("username");
if (!username) {
  window.location.href = "index.html";
}

// Fetch current user's ID from Supabase
async function fetchCurrentUserId() {
  if (!username) {
    console.error("No username found in localStorage");
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching current user ID:", error.message);
  } else if (!data) {
    console.error("No user found with username:", username);
  } else {
    currentUserId = data.id;
  }
}

// Country name to ISO code map
const countryCodes = {
  "United States": "us",
  "Canada": "ca",
  "United Kingdom": "gb",
  "Germany": "de",
  "France": "fr",
  "Japan": "jp",
  "India": "in",
  "Philippines": "ph",
  "Brazil": "br",
  "South Korea": "kr",
  // Add more as needed
};

async function initialize() {
  await fetchCurrentUserId();
  setupRealtimeUserUpdates();
  fetchUsers();
}

document.addEventListener("DOMContentLoaded", () => {
  initialize();
});

// Adds a user to the Supabase 'users' table
const addUser = async (username, age, gender, country) => {
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, age, gender, country, status: "online" }]);

  if (error) {
    console.error("Error adding user:", error.message);
  } else {
    console.log("User added:", data);
  }
};

// Removes a user from Supabase based on their ID
const removeUser = async (id) => {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) {
    console.error("Error deleting user:", error.message);
  } else {
    console.log("User deleted");
  }
};

// Fetches all online users from the Supabase database
async function fetchUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("status", "online");

  if (error) {
    console.error("Error fetching users:", error.message);
    return;
  }

  displayUsers(data);
}

// Displays a list of users in the #content element
function displayUsers(users) {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = ""; // Clear existing users

  users.forEach((user) => {
    const userDiv = document.createElement("div");
    userDiv.className = "user-entry";

    const backgroundColor = user.gender === "Male" ? "#D6ECFF" : user.gender === "Female" ? "#FDE6FF" : "lightgray";
    const borderColor = user.gender === "Male" ? "#3A8DFF" : user.gender === "Female" ? "#D23EFF" : "gray";
    const hoverBackground = user.gender === "Male" ? "#B8DAFF" : user.gender === "Female" ? "#F5C7F5" : "#D3D3D3";
    const hoverBorder = user.gender === "Male" ? "#267BDA" : user.gender === "Female" ? "#C229C0" : "#888";

    const infoDiv = document.createElement("div");
    infoDiv.className = "user-info";
    infoDiv.style.cssText = `
        border: solid 3px;
        border-radius: 10px;
        background-color: ${backgroundColor};
        border-color: ${borderColor};
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
    `;

    // Set up hover effect
    setUserHoverEffect(infoDiv, backgroundColor, borderColor, hoverBackground, hoverBorder);

    // Add click event to open direct message page
    infoDiv.addEventListener("click", () => {
      if (currentUserId && user.id && user.id !== currentUserId) {
        window.location.href = `message.html?myId=${currentUserId}&otherId=${user.id}`;
      } else {
        console.error("Cannot start chat: currentUserId or user.id is missing");
      }
    });

    const nameSpan = document.createElement("span");
    nameSpan.className = "username";
    nameSpan.textContent = `${user.username}, ${user.age}`;

    const flagImg = document.createElement("img");
    flagImg.className = "flag";

    // Get the country code from the mapping, fallback to "xx" if not found
    const countryCode = countryCodes[user.country] || "xx";
    flagImg.src = `https://flagcdn.com/w20/${countryCode}.png`; // Flag image URL

    // If the country code is invalid or missing, use a default "unknown" flag
    flagImg.alt = user.country;
    flagImg.onerror = () => {
      flagImg.src = "https://flagcdn.com/w20/xx.png"; // Default fallback flag (unknown country)
    };

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(flagImg);
    userDiv.appendChild(infoDiv);
    contentDiv.appendChild(userDiv);
  });
}


// Set up hover effect for user info box
function setUserHoverEffect(infoDiv, backgroundColor, borderColor, hoverBackground, hoverBorder) {
  infoDiv.addEventListener("mouseenter", () => {
    infoDiv.style.backgroundColor = hoverBackground;
    infoDiv.style.borderColor = hoverBorder;
  });

  infoDiv.addEventListener("mouseleave", () => {
    infoDiv.style.backgroundColor = backgroundColor;
    infoDiv.style.borderColor = borderColor;
  });
}

// Subscribes to real-time updates on the 'users' table
function setupRealtimeUserUpdates() {
  supabase
    .channel("user-status")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      () => fetchUsers()
    )
    .subscribe();
}



/// FOOTER SCRIPT

// Select footer buttons
const logoutButton = document.getElementById("logoutButton");
const messagesButton = document.getElementById("messagesButton");
const logoutModal = document.getElementById("logoutModal");
const confirmLogout = document.getElementById("confirmLogout");
const cancelLogout = document.getElementById("cancelLogout");

// Show logout confirmation modal
logoutButton.addEventListener("click", () => {
  logoutModal.style.display = "flex";
});

// Confirm logout action
confirmLogout.addEventListener("click", async () => {
  // Get the current username from localStorage
  const username = localStorage.getItem("username");

  if (username) {
    // Update the user's status to 'offline' in Supabase
    const { error } = await supabase
      .from("users")
      .update({ status: "offline" })  // Set the user status as offline
      .eq("username", username);      // Find user by their username

    if (error) {
      console.error("Error updating user status:", error.message);
    } else {
      console.log("User status updated to offline");
    }

    // Clear the username from localStorage
    localStorage.removeItem("username");
  }

  // Redirect to the login page (index.html)
  window.location.href = "index.html"; 
});


// Cancel logout action
cancelLogout.addEventListener("click", () => {
  logoutModal.style.display = "none"; // Close modal
});

// Example of showing a notification on messages button (e.g., new messages)
function showNotification(hasNewMessages) {
  if (hasNewMessages) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = "1"; // Example: Shows "1" as the notification count
    messagesButton.appendChild(notification);
  }
}

// Call showNotification when new messages are detected
showNotification(true); // This should be based on your real-time logic



/// HEADER SCRIPT

// Add toggle functionality for mobile filter button// Toggle mobile filters
document.querySelector('.toggle-filters').addEventListener('click', function () {
  document.getElementById('header').classList.toggle('show-filters');
});


// Reference filter inputs
const searchInput = document.getElementById("search");
const minAgeInput = document.getElementById("min-age");
const maxAgeInput = document.getElementById("max-age");
const countrySelect = document.getElementById("country");
const ageRangeDisplay = document.getElementById("age-range-display");
const sliderTrack = document.querySelector(".slider-track");

// Attach listeners
searchInput.addEventListener("input", applyFilters);
minAgeInput.addEventListener("input", updateAgeRange);
maxAgeInput.addEventListener("input", updateAgeRange);
countrySelect.addEventListener("change", applyFilters);

// Update dual slider display and trigger filtering
function updateAgeRange() {
  let minAge = parseInt(minAgeInput.value);
  let maxAge = parseInt(maxAgeInput.value);

  // Ensure valid age range
  if (minAge > maxAge) {
      [minAgeInput.value, maxAgeInput.value] = [maxAge, minAge];
      [minAge, maxAge] = [maxAge, minAge];
  }

  // Update label
  ageRangeDisplay.textContent = `${minAge} - ${maxAge}`;

  // Update slider track visual
  const minBound = 18;
  const maxBound = 60;

  const minPercent = ((minAge - minBound) / (maxBound - minBound)) * 100;
  const maxPercent = ((maxAge - minBound) / (maxBound - minBound)) * 100;

  sliderTrack.style.left = `${minPercent}%`;
  sliderTrack.style.width = `${maxPercent - minPercent}%`;

  applyFilters();
}

// Filters and displays users
function applyFilters() {
  const search = searchInput.value.toLowerCase();
  const minAge = parseInt(minAgeInput.value);
  const maxAge = parseInt(maxAgeInput.value);
  const country = countrySelect.value;

  supabase
      .from("users")
      .select("*")
      .eq("status", "online")
      .then(({ data, error }) => {
          if (error) {
              console.error("Error fetching users:", error.message);
              return;
          }

          const filtered = data.filter((user) => {
              const userAge = parseInt(user.age);
              const matchesSearch = user.username.toLowerCase().includes(search);
              const matchesAge = userAge >= minAge && userAge <= maxAge;
              const matchesCountry = country === "all" || countryCodes[user.country] === country;

              return matchesSearch && matchesAge && matchesCountry;
          });

          displayUsers(filtered);
      });
}

// Initialize once on page load
updateAgeRange();


