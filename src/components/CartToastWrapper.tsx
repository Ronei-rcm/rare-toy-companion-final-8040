import React from 'react';
import { useCart } from '@/contexts/CartContext';
import CartToastContainer from '@/components/loja/CartToastContainer';

interface CartToastWrapperProps {
  children: React.ReactNode;
}

const CartToastWrapper: React.FC<CartToastWrapperProps> = ({ children }) => {
  const { cartToast } = useCart();

  return (
    <>
      {children}
      <CartToastContainer
        toasts={cartToast.toasts}
        onRemoveToast={cartToast.removeToast}
        position="top-right"
      />
    </>
  );
};

export default CartToastWrapper;
