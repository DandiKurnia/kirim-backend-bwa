import { PrismaClient } from '../../src/generated/prisma/client';
import fs from 'fs';
import path from 'path';

interface RoleSeed {
  name: string;
  key: string;
}

interface RolesFile {
  data: RoleSeed[];
}

export async function rolesSeed(prisma: PrismaClient) {
  const rolesPath = path.resolve(__dirname, 'data', 'roles.json');
  const rolesRaw = fs.readFileSync(rolesPath, 'utf-8');
  const rolesFile: RolesFile = JSON.parse(rolesRaw) as RolesFile;
  const roles = rolesFile.data;

  // check if roles already exist
  const existingRoles = await prisma.role.findMany({
    where: {
      key: {
        in: roles.map((role) => role.key),
      },
    },
  });
  const existingRoleKeys = existingRoles.map((role) => role.key);
  const newRoles = roles.filter((role) => !existingRoleKeys.includes(role.key));
  if (newRoles.length === 0) {
    console.log('⚠️  All roles already exist. Skipping.');
    return;
  }
  // create new roles

  await prisma.role.createMany({
    data: newRoles,
    skipDuplicates: true,
  });

  console.log(`✅ ${newRoles.length} new roles seeded`);
}
