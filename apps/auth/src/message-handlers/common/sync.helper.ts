import 'dotenv/config';
import { Pool } from 'pg';

let pgPool: Pool | null = null;

function getPgPool() {
  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });
  }
  return pgPool;
}

/** Đảm bảo bảng UserCache tồn tại */
async function initSyncTable() {
  await getPgPool().query(`
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
      "googleAccessToken" TEXT,
      "googleRefreshToken" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  // Ensure all columns exist (in case the table was created by an older version)
  const columns = [
    { name: 'coverImage', type: 'TEXT' },
    { name: 'bio', type: 'TEXT' },
    { name: 'location', type: 'VARCHAR(255)' },
    { name: 'website', type: 'VARCHAR(255)' },
    { name: 'birthday', type: 'VARCHAR(50)' },
    { name: 'googleAccessToken', type: 'TEXT' },
    { name: 'googleRefreshToken', type: 'TEXT' },
    { name: 'role', type: 'VARCHAR(50) DEFAULT \'USER\'' },
  ];

  for (const col of columns) {
    try {
      await getPgPool().query(`ALTER TABLE "UserCache" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`);
    } catch (e) {
      console.error(`Error adding column ${col.name}:`, (e as any).message);
    }
  }
}

/** Đồng bộ thêm user */
export async function syncCreateUser(user: any) {
  await initSyncTable();
  await getPgPool().query(
    `INSERT INTO "UserCache" (id, email, "firstName", "lastName", avatar, "coverImage", bio, location, website, birthday, role, "googleAccessToken", "googleRefreshToken")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
           "googleAccessToken" = $12,
           "googleRefreshToken" = $13,
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
      user.role || 'USER',
      user.googleAccessToken || null,
      user.googleRefreshToken || null
    ],
  );
}

/** Đồng bộ sửa user */
export async function syncUpdateUser(user: any) {
  await initSyncTable();
  await getPgPool().query(
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
         "googleAccessToken"=$12,
         "googleRefreshToken"=$13,
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
      user.role || 'USER',
      user.googleAccessToken || null,
      user.googleRefreshToken || null
    ],
  );
}

/** Đồng bộ xóa user */
export async function syncDeleteUser(userId: string) {
  await initSyncTable();
  await getPgPool().query(`DELETE FROM "UserCache" WHERE id = $1`, [userId]);
}

/** Force sync all users from MongoDB to PostgreSQL */
export async function syncAllUsers(prisma: any) {
  try {
    const users = await prisma.user.findMany();
    console.log(`🔄 Starting global sync for ${users.length} users...`);
    for (const user of users) {
      await syncUpdateUser(user);
    }
    console.log('✅ Global sync completed!');
  } catch (err: any) {
    console.error('❌ Failed to global sync all users:', err.message);
  }
}
