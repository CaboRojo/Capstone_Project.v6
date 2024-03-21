import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";

const apiBaseURL = process.env.REACT_APP_API_URL;
const axiosInstance = axios.create({
  baseURL: apiBaseURL,
});

export const useAuth = () => {
  const [authState, setAuthState] = useState({
    userId: localStorage.getItem('userId'),
    token: localStorage.getItem('authToken'),
    isAuthenticated: false,
  });

  useEffect(() => {
    // This function ensures we're always using the latest state
    const updateAuthState = (token) => {
      const updatedIsAuthenticated = token && !isTokenExpired(token);
      setAuthState(currentAuthState => ({
        ...currentAuthState,
        isAuthenticated: updatedIsAuthenticated,
      }));

      axiosInstance.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';
    };

    updateAuthState(authState.token);
  }, [authState.token]); // Only re-run the effect if authState.token changes

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (e) {
      console.error("Error decoding token:", e);
      return true;
    }
  };

  const setAuthToken = (token) => {
    localStorage.setItem('authToken', token);
    setAuthState(currentAuthState => ({
      ...currentAuthState,
      token: token,
      isAuthenticated: token && !isTokenExpired(token),
    }));
  };

  const setUser = (userId) => {
    localStorage.setItem('userId', userId);
    setAuthState(currentAuthState => ({
      ...currentAuthState,
      userId: userId,
    }));
  };

  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setAuthState({
      userId: null,
      token: null,
      isAuthenticated: false,
    });
  };

  const checkIsAuthenticated = () => {
    const token = authState.token;
    return token && !isTokenExpired(token);
  };

  const handleAxiosError = (error) => {
    console.error("Error in authenticated request:", error);
    if (error.response) {
      return { error: error.response.data, status: error.response.status };
    } else if (error.request) {
      return { error: "No response from the server", status: null };
    } else {
      return { error: error.message, status: null };
    }
  };

  const authenticatedAxiosPost = async (url, data) => {
    if (!checkIsAuthenticated()) {
      console.error("User is not authenticated");
      return { error: "User is not authenticated", status: 401 };
    }
    try {
      const response = await axiosInstance.post(url, data);
      return response;
    } catch (error) {
      return handleAxiosError(error);
    }
  };

  const authenticatedAxiosGet = async (url) => {
    if (!checkIsAuthenticated()) {
      console.error("User is not authenticated");
      return { error: "User is not authenticated", status: 401 };
    }
    try {
      const response = await axiosInstance.get(url);
      return response;
    } catch (error) {
      return handleAxiosError(error);
    }
  };

  return {
    auth: authState,
    setAuthToken,
    setUser,
    clearAuth,
    isAuthenticated: checkIsAuthenticated,
    authenticatedAxiosPost,
    authenticatedAxiosGet,
  };
};