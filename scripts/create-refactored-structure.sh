#!/bin/bash

# Script para criar estrutura de pastas e arquivos base
# para a refatoração do backend
#
# Uso: ./scripts/create-refactored-structure.sh

set -e

echo "🚀 Criando estrutura para refatoração do backend..."

# Criar pastas
mkdir -p server/routes
mkdir -p server/controllers
mkdir -p server/services
mkdir -p tests/unit/routes
mkdir -p tests/unit/controllers
mkdir -p tests/unit/services

echo "✅ Pastas criadas"

# Criar arquivo de rotas index
cat > server/routes/index.cjs << 'EOF'
/**
 * Index de Rotas
 * 
 * Este arquivo agrega todas as rotas do sistema
 */

const express = require('express');
const router = express.Router();

// Importar rotas
// const productsRoutes = require('./products.routes.cjs');
// const ordersRoutes = require('./orders.routes.cjs');
// const customersRoutes = require('./customers.routes.cjs');
// const adminRoutes = require('./admin.routes.cjs');
// const authRoutes = require('./auth.routes.cjs');

// Registrar rotas
// router.use('/products', productsRoutes);
// router.use('/orders', ordersRoutes);
// router.use('/customers', customersRoutes);
// router.use('/admin', adminRoutes);
// router.use('/auth', authRoutes);

module.exports = router;
EOF

echo "✅ server/routes/index.cjs criado"

# Criar .gitkeep para manter pastas no git
touch server/routes/.gitkeep
touch server/controllers/.gitkeep
touch server/services/.gitkeep

echo "✅ Estrutura base criada com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "1. Copiar templates:"
echo "   cp server/routes/.template.routes.cjs server/routes/products.routes.cjs"
echo "   cp server/controllers/.template.controller.cjs server/controllers/products.controller.cjs"
echo "   cp server/services/.template.service.cjs server/services/products.service.cjs"
echo ""
echo "2. Editar os arquivos copiados substituindo [RESOURCE] pelo nome do recurso"
echo ""
echo "3. Começar a extrair rotas do server.cjs"
echo ""
echo "📖 Ver guia completo: docs/GUIA_INICIO_RAPIDO.md"
