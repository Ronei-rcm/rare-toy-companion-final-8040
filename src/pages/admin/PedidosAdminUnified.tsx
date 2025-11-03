import React from 'react';
import Layout from '@/components/layout/Layout';
import OrdersUnified from '@/components/admin/OrdersUnified';

const PedidosAdminUnified: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Pedidos</h1>
          <p className="text-gray-600 mt-2">
            Sistema unificado de gestão de pedidos com sincronização em tempo real
          </p>
        </div>
        
        <OrdersUnified />
      </div>
    </Layout>
  );
};

export default PedidosAdminUnified;

