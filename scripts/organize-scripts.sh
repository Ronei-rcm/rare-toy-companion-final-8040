#!/bin/bash

# Script para organizar scripts em subpastas
# Uso: bash scripts/organize-scripts.sh

set -e

cd "$(dirname "$0")"

echo "📁 Organizando scripts em subpastas..."

# Database scripts
echo "📊 Movendo scripts de banco de dados..."
git mv migrate-database.cjs database/ 2>/dev/null || mv migrate-database.cjs database/
git mv migrate-orders-sync.js database/ 2>/dev/null || mv migrate-orders-sync.js database/
git mv migrate-passwords-to-bcrypt.cjs database/ 2>/dev/null || mv migrate-passwords-to-bcrypt.cjs database/
git mv migrate-to-mysql.js database/ 2>/dev/null || mv migrate-to-mysql.js database/
git mv backup.sh database/ 2>/dev/null || mv backup.sh database/
git mv backup-project.sh database/ 2>/dev/null || mv backup-project.sh database/
git mv setup-backup-cron.sh database/ 2>/dev/null || mv setup-backup-cron.sh database/
git mv optimize-database.cjs database/ 2>/dev/null || mv optimize-database.cjs database/
git mv analyze-slow-queries.cjs database/ 2>/dev/null || mv analyze-slow-queries.cjs database/
git mv fix-database-config.cjs database/ 2>/dev/null || mv fix-database-config.cjs database/
git mv check-hora-column.cjs database/ 2>/dev/null || mv check-hora-column.cjs database/
git mv add-hora-to-financial-transactions.cjs database/ 2>/dev/null || mv add-hora-to-financial-transactions.cjs database/
git mv create-budgets-table.cjs database/ 2>/dev/null || mv create-budgets-table.cjs database/
git mv create-recurring-transactions-table.cjs database/ 2>/dev/null || mv create-recurring-transactions-table.cjs database/
git mv test-mysql-connection.js database/ 2>/dev/null || mv test-mysql-connection.js database/

# Deploy scripts
echo "🚀 Movendo scripts de deploy..."
git mv deploy-alternativo.sh deploy/ 2>/dev/null || mv deploy-alternativo.sh deploy/
git mv deploy-completo.sh deploy/ 2>/dev/null || mv deploy-completo.sh deploy/
git mv deploy-corrigido.sh deploy/ 2>/dev/null || mv deploy-corrigido.sh deploy/
git mv deploy-docker.sh deploy/ 2>/dev/null || mv deploy-docker.sh deploy/
git mv deploy-docker-fixed.sh deploy/ 2>/dev/null || mv deploy-docker-fixed.sh deploy/
git mv deploy-to-server.sh deploy/ 2>/dev/null || mv deploy-to-server.sh deploy/
git mv sync-to-server.sh deploy/ 2>/dev/null || mv sync-to-server.sh deploy/
git mv push-bundle-automatico.sh deploy/ 2>/dev/null || mv push-bundle-automatico.sh deploy/
git mv create-production-package.sh deploy/ 2>/dev/null || mv create-production-package.sh deploy/

# Admin scripts
echo "👤 Movendo scripts administrativos..."
git mv add-admin.cjs admin/ 2>/dev/null || mv add-admin.cjs admin/
git mv check-admin.cjs admin/ 2>/dev/null || mv check-admin.cjs admin/
git mv list-admins.cjs admin/ 2>/dev/null || mv list-admins.cjs admin/
git mv update-admin-one.cjs admin/ 2>/dev/null || mv update-admin-one.cjs admin/
git mv update-admin-password.cjs admin/ 2>/dev/null || mv update-admin-password.cjs admin/
git mv force-admin-change.cjs admin/ 2>/dev/null || mv force-admin-change.cjs admin/
git mv create-user.cjs admin/ 2>/dev/null || mv create-user.cjs admin/
git mv add-password-to-user.cjs admin/ 2>/dev/null || mv add-password-to-user.cjs admin/
git mv create-customer.cjs admin/ 2>/dev/null || mv create-customer.cjs admin/
git mv rotate-passwords.sh admin/ 2>/dev/null || mv rotate-passwords.sh admin/

