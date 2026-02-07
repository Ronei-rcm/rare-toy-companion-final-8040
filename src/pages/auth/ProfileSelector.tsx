import { Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ProfileSelector = () => {
    const navigate = useNavigate();

    const handleSelection = (type: 'client' | 'admin') => {
        if (type === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Bem-vindo de volta!
                    </h1>
                    <p className="text-gray-600">
                        Como você deseja acessar o sistema?
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Modo Cliente */}
                    <Card
                        className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-primary"
                        onClick={() => handleSelection('client')}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <User className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Modo Cliente
                            </h2>
                            <p className="text-gray-600">
                                Navegar pela loja, fazer compras e gerenciar pedidos
                            </p>
                            <Button
                                className="w-full mt-4"
                                variant="outline"
                            >
                                Entrar como Cliente
                            </Button>
                        </div>
                    </Card>

                    {/* Modo Admin */}
                    <Card
                        className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-orange-500 bg-gradient-to-br from-orange-50 to-white"
                        onClick={() => handleSelection('admin')}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                                <Shield className="w-10 h-10 text-orange-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Painel Admin
                            </h2>
                            <p className="text-gray-600">
                                Gerenciar produtos, pedidos, clientes e configurações
                            </p>
                            <Button
                                className="w-full mt-4 bg-primary hover:bg-primary/90"
                            >
                                Acessar Painel
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Continuar como visitante
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSelector;
