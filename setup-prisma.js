#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function setupPrisma() {
  const projectRoot = __dirname;
  const prismaDir = path.join(projectRoot, 'prisma');
  
  // Ensure prisma directory exists
  await fs.ensureDir(prismaDir);
  
  const schemaPath = path.join(prismaDir, 'schema.prisma');
  
  const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_POSTGRE")
}

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
}`;

  // Write the schema file
  await fs.writeFile(schemaPath, schemaContent, 'utf-8');
  
  console.log('✓ Prisma schema created successfully at:', schemaPath);
}

setupPrisma().catch(err => {
  console.error('Error setting up Prisma:', err);
  process.exit(1);
});
