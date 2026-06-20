import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('carbonwise-token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user details on load if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
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
        } else {
          // Token expired or invalid
          localStorage.removeItem('carbonwise-token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
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

  // Update Profile wrapper to update local auth context state
  const updateLocalUser = useCallback((updatedUser) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, updateLocalUser }}>
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
