
// Exemplo de lazy loading para componentes React
import { lazy, Suspense } from 'react';

// Componentes lazy
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CartPage = lazy(() => import('./pages/Cart'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));

// Componente de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Wrapper com Suspense
const LazyWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export { AdminDashboard, ProductDetail, CartPage, CheckoutPage, LazyWrapper };
