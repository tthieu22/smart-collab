
const { Pool } = require('pg');

const pg = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'smartcollab',
});

async function listUsers() {
  try {
    const res = await pg.query('SELECT id, email FROM "UserCache" LIMIT 10');
    console.log('UserCache Count:', res.rowCount);
    console.log('Sample Users:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pg.end();
  }
}

listUsers();
