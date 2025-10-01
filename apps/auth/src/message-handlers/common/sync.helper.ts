// src/common/sync.helper.ts
import { Pool } from 'pg';

const pg = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

/** Đảm bảo bảng UserCache tồn tại */
async function initSyncTable() {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS "UserCache" (
      id TEXT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);
}

/** Đồng bộ thêm user */
export async function syncCreateUser(user: { id: string; email: string }) {
  await initSyncTable();
  await pg.query(
    `INSERT INTO "UserCache" (id, email)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE 
       SET email = $2, "updatedAt" = NOW()`,
    [user.id, user.email],
  );
}

/** Đồng bộ sửa user */
export async function syncUpdateUser(user: { id: string; email: string }) {
  await initSyncTable();
  await pg.query(
    `UPDATE "UserCache"
     SET email=$2, "updatedAt"=NOW()
     WHERE id=$1`,
    [user.id, user.email],
  );
}

/** Đồng bộ xóa user */
export async function syncDeleteUser(userId: string) {
  await initSyncTable();
  await pg.query(`DELETE FROM "UserCache" WHERE id = $1`, [userId]);
}
