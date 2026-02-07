import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { authApi } from '@/services/auth-api';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void> | void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const loadFromSession = async () => {
      try {
        setIsLoading(true);
        const data = await authApi.me();
        if (data.success && data.user) {
          // data.user já deve vir no formato esperado, ou fazemos o mapeamento aqui se necessário
          setUser(data.user);
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
      // Aqui manteremos apenas estado local por ora, mas idealmente chamaria authApi.updateProfile
      setUser({ ...user, ...userData });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch { }

    // Limpar todos os dados do usuário do localStorage
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('minha_conta_tab');
      localStorage.removeItem('muhlstore-saved-cart');
    } catch { }

    // Limpar estado do usuário
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook principal com nome diferente para evitar conflitos
export function useCurrentUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
}

// Manter compatibilidade com código existente - exportação como função
export function useUser() {
  return useCurrentUser();
}
