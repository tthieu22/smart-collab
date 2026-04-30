
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../apps/auth/.env') });

const pg = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'smartcollab',
});

async function checkUser(userId) {
  try {
    const res = await pg.query('SELECT id, email, "googleAccessToken", "googleRefreshToken" FROM "UserCache" WHERE id = $1', [userId]);
    console.log('UserCache Result:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error checking UserCache:', err.message);
  } finally {
    await pg.end();
  }
}

const targetUserId = '69097f96d78ee251721041ee';
checkUser(targetUserId);
