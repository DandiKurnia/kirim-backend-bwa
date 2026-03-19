import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../src/generated/prisma/client';

interface UserSeed {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  avatar?: string;
  roleKey: string;
}

interface UsersFile {
  data: UserSeed[];
}

export async function usersSeed(prisma: PrismaClient) {
  const usersPath = path.resolve(__dirname, 'data', 'users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf-8');

  const usersFile: UsersFile = JSON.parse(usersRaw) as UsersFile;

  const users = usersFile.data;

  for (const user of users) {
    const role = await prisma.role.findFirst({
      where: { key: user.roleKey },
    });

    if (!role) {
      console.warn(`⚠️ Role ${user.roleKey} not found`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        roleId: role.id,
      },
    });

    console.log(`✅ User ${user.email} seeded`);
  }
}
