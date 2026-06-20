import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('carbonwise-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure we have a profile with an email to assume logged in state
      if (parsed.userProfile && parsed.userProfile.email) {
        return parsed.userProfile;
      }
    }
  } catch (e) {}
  return null;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [token, setToken] = useState(localStorage.getItem('carbonwise-token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user details on load if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      // If we have a cached user, we can hide the loading skeleton immediately
      if (user) {
        setLoading(false);
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401 || response.status === 403) {
          // Only clear session on explicit authentication failure
          localStorage.removeItem('carbonwise-token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Do NOT log the user out on network failure or server bootup time
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Login
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('carbonwise-token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (email, password, name, location) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, location }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('carbonwise-token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('carbonwise-token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // Forgot Password (Request OTP)
  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data.message;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Reset Password (Verify OTP & Update Password)
  const resetPassword = useCallback(async (email, otp, newPassword) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      return data.message;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update Profile wrapper to update local auth context state
  const updateLocalUser = useCallback((updatedUser) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, updateLocalUser, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
