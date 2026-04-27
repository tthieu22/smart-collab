import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.card.count();
  console.log('Total cards:', count);
  
  const cards = await prisma.card.findMany({ take: 5 });
  console.log('Recent 5 cards:', JSON.stringify(cards, null, 2));

  const columns = await prisma.column.findMany({ select: { id: true, title: true } });
  console.log('Columns:', JSON.stringify(columns, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
