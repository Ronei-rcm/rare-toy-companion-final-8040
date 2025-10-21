
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

const Admin = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAdminAuth = () => {
      // Verificar se há token de admin no localStorage
      const adminToken = localStorage.getItem('admin_token');
      const adminUser = localStorage.getItem('admin_user');
      
      // Verificar se o usuário atual é admin (simulação)
      const isCurrentUserAdmin = user?.id === '1' || user?.email === 'admin@exemplo.com';
      
      // Verificar se há token válido ou se o usuário atual é admin
      const hasValidAuth = adminToken && adminUser || isCurrentUserAdmin;
      
      if (!hasValidAuth) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAdminAuth();
  }, [user]);

  const handleLogin = () => {
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
            <p className="text-gray-600">
              Você precisa estar autenticado como administrador para acessar esta página.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
            >
              Fazer Login como Admin
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Ou acesse como usuário:</p>
              <button
                onClick={() => navigate('/')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Voltar para a Loja
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default Admin;
