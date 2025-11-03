import mysql from 'mysql2/promise';

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'rare_toy_user',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database client class to replace Supabase functionality
export class MySQLClient {
  private pool: mysql.Pool;

  constructor() {
    this.pool = pool;
  }

  // Generic select method
  async select<T = any>(
    table: string,
    columns: string = '*',
    where?: Record<string, any>,
    orderBy?: string,
    limit?: number
  ): Promise<T[]> {
    try {
      let query = `SELECT ${columns} FROM ${table}`;
      const params: any[] = [];

      if (where) {
        const conditions = Object.keys(where).map(key => {
          params.push(where[key]);
          return `${key} = ?`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }

      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const [rows] = await this.pool.execute(query, params);
      return rows as T[];
    } catch (error) {
      console.error('Select error:', error);
      throw error;
    }
  }

  // Generic insert method
  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = columns.map(() => '?').join(', ');

      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const [result] = await this.pool.execute(query, values);

      // For MySQL, get the inserted ID
      const insertId = (result as any).insertId;
      if (insertId) {
        const [rows] = await this.pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [insertId]);
        return (rows as any)[0];
      }

      return result as T;
    } catch (error) {
      console.error('Insert error:', error);
      throw error;
    }
  }

  // Generic update method
  async update<T = any>(
    table: string,
    data: Record<string, any>,
    where: Record<string, any>
  ): Promise<T> {
    try {
      const updateColumns = Object.keys(data);
      const updateValues = Object.values(data);
      const whereColumns = Object.keys(where);
      const whereValues = Object.values(where);

      const setClause = updateColumns.map(col => `${col} = ?`).join(', ');
      const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');

      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const params = [...updateValues, ...whereValues];

      const [result] = await this.pool.execute(query, params);
      return result as T;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  // Generic delete method
  async delete(table: string, where: Record<string, any>): Promise<void> {
    try {
      const whereColumns = Object.keys(where);
      const whereValues = Object.values(where);

      const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
      const query = `DELETE FROM ${table} WHERE ${whereClause}`;

      await this.pool.execute(query, whereValues);
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Get single record
  async single<T = any>(
    table: string,
    columns: string = '*',
    where?: Record<string, any>
  ): Promise<T | null> {
    const results = await this.select<T>(table, columns, where, undefined, 1);
    return results.length > 0 ? results[0] : null;
  }

  // Execute raw SQL
  async execute<T = any>(query: string, params: any[] = []): Promise<T> {
    try {
      const [result] = await this.pool.execute(query, params);
      return result as T;
    } catch (error) {
      console.error('Execute error:', error);
      throw error;
    }
  }

  // Join query helper
  async join<T = any>(
    fromTable: string,
    joinTable: string,
    onCondition: string,
    columns: string = '*',
    where?: Record<string, any>,
    orderBy?: string,
    limit?: number
  ): Promise<T[]> {
    try {
      let query = `SELECT ${columns} FROM ${fromTable} JOIN ${joinTable} ON ${onCondition}`;
      const params: any[] = [];

      if (where) {
        const conditions = Object.keys(where).map(key => {
          params.push(where[key]);
          return `${key} = ?`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }

      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const [rows] = await this.pool.execute(query, params);
      return rows as T[];
    } catch (error) {
      console.error('Join error:', error);
      throw error;
    }
  }

  // Search with LIKE
  async search<T = any>(
    table: string,
    searchColumns: string[],
    searchTerm: string,
    additionalWhere?: Record<string, any>,
    orderBy?: string,
    limit?: number
  ): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${table}`;
      const params: any[] = [];
      const conditions: string[] = [];

      // Add search conditions
      const searchConditions = searchColumns.map(col => {
        params.push(`%${searchTerm}%`);
        return `${col} LIKE ?`;
      });
      conditions.push(`(${searchConditions.join(' OR ')})`);

      // Add additional where conditions
      if (additionalWhere) {
        Object.keys(additionalWhere).forEach(key => {
          params.push(additionalWhere[key]);
          conditions.push(`${key} = ?`);
        });
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }

      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const [rows] = await this.pool.execute(query, params);
      return rows as T[];
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  // Close connection pool
  async close(): Promise<void> {
    await this.pool.end();
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.pool.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const mysqlClient = new MySQLClient();

// Export types for compatibility with Supabase types
export type Database = {
  public: {
    Tables: {
      products: any;
      collections: any;
      events: any;
      carousel_items: any;
      product_collections: any;
      users: any;
      orders: any;
      order_items: any;
    };
    Views: any;
    Functions: any;
    Enums: any;
    CompositeTypes: any;
  };
};

// Export for compatibility
export default mysqlClient;
