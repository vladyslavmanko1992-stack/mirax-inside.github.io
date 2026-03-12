import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { userService } from '../services/db';

interface AuthContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
  updateUser: (u: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Load user from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem('mirax_current_user');
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      setUser(parsed);
    }
  }, []);

  // Real-time listener: sync user data from Firebase whenever it changes
  // This ensures ban status, role changes, etc. are reflected immediately
  useEffect(() => {
    // Cleanup previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!user) return;

    const unsub = userService.onUser(user.id, (freshUser) => {
      if (!freshUser) {
        // User was deleted from DB — force logout
        setUser(null);
        localStorage.removeItem('mirax_current_user');
        return;
      }
      // Update local state & localStorage with fresh data from Firebase
      setUser(freshUser);
      localStorage.setItem('mirax_current_user', JSON.stringify(freshUser));
    });
    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [user?.id]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mirax_current_user', JSON.stringify(userData));
  };

  const logout = () => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    setUser(null);
    localStorage.removeItem('mirax_current_user');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('mirax_current_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
