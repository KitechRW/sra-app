const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host:             process.env.DB_HOST     || 'localhost',
  port:             Number(process.env.DB_PORT || 3306),
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'sradb',
  waitForConnections: true,
  connectionLimit:  10,
  timezone:         '+00:00',
};

const pool = mysql.createPool(dbConfig);

pool.verifyConnection = async () => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log(`✅ MySQL connected successfully (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
  } catch (err) {
    console.error(`❌ MySQL connection failed (${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`);
    console.error(`   ${err.code || 'ERROR'}: ${err.message}`);

    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Check DB_USER and DB_PASSWORD in .env, then run: mysql -u <user> -p < server/database.sql');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   Database does not exist. Create it with: mysql -u <user> -p < server/database.sql');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   MySQL is not accepting TCP connections on this host/port.');
    }

    throw err;
  }
};

module.exports = pool;
