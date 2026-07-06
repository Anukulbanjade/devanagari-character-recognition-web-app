import axios from 'axios';

// Base API URL
const API_BASE_URL = "http://localhost:5000/api";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Function to get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  console.log("Using Token in API Requests:", token); // Debugging
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Authentication APIs
export const signup = async (data) => {
  try {
    const response = await api.post("/signup", data);
    return response;
  } catch (error) {
    console.error("Signup Error:", error.response?.data || error.message);
    throw error;
  }
};

export const signin = async (data) => {
  try {
    const response = await api.post("/signin", data);
    
    // Extract the token from the correct response structure
    if (response.data.data && response.data.data.token) {
      console.log("Received Token:", response.data.data.token);  // Debugging
      localStorage.setItem("token", response.data.data.token);  // Store token
    } else {
      console.error("No token received!");
    }

    // Return user data and token for further use if needed
    return {
      token: response.data.data.token,
      user: response.data.data.user
    };

  } catch (error) {
    console.error("Login Error:", error.response?.data || error.message);
    throw error;
  }
};

// Profile APIs
export const getProfile = () => api.get("/user/profile", { headers: getAuthHeaders() });
export const updateProfile = (data) =>
  api.put("/user/profile", data, { headers: getAuthHeaders() });
export const changePassword = (data) =>
  api.post("/user/change-password", data, { headers: getAuthHeaders() });

// Prediction APIs
export const predictImage = (formData) =>
  api.post("/predict", formData, {
    headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
  });
export const getAudio = (predictionId) =>
  api.get(`/generate-audio/${predictionId}`, { headers: getAuthHeaders() });

// History API
export const getHistory = () => api.get("/history", { headers: getAuthHeaders() });

// Logout Function
export const logout = () => {
  localStorage.removeItem("token");  // Remove token from localStorage
};
