import React from 'react';
import EnhancedDashboard from '@/components/admin/EnhancedDashboard';

const Dashboard = () => {
  return (
    <div className="relative">
      {/* Header mobile com espaço para o botão */}
      <div className="md:hidden pt-20 px-4 pb-6 bg-gradient-to-b from-white via-white/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">Visão geral do seu negócio</p>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-4"></div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="p-4 md:p-6">
        <EnhancedDashboard />
      </div>
    </div>
  );
};

export default Dashboard;