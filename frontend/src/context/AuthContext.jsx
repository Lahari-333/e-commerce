import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginApi, registerApi, getMeApi } from "../services/authApi";

const AuthContext = createContext(null);

const TOKEN_STORAGE_KEY = "shop_express_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  // Initialize and validate stored token on application mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await getMeApi(storedToken);
        if (isMounted && response.success && response.user) {
          setUser(response.user);
          setToken(storedToken);
        } else {
          // Token is invalid
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        // If 401 Unauthorized or invalid, remove stale token
        console.warn("Session validation failed or expired:", err.message);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with credentials and persist session
   */
  const login = useCallback(async (email, password) => {
    const response = await loginApi(email, password);
    if (response.success && response.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return response;
    }
    throw new Error(response.message || "Login failed");
  }, []);

  /**
   * Register a new user account
   */
  const register = useCallback(async (name, email, password) => {
    const response = await registerApi(name, email, password);
    return response;
  }, []);

  /**
   * Clear session and log out
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook for accessing the Auth Context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
