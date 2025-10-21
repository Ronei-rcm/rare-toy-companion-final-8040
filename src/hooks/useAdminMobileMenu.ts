import { useState, createContext, useContext } from 'react';

interface AdminMobileMenuContextType {
  isOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const AdminMobileMenuContext = createContext<AdminMobileMenuContextType | undefined>(undefined);

export function AdminMobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <AdminMobileMenuContext.Provider value={{ isOpen, openMenu, closeMenu, toggleMenu }}>
      {children}
    </AdminMobileMenuContext.Provider>
  );
}

export function useAdminMobileMenu() {
  const context = useContext(AdminMobileMenuContext);
  if (context === undefined) {
    throw new Error('useAdminMobileMenu must be used within an AdminMobileMenuProvider');
  }
  return context;
}