# Test scripts
echo "🧪 Movendo scripts de teste..."
git mv test-address-system.cjs test/ 2>/dev/null || mv test-address-system.cjs test/
git mv test-addresses-endpoint.cjs test/ 2>/dev/null || mv test-addresses-endpoint.cjs test/
git mv test-complete-flow.cjs test/ 2>/dev/null || mv test-complete-flow.cjs test/
git mv test-create-user-order.cjs test/ 2>/dev/null || mv test-create-user-order.cjs test/
git mv test-endpoint.cjs test/ 2>/dev/null || mv test-endpoint.cjs test/
git mv test-minha-conta-complete.cjs test/ 2>/dev/null || mv test-minha-conta-complete.cjs test/
git mv test-new-user-orders.cjs test/ 2>/dev/null || mv test-new-user-orders.cjs test/
git mv test-order-creation.cjs test/ 2>/dev/null || mv test-order-creation.cjs test/
git mv test-orders-sync.js test/ 2>/dev/null || mv test-orders-sync.js test/
git mv test-real-user-flow.cjs test/ 2>/dev/null || mv test-real-user-flow.cjs test/
git mv test-recurring-insert.cjs test/ 2>/dev/null || mv test-recurring-insert.cjs test/
git mv test-server-connection.sh test/ 2>/dev/null || mv test-server-connection.sh test/
git mv test-user-account.cjs test/ 2>/dev/null || mv test-user-account.cjs test/
git mv create-test-orders.js test/ 2>/dev/null || mv create-test-orders.js test/

# Maintenance scripts
echo "🔧 Movendo scripts de manutenção..."
git mv cleanup.sh maintenance/ 2>/dev/null || mv cleanup.sh maintenance/
git mv optimize-build.js maintenance/ 2>/dev/null || mv optimize-build.js maintenance/
git mv optimize-images.js maintenance/ 2>/dev/null || mv optimize-images.js maintenance/
git mv performance-optimizer.cjs maintenance/ 2>/dev/null || mv performance-optimizer.cjs maintenance/
git mv check-security.sh maintenance/ 2>/dev/null || mv check-security.sh maintenance/
git mv clear-rate-limit.cjs maintenance/ 2>/dev/null || mv clear-rate-limit.cjs maintenance/
git mv apply-audit-migration.cjs maintenance/ 2>/dev/null || mv apply-audit-migration.cjs maintenance/
git mv debug-auth.cjs maintenance/ 2>/dev/null || mv debug-auth.cjs maintenance/
git mv fix-address-endpoints.cjs maintenance/ 2>/dev/null || mv fix-address-endpoints.cjs maintenance/
git mv fix-addresses-sync.cjs maintenance/ 2>/dev/null || mv fix-addresses-sync.cjs maintenance/
git mv fix-orders-complete.cjs maintenance/ 2>/dev/null || mv fix-orders-complete.cjs maintenance/
git mv fix-orphan-orders.cjs maintenance/ 2>/dev/null || mv fix-orphan-orders.cjs maintenance/
git mv refactor-server.cjs maintenance/ 2>/dev/null || mv refactor-server.cjs maintenance/
git mv simple-migrate.cjs maintenance/ 2>/dev/null || mv simple-migrate.cjs maintenance/
git mv sync-categorias.cjs maintenance/ 2>/dev/null || mv sync-categorias.cjs maintenance/
git mv sync-categorias-final.cjs maintenance/ 2>/dev/null || mv sync-categorias-final.cjs maintenance/
git mv sync-orders-fix.cjs maintenance/ 2>/dev/null || mv sync-orders-fix.cjs maintenance/
git mv notify-recurring-transactions.cjs maintenance/ 2>/dev/null || mv notify-recurring-transactions.cjs maintenance/
git mv process-recurring-transactions.cjs maintenance/ 2>/dev/null || mv process-recurring-transactions.cjs maintenance/
git mv server-setup-manual.sh maintenance/ 2>/dev/null || mv server-setup-manual.sh maintenance/

# Utils
echo "🛠️ Movendo scripts utilitários..."
git mv COMANDOS_UTEIS.sh utils/ 2>/dev/null || mv COMANDOS_UTEIS.sh utils/

echo "✅ Organização concluída!"
echo ""
echo "📁 Estrutura criada:"
echo "  - scripts/database/    (scripts de banco de dados)"
echo "  - scripts/deploy/     (scripts de deploy)"
echo "  - scripts/admin/      (scripts administrativos)"
echo "  - scripts/test/       (scripts de teste)"
echo "  - scripts/maintenance/(scripts de manutenção)"
echo "  - scripts/utils/      (scripts utilitários)"
