import React from 'react';
import { AnimatePresence } from 'framer-motion';
import ImprovedCartToast, { ImprovedToastData } from './ImprovedCartToast';
import { useCart } from '@/contexts/CartContext';

const CartToastContainer: React.FC = () => {
  const { cartToast } = useCart();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-md w-full pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {cartToast.toasts.map((toast) => (
            <div key={toast.id} className="mb-2">
              <ImprovedCartToast
                toast={toast as ImprovedToastData}
                onClose={cartToast.removeToast}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CartToastContainer;
