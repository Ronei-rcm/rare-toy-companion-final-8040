import React from 'react';
import CartRecoveryBanner from './CartRecoveryBanner';
import CartRecoveryEmailModal from './CartRecoveryEmailModal';
import CartRecoveryPushNotification from './CartRecoveryPushNotification';
import { useCartRecovery } from '@/hooks/useCartRecovery';

const CartRecoveryManager: React.FC = () => {
  const { showRecoveryBanner, showEmailPrompt, setShowEmailPrompt } = useCartRecovery();

  return (
    <>
      {/* Banner de recuperação no topo */}
      <CartRecoveryBanner />
      
      {/* Modal de captura de email */}
      <CartRecoveryEmailModal 
        isOpen={showEmailPrompt} 
        onClose={() => setShowEmailPrompt(false)} 
      />
      
      {/* Notificação push no canto inferior */}
      <CartRecoveryPushNotification />
    </>
  );
};

export default CartRecoveryManager;
