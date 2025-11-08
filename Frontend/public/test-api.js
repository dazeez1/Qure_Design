// Test script to verify API configuration
console.log("Testing API configuration...");

// Test local configuration
const API_BASE_URL = "https://qure-design.onrender.com/api";
console.log("API_BASE_URL:", API_BASE_URL);

// Test API connection
fetch(`${API_BASE_URL}/health`)
  .then((response) => response.json())
  .then((data) => {
    console.log("✅ API Connection successful:", data);
  })
  .catch((error) => {
    console.error("❌ API Connection failed:", error);
  });
