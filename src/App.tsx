
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import '@/utils/cleanBrokenImages'; // Limpa imagens quebradas do localStorage
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from "@/contexts/CartContext";
// import { UserProvider } from "@/contexts/UserContext";
import { CurrentUserProvider } from "@/contexts/CurrentUserContext";
import { HomeConfigProvider } from "@/contexts/HomeConfigContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';
import CartToastWrapper from '@/components/CartToastWrapper';
import CartRecoveryManager from '@/components/loja/CartRecoveryManager';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { NotificationPrompt } from '@/components/NotificationPrompt';

const Index = React.lazy(() => import("./pages/Index"));
const Loja = React.lazy(() => import("./pages/Loja"));
const ProdutoDetalhe = React.lazy(() => import("./pages/ProdutoDetalhe"));
const Carrinho = React.lazy(() => import("./pages/Carrinho"));
const Destaques = React.lazy(() => import("./pages/Destaques"));
const Admin = React.lazy(() => import("./pages/admin/Admin"));
const Dashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const Produtos = React.lazy(() => import("./pages/admin/Produtos"));
const InstagramIntegracao = React.lazy(() => import("./pages/admin/InstagramIntegracao"));
const Clientes = React.lazy(() => import("./pages/admin/Clientes"));
const Pedidos = React.lazy(() => import("./pages/admin/Pedidos"));
const PedidosEvolved = React.lazy(() => import("./pages/admin/PedidosEvolved"));
const PedidosAdvanced = React.lazy(() => import("./pages/admin/PedidosAdvanced"));
const WhatsAppGrupos = React.lazy(() => import("./pages/admin/WhatsAppGrupos"));
const HomeConfig = React.lazy(() => import("./pages/admin/HomeConfig"));
const Fornecedores = React.lazy(() => import("./pages/admin/Fornecedores"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Colecoes = React.lazy(() => import("./pages/Colecoes"));
const ColecaoDetalhe = React.lazy(() => import("./pages/ColecaoDetalhe"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Cadastro = React.lazy(() => import("./pages/auth/Cadastro"));
const MinhaConta = React.lazy(() => import("./pages/cliente/MinhaConta"));
const Colecao = React.lazy(() => import("./pages/Colecao"));
const Mercado = React.lazy(() => import("./pages/Mercado"));
const Sobre = React.lazy(() => import("./pages/Sobre"));
const Eventos = React.lazy(() => import("./pages/Eventos"));
const Suporte = React.lazy(() => import("./pages/Suporte"));
const LegalPage = React.lazy(() => import("./pages/LegalPage"));
const EventosAdmin = React.lazy(() => import("./pages/admin/EventosAdmin"));
const ColecoesAdmin = React.lazy(() => import("./pages/admin/ColecoesAdmin"));
const ConfiguracoesAdmin = React.lazy(() => import("./pages/admin/Configuracoes"));
const RecuperacaoAdmin = React.lazy(() => import("./pages/admin/Recuperacao"));
const SobreAdmin = React.lazy(() => import("./pages/admin/SobreAdmin"));
const SuporteAdmin = React.lazy(() => import("./pages/admin/SuporteAdmin"));
const PaginasAdmin = React.lazy(() => import("./pages/admin/PaginasAdmin"));
const ReviewsAdmin = React.lazy(() => import("./pages/admin/ReviewsAdmin"));
const Financeiro = React.lazy(() => import("./pages/admin/Financeiro"));
const FornecedoresFinanceiro = React.lazy(() => import("./pages/admin/FornecedoresFinanceiro"));
const Lancamentos = React.lazy(() => import("./pages/admin/Lancamentos"));
const MetasFinanceiras = React.lazy(() => import("./pages/admin/MetasFinanceiras"));
const Funcionarios = React.lazy(() => import("./pages/admin/Funcionarios"));
const UsuariosAdmin = React.lazy(() => import("./pages/admin/UsuariosAdmin"));
const Teste = React.lazy(() => import("./pages/admin/Teste"));
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin"));
const AdminReset = React.lazy(() => import("./pages/admin/ResetPassword"));
const BlogAdmin = React.lazy(() => import("./pages/admin/BlogAdmin"));
const Blog = React.lazy(() => import("./pages/Blog"));
const BlogPost = React.lazy(() => import("./pages/BlogPost"));
const MarketplaceAdmin = React.lazy(() => import("./pages/admin/MarketplaceAdmin"));
const CategoriasAdmin = React.lazy(() => import("./pages/admin/CategoriasAdmin"));

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
              <Route path="/" element={<Index />} />
              <Route path="/loja" element={<Loja />} />
              <Route path="/produto/:id" element={<ProdutoDetalhe />} />
              <Route path="/carrinho" element={<Carrinho />} />
              <Route path="/destaques" element={<Destaques />} />
              
              <Route path="/colecao" element={<Colecoes />} />
              <Route path="/colecao/:id" element={<ColecaoDetalhe />} />
              <Route path="/collection" element={<Colecao />} />
              <Route path="/marketplace" element={<Mercado />} />
              <Route path="/about" element={<Sobre />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/suporte" element={<Suporte />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              
              {/* Páginas Legais e Institucionais */}
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/terms" element={<LegalPage />} />
              <Route path="/cookies" element={<LegalPage />} />
              <Route path="/pricing" element={<LegalPage />} />
              <Route path="/contact" element={<LegalPage />} />
              <Route path="/faq" element={<LegalPage />} />
              
              {/* Rotas de autenticação e conta do cliente */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/cadastro" element={<Cadastro />} />
              <Route path="/minha-conta" element={<ProtectedRoute><MinhaConta /></ProtectedRoute>} />
              <Route path="/minha-conta/pedido/:id" element={<ProtectedRoute>{React.createElement(React.lazy(() => import('./pages/cliente/PedidoDetalhe')))}</ProtectedRoute>} />
              
              {/* Rota de login administrativo */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/reset" element={<AdminReset />} />
              
              {/* Rotas administrativas */}
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="produtos" element={<Produtos />} />
                <Route path="categorias" element={<CategoriasAdmin />} />
                <Route path="colecoes" element={<ColecoesAdmin />} />
                <Route path="blog" element={<BlogAdmin />} />
                <Route path="marketplace" element={<MarketplaceAdmin />} />
                <Route path="instagram" element={<InstagramIntegracao />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="pedidos" element={<Pedidos />} />
                <Route path="pedidos-evolved" element={<PedidosEvolved />} />
                <Route path="pedidos-advanced" element={<PedidosAdvanced />} />
                <Route path="home-config" element={<HomeConfig />} />
                <Route path="whatsapp-grupos" element={<WhatsAppGrupos />} />
                <Route path="fornecedores" element={<Fornecedores />} />
                <Route path="configuracoes" element={<ConfiguracoesAdmin />} />
                <Route path="recuperacao" element={<RecuperacaoAdmin />} />
                <Route path="eventos" element={<EventosAdmin />} />
                  <Route path="financeiro" element={<Financeiro />} />
                  <Route path="fornecedores-financeiro" element={<FornecedoresFinanceiro />} />
                  <Route path="lancamentos" element={<Lancamentos />} />
                  <Route path="metas-financeiras" element={<MetasFinanceiras />} />
                  <Route path="funcionarios" element={<Funcionarios />} />
                  <Route path="usuarios" element={<UsuariosAdmin />} />
                  <Route path="teste" element={<Teste />} />
                <Route path="sobre" element={<SobreAdmin />} />
                <Route path="suporte" element={<SuporteAdmin />} />
                <Route path="paginas" element={<PaginasAdmin />} />
                <Route path="reviews" element={<ReviewsAdmin />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
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
