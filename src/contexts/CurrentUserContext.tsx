import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { authApi } from '@/services/auth-api';
import { usersApi } from '@/services/users-api';

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
  useEffect(() => {
    const loadFromSession = async () => {
      try {
        setIsLoading(true);
        const data = await authApi.me();

        if (data.success && data.user) {
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
            // Preciso garantir que usersApi tenha esses métodos ou adicionar aqui
            // Como não vi usersApi ainda com esses métodos específicos para customers (que parecem ser diferentes de users administrativos),
            // vou assumir por enquanto que posso adicionar lá ou fazer a request direta usando o helper se não existirem.
            // Mas para seguir o padrão, vou adicionar no usersApi.

            const customerData = await usersApi.getCustomerById(userId).catch(() => null);

            if (!customerData && data.user.email) {
              const emailData = await usersApi.getCustomerByEmail(data.user.email).catch(() => null);
              if (emailData) {
                fullUserData = { ...fullUserData, ...emailData }; // Ajustar mapeamento se necessário
              }
            } else if (customerData) {
              fullUserData = { ...fullUserData, ...customerData };
            }
          } catch (e) {
            console.log('Não foi possível buscar dados completos do cliente:', e);
          }

          setUser(fullUserData as any);
        }
      } catch (e) {
        // Tratar erros de rede de forma silenciosa
        console.warn('⚠️ Erro de conexão ao verificar autenticação. Continuando sem usuário.');
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
      await authApi.logout();
    } catch { }

    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('minha_conta_tab');
      localStorage.removeItem('muhlstore-saved-cart');
    } catch { }

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
