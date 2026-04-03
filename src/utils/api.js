/* utils/api.js */

const BASE_URL = "https://api-db-67gt.onrender.com";

/* ================= REFRESH TOKEN FUNCTION ================= */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token found");
  }

  try {
    // Note: Ensure the endpoint matches your backend (e.g., /auth/refresh/ with or without slash)
    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: refreshToken, // Common JWT field name is 'refresh' or 'refresh_token'
      }),
    });

    if (!response.ok) {
      // If refresh fails, session is truly dead
      localStorage.clear();
      window.location.href = "/";
      throw new Error("Session expired");
    }

    const data = await response.json();
    
    // Support both 'access' (DRF SimpleJWT) and 'access_token' (Standard)
    const newAccessToken = data.access || data.access_token;
    
    if (newAccessToken) {
      localStorage.setItem("access_token", newAccessToken);
      return newAccessToken;
    } else {
      throw new Error("No access token in response");
    }
  } catch (err) {
    localStorage.clear();
    window.location.href = "/";
    throw err;
  }
};

/* ================= MAIN API WRAPPER ================= */
/**
 * Custom fetch wrapper that handles:
 * 1. Automatic JWT Header injection
 * 2. FormData vs JSON content detection
 * 3. Automatic 401 Refresh & Retry logic
 */
export const apiFetch = async (url, options = {}) => {
  let token = localStorage.getItem("access_token");

  // Prepare Headers
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only add JSON Content-Type if we aren't sending a File/FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Ensure URL starts with /
  const targetUrl = url.startsWith("/") ? url : `/${url}`;
  
  let response = await fetch(`${BASE_URL}${targetUrl}`, {
    ...options,
    headers: headers,
  });

  /* If token expired (401) → refresh and retry once */
  // Avoid infinite loop if the request that failed WAS the refresh request
  if (response.status === 401 && !url.includes("/auth/refresh")) {
    try {
      const newToken = await refreshAccessToken();

      // Update header with new token for the retry
      headers["Authorization"] = `Bearer ${newToken}`;

      // Retry the exact same request
      response = await fetch(`${BASE_URL}${targetUrl}`, {
        ...options,
        headers: headers,
      });
    } catch (err) {
      console.error("Auth refresh failed:", err);
      // refreshAccessToken handles the redirect to "/"
    }
  }

  return response;
};

// Default export to resolve module import errors
export default apiFetch;