import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, signUpUser, fetchCurrentUser, logoutUser, getStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('zeroleak_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Validate persisted token on initial load
  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (mounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const verifiedUser = await fetchCurrentUser(storedToken);
        if (mounted) {
          setUser(verifiedUser);
          setToken(storedToken);
          localStorage.setItem('zeroleak_user', JSON.stringify(verifiedUser));
        }
      } catch (err) {
        console.warn('Session verification failed or expired:', err.message);
        if (mounted) {
          localStorage.removeItem('zeroleak_token');
          localStorage.removeItem('zeroleak_user');
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password);
    if (!res || !res.access_token) {
      throw new Error('Authentication failed: missing access token.');
    }
    const authToken = res.access_token;
    const authUser = res.user;

    localStorage.setItem('zeroleak_token', authToken);
    localStorage.setItem('zeroleak_user', JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);
    return res;
  }, []);

  const signup = useCallback(async (userData) => {
    const res = await signUpUser(userData);
    if (!res || !res.access_token) {
      throw new Error('Provisioning failed: missing access token.');
    }
    const authToken = res.access_token;
    const authUser = res.user;

    localStorage.setItem('zeroleak_token', authToken);
    localStorage.setItem('zeroleak_user', JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
