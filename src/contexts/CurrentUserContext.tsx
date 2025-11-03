import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';

interface CurrentUserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void> | void;
  isLoading: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    const loadFromSession = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.authenticated && data?.user?.email) {
            setUser({ id: data.user.id || data.user.email, email: data.user.email, nome: data.user.nome, avatar_url: data.user.avatar_url } as any);
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadFromSession();
  }, []);

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    try {
      setIsLoading(true);
      setUser({ ...user, ...userData });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try { 
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); 
    } catch {}
    
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('minha_conta_tab');
      localStorage.removeItem('muhlstore-saved-cart');
    } catch {}
    
    setUser(null);
  };

  return (
    <CurrentUserContext.Provider value={{ user, setUser, updateUser, logout, isLoading }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
}
