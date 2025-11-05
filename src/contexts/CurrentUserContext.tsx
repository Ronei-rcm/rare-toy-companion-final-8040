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
            // Buscar dados completos do cliente
            const userId = data.user.id || data.user.email;
            let fullUserData = {
              id: userId,
              email: data.user.email,
              nome: data.user.nome || data.user.email,
              avatar_url: data.user.avatar_url
            };

            // Tentar buscar dados completos do cliente
            try {
              const customerRes = await fetch(`${API_BASE_URL}/customers/${userId}`, {
                credentials: 'include'
              });

              // Se não encontrar por ID, tentar por email
              if (!customerRes.ok && data.user.email) {
                const emailRes = await fetch(`${API_BASE_URL}/customers/by-email/${encodeURIComponent(data.user.email)}`, {
                  credentials: 'include'
                });
                
                if (emailRes.ok) {
                  const customerData = await emailRes.json();
                  fullUserData = {
                    ...fullUserData,
                    nome: customerData.nome || fullUserData.nome,
                    telefone: customerData.telefone || customerData.phone,
                    endereco: customerData.endereco || customerData.address,
                    cidade: customerData.cidade || customerData.city,
                    estado: customerData.estado || customerData.state,
                    cep: customerData.cep || customerData.postal_code,
                    avatar_url: customerData.avatar_url || customerData.avatar || fullUserData.avatar_url
                  };
                }
              } else if (customerRes.ok) {
                const customerData = await customerRes.json();
                fullUserData = {
                  ...fullUserData,
                  nome: customerData.nome || fullUserData.nome,
                  telefone: customerData.telefone || customerData.phone,
                  endereco: customerData.endereco || customerData.address,
                  cidade: customerData.cidade || customerData.city,
                  estado: customerData.estado || customerData.state,
                  cep: customerData.cep || customerData.postal_code,
                  avatar_url: customerData.avatar_url || customerData.avatar || fullUserData.avatar_url
                };
              }
            } catch (e) {
              // Se não conseguir buscar dados completos, usar dados básicos
              console.log('Não foi possível buscar dados completos do cliente:', e);
            }

            setUser(fullUserData as any);
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
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Notificar outros componentes sobre a atualização
      window.dispatchEvent(new CustomEvent('user-data-updated', {
        detail: updatedUser
      }));
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
