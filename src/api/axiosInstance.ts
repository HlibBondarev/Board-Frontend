import axios from "axios";
import { apiSettings } from "../AppSettings";

const axiosInstance = axios.create({
  baseURL: apiSettings.baseURL,
  headers: apiSettings.headers,
});

// We will attach the token dynamically in our Redux Thunks or API calls
// because useAuth0() hook is needed to get the fresh token.
export const setAuthToken = (token: string) => {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

export default axiosInstance;

// // Interceptor to automatically add a JWT token to each request
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

// // Interceptor for error handling (e.g. if the token is expired)
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // If a 401 (Unauthorized) error occurs, you can log out the user
//       localStorage.removeItem("token");
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   },
// );
