import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Cafe
  const cafe = await prisma.cafe.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Cafe Alpha', address: 'Main Street' },
  });

  // Admin for cafe
  const adminEmail = 'admin@cafe.com';
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { cafeId: cafe.id },
    create: { email: adminEmail, password: 'admin123', cafeId: cafe.id },
  });

  // Tables
  const tables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5'];
  for (const name of tables) {
    await prisma.table.upsert({
      where: { id: tables.indexOf(name) + 1 },
      update: { cafeId: cafe.id },
      create: { name, status: 'free', cafeId: cafe.id },
    });
  }

  // Menu items
  const menu = [
    { name: 'Espresso', category: 'coffee', price: 2.5, description: 'Strong and bold', imageUrl: '' },
    { name: 'Cappuccino', category: 'coffee', price: 3.5, description: 'Foamy classic', imageUrl: '' },
    { name: 'Latte', category: 'coffee', price: 3.8, description: 'Milky smooth', imageUrl: '' },
    { name: 'Green Tea', category: 'tea', price: 2.2, description: 'Refreshing', imageUrl: '' },
    { name: 'Black Tea', category: 'tea', price: 2.0, description: 'Classic', imageUrl: '' },
    { name: 'Orange Juice', category: 'juice', price: 3.0, description: 'Freshly squeezed', imageUrl: '' },
    { name: 'Apple Juice', category: 'juice', price: 3.0, description: 'Crisp and sweet', imageUrl: '' },
    { name: 'Water', category: 'other', price: 1.0, description: 'Still water', imageUrl: '' },
    { name: 'Croissant', category: 'pastry', price: 2.2, description: 'Buttery pastry', imageUrl: '' }
  ];

  for (const item of menu) {
    await prisma.menuItem.upsert({
      where: { id: menu.indexOf(item) + 1 },
      update: { cafeId: cafe.id },
      create: { ...item, available: true, archived: false, cafeId: cafe.id },
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
