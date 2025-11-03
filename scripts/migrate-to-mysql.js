#!/usr/bin/env node

/**
 * Migration script from Supabase to MySQL
 * This script helps migrate data and update imports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting migration from Supabase to MySQL...');

// Files to update
const filesToUpdate = [
  'src/services/products.ts',
  'src/services/events.ts',
  'src/integrations/supabase/client.ts',
  'src/integrations/supabase/types.ts'
];

// Update imports in service files
function updateServiceImports() {
  console.log('📝 Updating service imports...');
  
  // Update products service
  const productsServicePath = 'src/services/products.ts';
  if (fs.existsSync(productsServicePath)) {
    let content = fs.readFileSync(productsServicePath, 'utf8');
    
    // Replace Supabase import with MySQL import
    content = content.replace(
      "import { supabase } from '@/integrations/supabase/client';",
      "import { mysqlClient } from '@/integrations/mysql/client';"
    );
    
    // Replace service implementation
    if (content.includes('supabase.from')) {
      console.log('⚠️  products.ts contains Supabase code. Please use products-mysql.ts instead.');
      console.log('   Renaming products.ts to products-supabase.ts and using MySQL version...');
      
      // Backup original
      fs.writeFileSync('src/services/products-supabase.ts', content);
      
      // Use MySQL version
      if (fs.existsSync('src/services/products-mysql.ts')) {
        const mysqlContent = fs.readFileSync('src/services/products-mysql.ts', 'utf8');
        fs.writeFileSync(productsServicePath, mysqlContent);
        console.log('✅ Updated products.ts to use MySQL');
      }
    }
  }

  // Update events service
  const eventsServicePath = 'src/services/events.ts';
  if (fs.existsSync(eventsServicePath)) {
    let content = fs.readFileSync(eventsServicePath, 'utf8');
    
    // Replace Supabase import with MySQL import
    content = content.replace(
      'import { supabase } from "@/integrations/supabase/client";',
      'import { mysqlClient } from "@/integrations/mysql/client";'
    );
    
    // Replace types import
    content = content.replace(
      'import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";',
      'import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/mysql/types";'
    );
    
    // Replace service implementation
    if (content.includes('supabase.from')) {
      console.log('⚠️  events.ts contains Supabase code. Please use events-mysql.ts instead.');
      console.log('   Renaming events.ts to events-supabase.ts and using MySQL version...');
      
      // Backup original
      fs.writeFileSync('src/services/events-supabase.ts', content);
      
      // Use MySQL version
      if (fs.existsSync('src/services/events-mysql.ts')) {
        const mysqlContent = fs.readFileSync('src/services/events-mysql.ts', 'utf8');
        fs.writeFileSync(eventsServicePath, mysqlContent);
        console.log('✅ Updated events.ts to use MySQL');
      }
    }
  }
}

// Create MySQL client wrapper for compatibility
function createCompatibilityWrapper() {
  console.log('🔧 Creating compatibility wrapper...');
  
  const wrapperContent = `// Compatibility wrapper to gradually migrate from Supabase to MySQL
import { mysqlClient } from './mysql/client';

// Export MySQL client as 'supabase' for compatibility
export const supabase = {
  from: (table: string) => ({
    select: (columns = '*', options = {}) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options = {}) => ({
          then: async (callback: (result: any) => void) => {
            try {
              const data = await mysqlClient.select(table, columns, { [column]: value });
              callback({ data, error: null });
            } catch (error) {
              callback({ data: null, error });
            }
          }
        })
      })
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          try {
            const result = await mysqlClient.insert(table, data);
            return { data: result, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            try {
              await mysqlClient.update(table, data, { [column]: value });
              const result = await mysqlClient.single(table, '*', { [column]: value });
              return { data: result, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (callback: (result: any) => void) => {
          try {
            await mysqlClient.delete(table, { [column]: value });
            callback({ error: null });
          } catch (error) {
            callback({ error });
          }
        }
      })
    })
  })
};

export default mysqlClient;
`;

  fs.writeFileSync('src/integrations/supabase/client-compatibility.ts', wrapperContent);
  console.log('✅ Created compatibility wrapper');
}

// Update package.json scripts
function updatePackageScripts() {
  console.log('📦 Updating package.json scripts...');
  
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add MySQL-related scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'docker:up': 'docker-compose up -d',
      'docker:down': 'docker-compose down',
      'docker:logs': 'docker-compose logs -f',
      'db:init': 'docker-compose exec mysql mysql -u rare_toy_user -p rare_toy_companion < database/init.sql',
      'db:backup': 'docker-compose exec mysql mysqldump -u rare_toy_user -p rare_toy_companion > backup.sql',
      'db:restore': 'docker-compose exec -T mysql mysql -u rare_toy_user -p rare_toy_companion < backup.sql',
      'mysql:test': 'node scripts/test-mysql-connection.js'
    };
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with MySQL scripts');
  }
}

// Create test connection script
function createTestScript() {
  console.log('🧪 Creating MySQL test script...');
  
  const testScript = `#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔌 Testing MySQL connection...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'rare_toy_user',
      password: process.env.MYSQL_PASSWORD || 'rare_toy_password123',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion'
    });

    console.log('✅ Connected to MySQL successfully!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query executed:', rows);
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Available tables:', tables.map((t: any) => Object.values(t)[0]));
    
    await connection.end();
    console.log('✅ Connection closed successfully!');
    
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
`;

  fs.writeFileSync('scripts/test-mysql-connection.js', testScript);
  
  // Make it executable
  try {
    fs.chmodSync('scripts/test-mysql-connection.js', '755');
  } catch (e) {
    // Ignore chmod errors on Windows
  }
  
  console.log('✅ Created MySQL test script');
}

// Create migration instructions
function createMigrationInstructions() {
  console.log('📋 Creating migration instructions...');
  
  const instructions = `# Migration Guide: Supabase to MySQL

## ✅ Migration Completed

The following changes have been made to migrate from Supabase to MySQL:

### 🔧 Files Created/Updated:

1. **Docker Configuration**
   - \`docker-compose.yml\` - MySQL and phpMyAdmin containers
   - \`database/init.sql\` - Database schema and sample data

2. **MySQL Client**
   - \`src/integrations/mysql/client.ts\` - MySQL client with Supabase-like API
   - \`src/integrations/mysql/types.ts\` - TypeScript types for MySQL

3. **Updated Services**
   - \`src/services/products-mysql.ts\` - Products service using MySQL
   - \`src/services/events-mysql.ts\` - Events service using MySQL
   - Original files backed up as \`*-supabase.ts\`

4. **Environment Configuration**
   - \`.env\` - Updated with MySQL configuration
   - \`.env.backup\` - Backup of original Supabase config

5. **Scripts**
   - \`scripts/migrate-to-mysql.js\` - This migration script
   - \`scripts/test-mysql-connection.js\` - Test MySQL connection

### 🚀 Next Steps:

1. **Start MySQL Database:**
   \`\`\`bash
   npm run docker:up
   \`\`\`

2. **Test Connection:**
   \`\`\`bash
   npm run mysql:test
   \`\`\`

3. **Initialize Database:**
   \`\`\`bash
   npm run db:init
   \`\`\`

4. **Start Application:**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access phpMyAdmin:**
   - URL: http://localhost:8080
   - User: rare_toy_user
   - Password: rare_toy_password123

### 🔄 Gradual Migration:

To gradually migrate from Supabase to MySQL:

1. **Use Compatibility Wrapper:**
   Update imports to use \`src/integrations/supabase/client-compatibility.ts\`

2. **Update Service Imports:**
   Change from \`@/integrations/supabase/client\` to \`@/integrations/mysql/client\`

3. **Update Type Imports:**
   Change from \`@/integrations/supabase/types\` to \`@/integrations/mysql/types\`

### 📊 Database Schema:

The MySQL schema includes:
- \`products\` - Product catalog
- \`collections\` - Product collections
- \`events\` - Store events
- \`carousel_items\` - Homepage carousel
- \`users\` - User accounts (future)
- \`orders\` - Order management (future)
- \`order_items\` - Order details (future)

### 🛠️ Available Commands:

- \`npm run docker:up\` - Start MySQL containers
- \`npm run docker:down\` - Stop MySQL containers
- \`npm run docker:logs\` - View container logs
- \`npm run db:init\` - Initialize database
- \`npm run db:backup\` - Backup database
- \`npm run db:restore\` - Restore database
- \`npm run mysql:test\` - Test MySQL connection

### ⚠️ Important Notes:

1. **Data Migration:** This script only migrates the code structure. You'll need to manually migrate data from Supabase to MySQL if needed.

2. **Authentication:** The current setup doesn't include authentication. You'll need to implement JWT or session-based auth if required.

3. **Real-time Features:** MySQL doesn't have built-in real-time subscriptions like Supabase. Consider using WebSockets if needed.

4. **File Storage:** MySQL doesn't handle file uploads. You'll need to implement file storage (local, S3, etc.).

### 🆘 Troubleshooting:

1. **Connection Issues:**
   - Check if Docker is running
   - Verify MySQL container is up: \`docker-compose ps\`
   - Check logs: \`npm run docker:logs\`

2. **Permission Issues:**
   - Ensure MySQL user has proper permissions
   - Check database exists: \`SHOW DATABASES;\`

3. **Port Conflicts:**
   - Change ports in \`docker-compose.yml\` if needed
   - Update \`.env\` accordingly

### 🎉 Migration Complete!

Your application is now ready to use MySQL instead of Supabase. The migration maintains the same API structure for easy transition.
`;

  fs.writeFileSync('MIGRATION_GUIDE.md', instructions);
  console.log('✅ Created migration guide');
}

// Main migration function
async function runMigration() {
  try {
    updateServiceImports();
    createCompatibilityWrapper();
    updatePackageScripts();
    createTestScript();
    createMigrationInstructions();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run docker:up');
    console.log('2. Run: npm run mysql:test');
    console.log('3. Run: npm run db:init');
    console.log('4. Run: npm run dev');
    console.log('\n📖 See MIGRATION_GUIDE.md for detailed instructions');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
