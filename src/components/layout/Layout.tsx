
import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartRecoveryEmailPrompt from '@/components/loja/CartRecoveryEmailPrompt';
import WhatsAppFloatingButton from '@/components/loja/WhatsAppFloatingButton';
import { ServiceWorkerUpdatePrompt } from '@/components/ServiceWorkerUpdatePrompt';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NativeEffects } from '@/components/ui/NativeEffects';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow transition-all duration-300" style={{ paddingTop: 'var(--header-height, 112px)' }}>
        {children}
      </main>
      <Footer />

      {/* Componentes de recuperação de carrinho */}
      <CartRecoveryEmailPrompt />

      {/* Botão flutuante do WhatsApp (configurável em Admin > Home Config) */}
      <WhatsAppFloatingButton />

      {/* Sistema de atualização automática do Service Worker */}
      <ServiceWorkerUpdatePrompt
        showToast={true}
        autoUpdate={false}
        checkInterval={60000}
      />

      {/* Indicador de status offline */}
      <OfflineIndicator />

      {/* Efeitos nativos (Splash, Haptics, Pull-to-refresh) */}
      <NativeEffects />
    </div>
  );
};

export default Layout;
