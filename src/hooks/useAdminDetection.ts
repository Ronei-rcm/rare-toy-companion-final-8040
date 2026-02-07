import { useEffect, useState } from 'react';

export interface AdminUser {
    id: string;
    nome: string;
    email: string;
    role: 'admin' | 'gerente' | 'operador' | 'viewer';
    permissoes: string[];
}

export const useAdminDetection = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
                const response = await fetch(`${API_BASE_URL}/admin/me`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated && data.user) {
                        setIsAdmin(true);
                        setAdminUser(data.user);
                    }
                }
            } catch (error) {
                console.log('Não é admin ou não autenticado');
            } finally {
                setLoading(false);
            }
        };

        checkAdminStatus();
    }, []);

    return { isAdmin, adminUser, loading };
};
