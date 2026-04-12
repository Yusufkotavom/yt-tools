import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('--- Users ---');
  console.log(JSON.stringify(users, null, 2));

  const channels = await prisma.channel.findMany({ take: 5 });
  console.log('\n--- Channels ---');
  console.log(JSON.stringify(channels, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
