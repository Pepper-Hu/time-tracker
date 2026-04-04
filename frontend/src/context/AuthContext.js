import React, { createContext, useState, useContext } from 'react';

// Auth context for managing login state across the app.
// It persists the logged-in user in localStorage and restores it on refresh.
const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'timeTrackerAuthUser';

// Restores the last logged-in user from localStorage if present.
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize user state from persisted storage on first render.
  const [user, setUser] = useState(getStoredUser);

  // Saves user state in memory and localStorage after successful login.
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  // Clears user state in memory and removes persisted auth data.
  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
