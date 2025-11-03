import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();

  // Critério simples: presença de admin_token no localStorage ou cookie (fallback via header é feito no backend)
  const adminToken =
    (typeof window !== 'undefined' && localStorage.getItem('admin_token')) || '';

  if (!adminToken) {
    const redirectTo = `/admin/login?redirect=${encodeURIComponent(
      location.pathname + location.search
    )}`;
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>; 
};

export default AdminRoute;






