import React from "react";
import { RouteObject } from "react-router-dom";

// Páginas públicas
const Index = React.lazy(() => import("@/pages/Index"));
const Loja = React.lazy(() => import("@/pages/Loja"));
const ProdutoDetalhe = React.lazy(() => import("@/pages/ProdutoDetalhe"));
const Carrinho = React.lazy(() => import("@/pages/Carrinho"));
const Destaques = React.lazy(() => import("@/pages/Destaques"));
const Colecoes = React.lazy(() => import("@/pages/Colecoes"));
const ColecaoDetalhe = React.lazy(() => import("@/pages/ColecaoDetalhe"));
const Colecao = React.lazy(() => import("@/pages/Colecao"));
const Mercado = React.lazy(() => import("@/pages/Mercado"));
const Sobre = React.lazy(() => import("@/pages/Sobre"));
const Eventos = React.lazy(() => import("@/pages/Eventos"));
const Videos = React.lazy(() => import("@/pages/Videos"));
const Suporte = React.lazy(() => import("@/pages/Suporte"));
const Blog = React.lazy(() => import("@/pages/Blog"));
const BlogPost = React.lazy(() => import("@/pages/BlogPost"));
const LegalPage = React.lazy(() => import("@/pages/LegalPage"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));

// Autenticação / conta do cliente
const Login = React.lazy(() => import("@/pages/auth/Login"));
const Cadastro = React.lazy(() => import("@/pages/auth/Cadastro"));
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = React.lazy(() => import("@/pages/auth/ResetPassword"));
const MinhaConta = React.lazy(() => import("@/pages/cliente/MinhaConta"));
const PedidoDetalhe = React.lazy(() => import("@/pages/cliente/PedidoDetalhe"));

// Admin
const Admin = React.lazy(() => import("@/pages/admin/Admin"));
const Dashboard = React.lazy(() => import("@/pages/admin/Dashboard"));
const Produtos = React.lazy(() => import("@/pages/admin/Produtos"));
const InstagramIntegracao = React.lazy(() => import("@/pages/admin/InstagramIntegracao"));
const Clientes = React.lazy(() => import("@/pages/admin/Clientes"));
const Pedidos = React.lazy(() => import("@/pages/admin/Pedidos"));
const PedidosEvolved = React.lazy(() => import("@/pages/admin/PedidosEvolved"));
const PedidosAdvanced = React.lazy(() => import("@/pages/admin/PedidosAdvanced"));
const WhatsAppGrupos = React.lazy(() => import("@/pages/admin/WhatsAppGrupos"));
const HomeConfig = React.lazy(() => import("@/pages/admin/HomeConfig"));
const VideoGalleryAdmin = React.lazy(() => import("@/pages/admin/VideoGalleryAdmin"));
const Fornecedores = React.lazy(() => import("@/pages/admin/Fornecedores"));
const EventosAdmin = React.lazy(() => import("@/pages/admin/EventosAdmin"));
const ColecoesAdmin = React.lazy(() => import("@/pages/admin/ColecoesAdmin"));
const ConfiguracoesAdmin = React.lazy(() => import("@/pages/admin/Configuracoes"));
const RecuperacaoAdmin = React.lazy(() => import("@/pages/admin/Recuperacao"));
const SobreAdmin = React.lazy(() => import("@/pages/admin/SobreAdmin"));
const SuporteAdmin = React.lazy(() => import("@/pages/admin/SuporteAdmin"));
const PaginasAdmin = React.lazy(() => import("@/pages/admin/PaginasAdmin"));
const ReviewsAdmin = React.lazy(() => import("@/pages/admin/ReviewsAdmin"));
const Financeiro = React.lazy(() => import("@/pages/admin/Financeiro"));
const Relatorios = React.lazy(() => import("@/pages/admin/Relatorios"));
const FornecedoresFinanceiro = React.lazy(() => import("@/pages/admin/FornecedoresFinanceiro"));
const Lancamentos = React.lazy(() => import("@/pages/admin/Lancamentos"));
const MetasFinanceiras = React.lazy(() => import("@/pages/admin/MetasFinanceiras"));
const Funcionarios = React.lazy(() => import("@/pages/admin/Funcionarios"));
const UsuariosAdmin = React.lazy(() => import("@/pages/admin/UsuariosAdmin"));
const Teste = React.lazy(() => import("@/pages/admin/Teste"));
const AdminLogin = React.lazy(() => import("@/pages/admin/AdminLogin"));
const AdminReset = React.lazy(() => import("@/pages/admin/ResetPassword"));
const BlogAdmin = React.lazy(() => import("@/pages/admin/BlogAdmin"));
const MarketplaceAdmin = React.lazy(() => import("@/pages/admin/MarketplaceAdmin"));
const CategoriasAdmin = React.lazy(() => import("@/pages/admin/CategoriasAdmin"));
const Automacoes = React.lazy(() => import("@/pages/admin/Automacoes"));
const DatabaseBackup = React.lazy(() => import("@/pages/admin/DatabaseBackup"));

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// Rotas públicas (sem autenticação)
export const publicRoutes: RouteObject[] = [
  { path: "/", element: <Index /> },
  { path: "/loja", element: <Loja /> },
  { path: "/produto/:id", element: <ProdutoDetalhe /> },
  { path: "/carrinho", element: <Carrinho /> },
  { path: "/destaques", element: <Destaques /> },
  { path: "/colecao", element: <Colecoes /> },
  { path: "/colecao/:id", element: <ColecaoDetalhe /> },
  { path: "/collection", element: <Colecao /> },
  { path: "/marketplace", element: <Mercado /> },
  { path: "/about", element: <Sobre /> },
  { path: "/eventos", element: <Eventos /> },
  { path: "/videos", element: <Videos /> },
  { path: "/suporte", element: <Suporte /> },
  { path: "/blog", element: <Blog /> },
  { path: "/blog/:slug", element: <BlogPost /> },
  // Páginas legais / institucionais
  { path: "/privacy", element: <LegalPage /> },
  { path: "/terms", element: <LegalPage /> },
  { path: "/cookies", element: <LegalPage /> },
  { path: "/pricing", element: <LegalPage /> },
  { path: "/contact", element: <LegalPage /> },
  { path: "/faq", element: <LegalPage /> }
];

