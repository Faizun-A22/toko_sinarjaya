const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false }
    };

const pgPool = new Pool(poolConfig);

// Helper to translate MySQL queries and parameter placeholders to PostgreSQL format
function translateQueryAndParams(sql, params = []) {
  let paramCount = 0;
  let translatedSql = sql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });

  // Convert INSERT query to append RETURNING * if not already present
  const trimmedSql = translatedSql.trim();
  if (trimmedSql.toUpperCase().startsWith('INSERT') && !trimmedSql.toUpperCase().includes('RETURNING')) {
    translatedSql = translatedSql + ' RETURNING *';
  }

  // Convert MONTH(col) -> EXTRACT(MONTH FROM col) and YEAR(col) -> EXTRACT(YEAR FROM col)
  translatedSql = translatedSql
    .replace(/MONTH\((.*?)\)/gi, 'EXTRACT(MONTH FROM $1)')
    .replace(/YEAR\((.*?)\)/gi, 'EXTRACT(YEAR FROM $1)');

  // Convert MySQL LIKE (default case-insensitive) to PostgreSQL ILIKE
  translatedSql = translatedSql.replace(/\blike\b/gi, 'ILIKE');

  return {
    cleanedSql: translatedSql,
    translatedParams: params
  };
}

// Helper to format rows to mimic mysql2 result structure
function formatResult(result) {
  const rows = result.rows || [];
  
  // Mock affectedRows property
  rows.affectedRows = result.rowCount;
  
  // Mock insertId property for INSERT statements
  if (rows.length > 0) {
    const firstRow = rows[0];
    // Find primary key column (starts with id_ or is id)
    const pkKey = Object.keys(firstRow).find(
      key => key.toLowerCase() === 'id' || key.toLowerCase().startsWith('id_')
    );
    if (pkKey) {
      rows.insertId = firstRow[pkKey];
    }
  }
  
  return [rows, result.fields];
}

// Test database connection
pgPool.query('SELECT NOW()')
  .then(() => {
    console.log('Connected to Supabase PostgreSQL database');
  })
  .catch(err => {
    console.error('Database connection failed (Supabase PostgreSQL):', err);
  });

const pool = {
  query: async (sql, params = []) => {
    const { cleanedSql, translatedParams } = translateQueryAndParams(sql, params);
    try {
      const result = await pgPool.query(cleanedSql, translatedParams);
      return formatResult(result);
    } catch (error) {
      console.error('SQL Execution Error (PostgreSQL translated query):', cleanedSql);
      console.error('Params:', translatedParams);
      throw error;
    }
  },
  getConnection: async () => {
    const client = await pgPool.connect();
    
    const connection = {
      query: async (sql, params = []) => {
        const { cleanedSql, translatedParams } = translateQueryAndParams(sql, params);
        try {
          const result = await client.query(cleanedSql, translatedParams);
          return formatResult(result);
        } catch (error) {
          console.error('SQL Execution Error (Transaction connection):', cleanedSql);
          console.error('Params:', translatedParams);
          throw error;
        }
      },
      beginTransaction: async () => {
        await client.query('BEGIN');
      },
      commit: async () => {
        await client.query('COMMIT');
      },
      rollback: async () => {
        await client.query('ROLLBACK');
      },
      release: () => {
        client.release();
      }
    };
    
    return connection;
  },
  end: () => pgPool.end()
};

module.exports = pool;