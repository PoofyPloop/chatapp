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
  const username = localStorage.getItem('username');

  console.log("fetchCurrentUserId: username =", username);

  if (!username) {
    console.error("No username found in localStorage");
    return;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username) 
    .limit(1)
    .maybeSingle();

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

// Deletes all offline users and their related data
const deleteOfflineUsersAndData = async () => {
  try {
    // Fetch IDs of offline users (status with capital 'O')
    const { data: offlineUsers, error: fetchError } = await supabase
      .from("users")
      .select("id")
    .eq("status", "offline");

    if (fetchError) {
      console.error("Error fetching offline users:", fetchError.message);
      return;
    }

    const offlineUserIds = offlineUsers.map(user => user.id);

    if (offlineUserIds.length === 0) {
      console.log("No offline users to delete.");
      return;
    }

    // Delete messages where sender_id or receiver_id is in offlineUserIds
    const { error: deleteMessagesError } = await supabase
      .from("messages")
      .delete()
      .or(
        offlineUserIds
          .map(id => `sender_id.eq.${id}`)
          .concat(offlineUserIds.map(id => `receiver_id.eq.${id}`))
          .join(",")
      );

    if (deleteMessagesError) {
      console.error("Error deleting messages for offline users:", deleteMessagesError.message);
      return;
    }

    // Delete offline users
    const { error: deleteUsersError } = await supabase
      .from("users")
      .delete()
      .in("id", offlineUserIds);

    if (deleteUsersError) {
      console.error("Error deleting offline users:", deleteUsersError.message);
      return;
    }

    console.log(`Deleted ${offlineUserIds.length} offline users and their related data.`);
  } catch (err) {
    console.error("Unexpected error deleting offline users and data:", err);
  }
};

// Automatically run deleteOfflineUsersAndData every 5 minutes (300000 ms)
setInterval(() => {
  deleteOfflineUsersAndData();
}, 300000);

// Fetches all online users from the Supabase database
async function fetchUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, age, gender, country")
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

  for (const user of users) {
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
      console.log("currentUserId:", currentUserId, "user.id:", user.id);
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
  }
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

// Inactivity logout after 15 minutes (900000 ms)
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    const username = localStorage.getItem("username");
    if (username) {
      // Update the user's status to 'offline' in Supabase on inactivity
      const { error } = await supabase
        .from("users")
        .update({ status: "offline" })  // Set the user status as offline
        .eq("username", username);

      if (error) {
        console.error("Error updating user status on inactivity:", error.message);
      } else {
        console.log("User status updated to offline due to inactivity");
      }

      // Clear localStorage and redirect to login
      localStorage.removeItem("username");
      window.location.href = "index.html";
    }
  }, 900000); // 15 minutes
}

// Reset inactivity timer on user interactions
["click", "mousemove", "keydown", "scroll", "touchstart"].forEach((event) => {
  window.addEventListener(event, resetInactivityTimer);
});

// Start the inactivity timer initially
resetInactivityTimer();


// Cancel logout action
cancelLogout.addEventListener("click", () => {
  logoutModal.style.display = "none"; // Close modal
});

let messageNotifications = {}; // { userId: { username, count } }
let notificationDropdown = null;

// Show or update the notification badge on messagesButton
function updateNotificationBadge() {
  const totalCount = Object.values(messageNotifications).reduce((sum, n) => sum + n.count, 0);
  let badge = messagesButton.querySelector(".notification");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "notification";
    messagesButton.appendChild(badge);
  }
  if (totalCount > 0) {
    badge.style.display = "block";
    badge.textContent = totalCount;
  } else {
    badge.style.display = "none";
  }
}

async function fetchMessageNotifications() {
  if (!currentUserId) return;

  // Fetch distinct user IDs from messages where currentUserId is sender or receiver
  const { data, error } = await supabase
    .from("messages")
    .select(`
      sender_id,
      receiver_id
    `)
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

  if (error) {
    console.error("Error fetching messages for notifications:", error.message);
    return;
  }

  // Collect distinct user IDs interacted with
  const userIdsSet = new Set();
  data.forEach(msg => {
    if (msg.sender_id === currentUserId) {
      userIdsSet.add(msg.receiver_id);
    } else {
      userIdsSet.add(msg.sender_id);
    }
  });

  const userIds = Array.from(userIdsSet);
  if (userIds.length === 0) {
    messageNotifications = {};
    updateNotificationBadge();
    return;
  }

  // Fetch usernames for these user IDs
  const { data: usersData, error: usersError } = await supabase
    .from("users")
    .select("id, username")
    .in("id", userIds);

  if (usersError) {
    console.error("Error fetching users for notifications:", usersError.message);
    return;
  }

  messageNotifications = {};
  usersData.forEach(user => {
    messageNotifications[user.id] = { username: user.username, count: 0 };
  });

  updateNotificationBadge();
}

// Create and show the notification dropdown listing users with notifications
function toggleNotificationDropdown() {
  if (notificationDropdown) {
    notificationDropdown.remove();
    notificationDropdown = null;
    return;
  }

  notificationDropdown = document.createElement("div");
  notificationDropdown.className = "notification-dropdown";
  notificationDropdown.style.position = "absolute";
  notificationDropdown.style.bottom = "50px";
  notificationDropdown.style.left = "10px";
  notificationDropdown.style.backgroundColor = "#fff";
  notificationDropdown.style.border = "1px solid #ccc";
  notificationDropdown.style.borderRadius = "5px";
  notificationDropdown.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  notificationDropdown.style.width = "250px";
  notificationDropdown.style.maxHeight = "300px";
  notificationDropdown.style.overflowY = "auto";
  notificationDropdown.style.zIndex = "1000";

  if (Object.keys(messageNotifications).length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "No new messages";
    emptyMsg.style.padding = "10px";
    notificationDropdown.appendChild(emptyMsg);
  } else {
    Object.entries(messageNotifications).forEach(([userId, { username, count }]) => {
      const userEntry = document.createElement("div");
      userEntry.className = "notification-user-entry";
      userEntry.style.padding = "10px";
      userEntry.style.cursor = "pointer";
      userEntry.style.display = "flex";
      userEntry.style.justifyContent = "space-between";
      userEntry.style.alignItems = "center";
      userEntry.style.borderBottom = "1px solid #eee";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = username;

      const countSpan = document.createElement("span");
      countSpan.textContent = count;
      countSpan.style.backgroundColor = "#ff3b30";
      countSpan.style.color = "#fff";
      countSpan.style.borderRadius = "12px";
      countSpan.style.padding = "2px 8px";
      countSpan.style.fontSize = "12px";

      userEntry.appendChild(nameSpan);
      userEntry.appendChild(countSpan);

      userEntry.addEventListener("click", () => {
        window.location.href = `message.html?myId=${currentUserId}&otherId=${userId}`;
        notificationDropdown.remove();
        notificationDropdown = null;
      });

      notificationDropdown.appendChild(userEntry);
    });
  }

  document.body.appendChild(notificationDropdown);
}

// Event listener for messagesButton click
messagesButton.addEventListener("click", () => {
  toggleNotificationDropdown();
});

// Initial fetch and update notifications periodically
async function refreshNotifications() {
  await fetchMessageNotifications();
  setTimeout(refreshNotifications, 30000); // Refresh every 30 seconds
}

refreshNotifications();



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