// Rotas de auth e conta do cliente
export const customerRoutes: RouteObject[] = [
  { path: "/auth/login", element: <Login /> },
  { path: "/auth/cadastro", element: <Cadastro /> },
  { path: "/auth/recuperar-senha", element: <ForgotPassword /> },
  { path: "/auth/reset-password", element: <ResetPassword /> },
  {
    path: "/minha-conta",
    element: (
      <ProtectedRoute>
        <MinhaConta />
      </ProtectedRoute>
    )
  },
  {
    path: "/minha-conta/pedido/:id",
    element: (
      <ProtectedRoute>
        <PedidoDetalhe />
      </ProtectedRoute>
    )
  }
];

// Rotas administrativas
export const adminRoutes: RouteObject[] = [
  { path: "/admin/login", element: <AdminLogin /> },
  { path: "/admin/reset", element: <AdminReset /> },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <Admin />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "produtos", element: <Produtos /> },
      { path: "categorias", element: <CategoriasAdmin /> },
      { path: "colecoes", element: <ColecoesAdmin /> },
      { path: "blog", element: <BlogAdmin /> },
      { path: "marketplace", element: <MarketplaceAdmin /> },
      { path: "instagram", element: <InstagramIntegracao /> },
      { path: "clientes", element: <Clientes /> },
      { path: "pedidos", element: <Pedidos /> },
      { path: "pedidos-evolved", element: <PedidosEvolved /> },
      { path: "pedidos-advanced", element: <PedidosAdvanced /> },
      { path: "automacoes", element: <Automacoes /> },
      { path: "home-config", element: <HomeConfig /> },
      { path: "video-gallery", element: <VideoGalleryAdmin /> },
      { path: "whatsapp-grupos", element: <WhatsAppGrupos /> },
      { path: "fornecedores", element: <Fornecedores /> },
      { path: "configuracoes", element: <ConfiguracoesAdmin /> },
      { path: "recuperacao", element: <RecuperacaoAdmin /> },
      { path: "eventos", element: <EventosAdmin /> },
      { path: "financeiro", element: <Financeiro /> },
      { path: "relatorios", element: <Relatorios /> },
      { path: "fornecedores-financeiro", element: <FornecedoresFinanceiro /> },
      { path: "lancamentos", element: <Lancamentos /> },
      { path: "metas-financeiras", element: <MetasFinanceiras /> },
      { path: "funcionarios", element: <Funcionarios /> },
      { path: "usuarios", element: <UsuariosAdmin /> },
      { path: "teste", element: <Teste /> },
      { path: "sobre", element: <SobreAdmin /> },
      { path: "suporte", element: <SuporteAdmin /> },
      { path: "paginas", element: <PaginasAdmin /> },
      { path: "reviews", element: <ReviewsAdmin /> },
      { path: "database-backup", element: <DatabaseBackup /> }
    ]
  }
];

// Rota catch-all
export const fallbackRoutes: RouteObject[] = [
  { path: "*", element: <NotFound /> }
];

// Rotas combinadas para uso no App (se quiser usar useRoutes)
export const appRoutes: RouteObject[] = [
  ...publicRoutes,
  ...customerRoutes,
  ...adminRoutes,
  ...fallbackRoutes
];


