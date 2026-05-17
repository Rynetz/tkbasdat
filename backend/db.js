const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

pool.connect()
  .then(client => {
    console.log('Successfully connected to PostgreSQL database');
    client.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};