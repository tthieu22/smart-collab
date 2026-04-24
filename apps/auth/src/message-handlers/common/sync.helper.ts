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
      "firstName" VARCHAR(255),
      "lastName" VARCHAR(255),
      "avatar" TEXT,
      "coverImage" TEXT,
      "bio" TEXT,
      "location" VARCHAR(255),
      "website" VARCHAR(255),
      "birthday" VARCHAR(50),
      role VARCHAR(50) NOT NULL DEFAULT 'USER',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);
}

/** Đồng bộ thêm user */
export async function syncCreateUser(user: any) {
  await initSyncTable();
  await pg.query(
    `INSERT INTO "UserCache" (id, email, "firstName", "lastName", avatar, "coverImage", bio, location, website, birthday, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE 
       SET email = $2,
           "firstName" = $3,
           "lastName" = $4,
           avatar = $5,
           "coverImage" = $6,
           bio = $7,
           location = $8,
           website = $9,
           birthday = $10,
           role = $11,
           "updatedAt" = NOW()`,
    [
      user.id, 
      user.email, 
      user.firstName || null, 
      user.lastName || null, 
      user.avatar || null,
      user.coverImage || null,
      user.bio || null,
      user.location || null,
      user.website || null,
      user.birthday || null,
      user.role || 'USER'
    ],
  );
}

/** Đồng bộ sửa user */
export async function syncUpdateUser(user: any) {
  await initSyncTable();
  await pg.query(
    `UPDATE "UserCache"
     SET email=$2,
         "firstName"=$3,
         "lastName"=$4,
         avatar=$5,
         "coverImage"=$6,
         bio=$7,
         location=$8,
         website=$9,
         birthday=$10,
         role=$11,
         "updatedAt"=NOW()
     WHERE id=$1`,
    [
      user.id, 
      user.email, 
      user.firstName || null, 
      user.lastName || null, 
      user.avatar || null,
      user.coverImage || null,
      user.bio || null,
      user.location || null,
      user.website || null,
      user.birthday || null,
      user.role || 'USER'
    ],
  );
}

/** Đồng bộ xóa user */
export async function syncDeleteUser(userId: string) {
  await initSyncTable();
  await pg.query(`DELETE FROM "UserCache" WHERE id = $1`, [userId]);
}
