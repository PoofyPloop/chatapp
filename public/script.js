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
    const max = parseInt(ageInput.max); // Get the maximum allowed age
    let current = parseInt(ageInput.value) || 18; // Get the current age value, default to 18 if empty
    if (current < max) {
      // Ensure the value doesn't exceed the max
      ageInput.value = current + 1;
    }
  };

  // Handle the decrement button for age input
  document.getElementById("decrement-btn").onclick = () => {
    const ageInput = document.getElementById("age");
    const min = parseInt(ageInput.min); // Get the minimum allowed age
    let current = parseInt(ageInput.value) || 18; // Get the current age value, default to 18 if empty
    if (current > min) {
      // Ensure the value doesn't go below the min
      ageInput.value = current - 1;
    }
  };
});

// Sign-in function to validate inputs
function signIn() {
  clearErrors(); // Clear any previous error messages

  // Get the values of the form fields
  const username = document.getElementById("username").value;
  const age = document.getElementById("age").value;
  const country = document.getElementById("selected-country").textContent;
  const gender = document.querySelector('input[name="gender"]:checked');

  let isValid = true; // Flag to check if form is valid

  // Validate username
  if (!username.trim()) {
    showError("username-error", "Username cannot be empty"); // Show error if username is empty
    isValid = false; // Set validity flag to false
  }

  // Validate age (must be between 18 and 60)
  if (!age || age < 18 || age > 60) {
    showError("age-error", "Please enter a valid age (18 - 60)");
    isValid = false;
  }

  // Validate country selection
  if (country === "Select Country") {
    showError("country-error", "Please select a country");
    isValid = false;
  }

  // Validate gender selection
  if (!gender) {
    showError("gender-error", "Please select a gender");
    isValid = false;
  }

  // If the form is valid, show success alert (this can be expanded to actual form submission)
  if (isValid) {
    alert("Form submitted successfully");
  }
}

// Show error message for a specific element
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message; // Set the error message
  errorElement.style.display = "block"; // Make the error message visible
}

// Clear all error messages from the form
function clearErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((errorElement) => {
    errorElement.textContent = ""; // Clear the error message
    errorElement.style.display = "none"; // Hide the error message
  });
}
