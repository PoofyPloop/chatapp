// Supabase setup
import { supabase } from './supabaseClient.js';

// Ensure the script runs only after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // List of countries with their name and code
  const countries = [
    { name: "United States", code: "us" },
    { name: "Canada", code: "ca" },
    { name: "United Kingdom", code: "gb" },
    { name: "Germany", code: "de" },
    { name: "France", code: "fr" },
    { name: "Japan", code: "jp" },
    { name: "India", code: "in" },
    { name: "Philippines", code: "ph" },
    { name: "Brazil", code: "br" },
    { name: "South Korea", code: "kr" },
  ];

  // Grab the dropdown container, the list of countries, and the selected country element
  const dropdown = document.getElementById("country-dropdown");
  const countryList = document.getElementById("country-list");
  const selectedCountry = document.querySelector(".dropdown-selected");

  // Populate the dropdown with the countries
  countries.forEach((country) => {
    const div = document.createElement("div");
    div.classList.add("dropdown-item");
    div.innerHTML = `<img src="https://flagcdn.com/w20/${country.code}.png" alt="${country.name}" /> ${country.name}`;

    // When a country is clicked, update the selected country and close the dropdown
    div.onclick = () => {
      selectedCountry.innerHTML = div.innerHTML;
      dropdown.classList.remove("open");
    };

    // Append the country item to the dropdown list
    countryList.appendChild(div);
  });

  // Toggle the dropdown visibility when the selected country area is clicked
  selectedCountry.onclick = () => {
    dropdown.classList.toggle("open");
  };

  // Close the dropdown if the user clicks anywhere outside the dropdown
  window.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("open");
    }
  });

  // Handle the increment button for age input
  document.getElementById("increment-btn").onclick = () => {
    const ageInput = document.getElementById("age");
    const max = parseInt(ageInput.max);
    let current = parseInt(ageInput.value) || 18;
    if (current < max) {
      ageInput.value = current + 1;
    }
  };

  // Handle the decrement button for age input
  document.getElementById("decrement-btn").onclick = () => {
    const ageInput = document.getElementById("age");
    const min = parseInt(ageInput.min);
    let current = parseInt(ageInput.value) || 18;
    if (current > min) {
      ageInput.value = current - 1;
    }
  };
});

// Sign-in function to validate inputs and store in Supabase
async function signIn() {
  clearErrors();

  const username = document.getElementById("username").value;
  console.log("signIn: username =", username);
  const age = document.getElementById("age").value;
  const country = document.getElementById("selected-country").textContent;
  const gender = document.querySelector('input[name="gender"]:checked');

  let isValid = true;

  if (!username.trim()) {
    showError("username-error", "Username cannot be empty");
    isValid = false;
  }

  if (!age || age < 18 || age > 60) {
    showError("age-error", "Please enter a valid age (18 - 60)");
    isValid = false;
  }

  if (country === "Select Country") {
    showError("country-error", "Please select a country");
    isValid = false;
  }

  if (!gender) {
    showError("gender-error", "Please select a gender");
    isValid = false;
  }

  if (isValid) {
    // Trim values before saving and upserting
    const trimmedUsername = username.trim();
    const trimmedCountry = country.trim();
    const trimmedGender = gender.value.trim();

    // Saves user data to localStorage
    localStorage.setItem('username', trimmedUsername);
    localStorage.setItem('age', age);
    localStorage.setItem('country', trimmedCountry);
    localStorage.setItem('gender', trimmedGender);

    // Upsert to Supabase to mark user online
    await supabase.from('users').upsert([{
      username: trimmedUsername,
      age: parseInt(age),
      country: trimmedCountry,
      gender: trimmedGender,
      status: 'online'
    }]);

    // Redirect to chat.html
    window.location.href = 'chat.html';
  }
}

// Show error message for a specific element
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Clear all error messages from the form
function clearErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((errorElement) => {
    errorElement.textContent = "";
    errorElement.style.display = "none";
  });
}

window.signIn = signIn;
