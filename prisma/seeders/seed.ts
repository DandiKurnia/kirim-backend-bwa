import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';

import { rolesSeed } from './roles-seed';
import { permissionsSeed } from './permissions-seed';
import { usersSeed } from './user-seed';
import { branchesSeed } from './branches-seed';
import { employeeBranchesSeed } from './employee-branches-seed';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Mulai seeding database...\n');

  await rolesSeed(prisma);
  await permissionsSeed(prisma);
  await usersSeed(prisma);
  await branchesSeed(prisma);
  await employeeBranchesSeed(prisma);

  console.log('\n🎉 Seeding selesai!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
