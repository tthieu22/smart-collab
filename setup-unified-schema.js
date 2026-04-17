#!/usr/bin/env node

/**
 * Setup script to create unified Prisma schema in root prisma directory
 * This script should be run after monorepo-consolidation.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const prismaDir = path.join(rootDir, 'prisma');

// Ensure prisma directory exists
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
  console.log('✓ Created prisma directory');
}

// Unified schema content
const schemaContent = `// Smart Collab - Unified Prisma Schema
// Supports both MongoDB (Auth service) and PostgreSQL (Project service)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// AUTH SERVICE MODELS (MongoDB)
model User {
  id                           String   @id @default(auto()) @map("_id") @db.ObjectId
  email                        String   @unique
  password                     String?
  firstName                    String?
  lastName                     String?
  avatar                       String?
  googleId                     String?
  role                         String   @default("USER")
  isVerified                   Boolean  @default(false)
  emailVerificationCode        String?
  emailVerificationCodeExpires DateTime?
  createdAt                    DateTime @default(now())
  updatedAt                    DateTime @updatedAt

  refreshTokens                RefreshToken[]
  posts                        Post[]
  comments                     Comment[]
  reactions                    Reaction[]
  followers                    Follower[] @relation("Followers")
  following                    Follower[] @relation("Following")
  receivedNotifications        Notification[] @relation("Recipient")
}

model Follower {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  followerId  String   @db.ObjectId
  followingId String   @db.ObjectId
  createdAt   DateTime @default(now())

  follower    User     @relation("Following", fields: [followerId], references: [id])
  following   User     @relation("Followers", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
}

model RefreshToken {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  userId      String   @db.ObjectId
  hashedToken String
  revoked     Boolean  @default(false)
  device      String?
  ip          String?
  userAgent   String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model Post {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  authorId  String   @db.ObjectId
  content   String
  media     Json?    @default("[]")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id])
  comments  Comment[]
  reactions Reaction[]
}

model Comment {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  postId    String   @db.ObjectId
  authorId  String   @db.ObjectId
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post      Post     @relation(fields: [postId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}

model Reaction {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  postId    String   @db.ObjectId
  authorId  String   @db.ObjectId
  type      String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
}

model Notification {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  recipientId String   @db.ObjectId
  senderId    String   @db.ObjectId
  type        String
  postId      String?  @db.ObjectId
  commentId   String?  @db.ObjectId
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  recipient   User     @relation(name: "Recipient", fields: [recipientId], references: [id])
}

// PROJECT SERVICE MODELS (PostgreSQL)
model Project {
  id          String  @id @default(uuid())
  name        String
  description String?
  ownerId     String
  folderPath  String?
  visibility  String  @default("PRIVATE")
  color       String?
  background  String?

  publicId         String?
  fileUrl          String?
  fileType         String?
  fileSize         Int?
  resourceType     String?
  originalFilename String?
  uploadedById     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members ProjectMember[]
  boards  Board[]
  columns Column[]
  cards   Card[]
  views   CardView[]
  events  EventStatistic[]

  @@unique([folderPath], map: "unique_project_folderPath")
  @@index([ownerId])
  @@index([uploadedById])
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  role      String   @default("MEMBER")
  joinedAt  DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@index([userId])
}

model Board {
  id        String   @id @default(uuid())
  projectId String?
  title     String
  type      String
  position  Int       @default(0)
  columnIds String[]  @default([])
  metadata  Json?

  project   Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  columns   Column[]
  ownerId   String?

  @@index([projectId])
  @@index([ownerId])
  @@index([projectId, position])
}

model Column {
  id        String   @id @default(uuid())
  projectId String?
  boardId   String?
  title     String
  position  Int      @default(0)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project Project?    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  board   Board?      @relation(fields: [boardId], references: [id], onDelete: Cascade)
  cards   Card[]
  views   CardView[]

  @@index([projectId, boardId, position])
}

model Card {
  id           String   @id @default(uuid())
  projectId    String?
  columnId     String?
  title        String
  description  String?
  status       String   @default("ACTIVE")
  deadline     DateTime?
  priority     Int?
  position     Int      @default(0)

  createdById     String?
  createdByName   String?
  createdByAvatar String?
  updatedById     String?
  updatedByName   String?
  updatedByAvatar String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  coverPublicId     String?
  coverUrl          String?
  coverFileType     String?
  coverFileSize     Int?
  coverResourceType String?
  coverFilename     String?

  project Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  column  Column?  @relation(fields: [columnId], references: [id], onDelete: SetNull)

  labels      CardLabel[]
  views       CardView[]
  comments    CardComment[]
  checklist   ChecklistItem[]
  attachments Attachment[]

  @@index([projectId, status, updatedAt])
  @@index([columnId, position])
}

model CardComment {
  id        String   @id @default(uuid())
  cardId    String
  userId    String
  userName  String
  avatar    String?
  content   String
  createdAt DateTime @default(now())

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId, createdAt])
}

model ChecklistItem {
  id       String @id @default(uuid())
  cardId   String
  title    String
  done     Boolean @default(false)
  position Int     @default(0)

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId, position])
}

model Attachment {
  id           String   @id @default(uuid())
  cardId       String
  name         String
  url          String
  size         String
  uploadedAt   DateTime @default(now())

  uploadedById     String?
  uploadedByName   String?
  uploadedByAvatar String?

  publicId         String?
  fileType         String?
  fileSize         Int?
  resourceType     String?
  originalFilename String?

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId])
  @@index([uploadedAt])
}

model CardLabel {
  id     String @id @default(uuid())
  cardId String
  label  String

  card Card @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@index([cardId, label])
}

model CardView {
  id            String   @id @default(uuid())
  cardId        String
  projectId     String
  componentType String
  columnId      String?
  position      Int      @default(0)
  version       Int      @default(1)
  isPinned      Boolean?
  customTitle   String?
  metadata      Json?
  updatedAt     DateTime @default(now()) @updatedAt

  card    Card    @relation(fields: [cardId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  column  Column? @relation(fields: [columnId], references: [id], onDelete: Cascade)

  @@unique([cardId, projectId, componentType, version], map: "unique_card_view_version")
  @@index([projectId, componentType, position])
  @@index([projectId, columnId, position])
  @@index([cardId])
}

model EventStatistic {
  id        String   @id @default(uuid())
  projectId String
  eventType String
  count     Int      @default(0)
  date      DateTime

  project Project @relation(fields: [projectId], references: [id])

  @@unique([projectId, eventType, date])
}
`;

// Write schema file
fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), schemaContent);
console.log('✓ Created unified schema.prisma');

console.log('\n✅ Prisma schema setup complete!');
console.log('\nNext steps:');
console.log('1. Run: pnpm install');
console.log('2. Run: pnpm prisma:generate to generate Prisma clients');
