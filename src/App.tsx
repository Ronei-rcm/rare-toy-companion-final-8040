
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import '@/utils/cleanBrokenImages'; // Limpa imagens quebradas do localStorage
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from "@/contexts/CartContext";
// import { UserProvider } from "@/contexts/UserContext";
import { CurrentUserProvider } from "@/contexts/CurrentUserContext";
import { HomeConfigProvider } from "@/contexts/HomeConfigContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import CartToastWrapper from '@/components/CartToastWrapper';
import CartRecoveryManager from '@/components/loja/CartRecoveryManager';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NotificationPrompt } from '@/components/NotificationPrompt';

import { appRoutes } from "./routes/appRoutes";

const queryClient = new QueryClient();

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            {/* <UserProvider> */}
            <CurrentUserProvider>
              <HomeConfigProvider>
                <SettingsProvider>
                  <CartProvider>
                    {/* <CartToastWrapper> */}
                    {/* <CartRecoveryManager /> */}
                    {/* <AccessibilitySettings /> */}
                    {/* <PWAInstallPrompt /> */}
                    {/* <NotificationPrompt /> */}
                    <Router>
                      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Carregando...</div>}>
                        <Routes>
                          {appRoutes.map((route, index) => {
                            // Renderizar rotas com children de forma recursiva
                            if (route.children && route.children.length > 0) {
                              return (
                                <Route key={route.path || index} path={route.path} element={route.element}>
                                  {route.children.map((child, childIndex) => (
                                    <Route
                                      key={child.path || (child.index ? `index-${childIndex}` : childIndex)}
                                      index={child.index}
                                      path={child.path}
                                      element={child.element}
                                    />
                                  ))}
                                </Route>
                              );
                            }
                            // Rotas simples sem children
                            return (
                              <Route
                                key={route.path || index}
                                path={route.path}
                                element={route.element}
                              />
                            );
                          })}
                        </Routes>
                      </Suspense>
                    </Router>
                    {/* </CartToastWrapper> */}
                  </CartProvider>
                </SettingsProvider>
              </HomeConfigProvider>
            </CurrentUserProvider>
            {/* </UserProvider> */}
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
