import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://localhost:7283/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically add a JWT token to each request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor for error handling (e.g. if the token is expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If a 401 (Unauthorized) error occurs, you can log out the user
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
