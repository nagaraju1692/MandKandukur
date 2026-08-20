import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchJson } from '../services/api';

export type UserProfile = {
  name: string;
  phone: string;
  role?: 'user' | 'admin' | 'super_admin';
  isSuperAdmin?: boolean;
};

type AuthContextValue = {
  user: UserProfile | null;
  favorites: string[];
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  login: (profile: UserProfile) => Promise<UserProfile>;
  logout: () => Promise<void>;
  toggleFavorite: (businessId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [savedUser, savedFavorites] = await Promise.all([
          AsyncStorage.getItem('mana-kandukur-mobile-user'),
          AsyncStorage.getItem('mana-kandukur-mobile-favorites'),
        ]);

        if (!isMounted) return;

        if (savedUser) {
          setUser(JSON.parse(savedUser) as UserProfile);
        }

        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites) as string[];
          if (Array.isArray(parsed)) setFavorites(parsed);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setFavorites([]);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      AsyncStorage.setItem('mana-kandukur-mobile-user', JSON.stringify(user));
    } else {
      AsyncStorage.removeItem('mana-kandukur-mobile-user');
    }
  }, [user]);

  useEffect(() => {
    AsyncStorage.setItem('mana-kandukur-mobile-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const login = async (profile: UserProfile) => {
    const response = await fetchJson<{ data: UserProfile }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const favoritesResponse = await fetchJson<{ data: string[] }>(`/api/users/${response.data.phone}/favorites`, undefined, response.data.phone);
    setUser(response.data);
    setFavorites(favoritesResponse.data);
    return response.data;
  };

  const logout = async () => {
    setUser(null);
    setFavorites([]);
  };

  const toggleFavorite = async (businessId: string) => {
    if (!user) return;
    const response = await fetchJson<{ data: string[] }>(`/api/users/${user.phone}/favorites/${encodeURIComponent(businessId)}`, { method: 'PUT' }, user.phone);
    setFavorites(response.data);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    favorites,
    isLoggedIn: !!user,
    isSuperAdmin: Boolean(user?.isSuperAdmin || user?.role === 'admin' || user?.role === 'super_admin'),
    login,
    logout,
    toggleFavorite,
  }), [user, favorites]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
