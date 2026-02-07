

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import BottomNav from '@/components/navigation/BottomNav';
import CartRecoveryBanner from '@/components/loja/CartRecoveryBanner';
import CartRecoveryEmailPrompt from '@/components/loja/CartRecoveryEmailPrompt';
import WhatsAppFloatingButton from '@/components/loja/WhatsAppFloatingButton';
import { ServiceWorkerUpdatePrompt } from '@/components/ServiceWorkerUpdatePrompt';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-20 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />

      {/* Componentes de recuperação de carrinho */}
      <CartRecoveryBanner />
      <CartRecoveryEmailPrompt />

      {/* Botão flutuante do WhatsApp (configurável em Admin > Home Config) */}
      <WhatsAppFloatingButton />

      {/* Sistema de atualização automática do Service Worker */}
      <ServiceWorkerUpdatePrompt
        showToast={true}
        autoUpdate={false}
        checkInterval={60000}
      />

      {/* Navegação inferior para mobile */}
      <BottomNav />
    </div>
  );
};


export default Layout;
