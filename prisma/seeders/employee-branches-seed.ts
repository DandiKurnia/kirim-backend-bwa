import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

interface EmployeeBranchSeed {
  name: string;
  email: string;
  password: string;
  roleKey: string;
  branchName: string;
  phoneNumber: string;
  type: string;
}

interface EmployeeBranchesFile {
  data: EmployeeBranchSeed[];
}

export async function employeeBranchesSeed(prisma: PrismaClient) {
  const branchesPath = path.resolve(__dirname, 'data', 'employee-branch.json');
  const branchesRaw = fs.readFileSync(branchesPath, 'utf-8');

  const branchesFile: EmployeeBranchesFile = JSON.parse(
    branchesRaw,
  ) as EmployeeBranchesFile;

  const branches = branchesFile.data;

  for (const item of branches) {
    const role = await prisma.role.findUnique({
      where: { key: item.roleKey },
    });

    if (!role) {
      console.log(`❌ Role ${item.roleKey} not found`);
      continue;
    }

    const branch = await prisma.branch.findFirst({
      where: { name: item.branchName },
    });

    if (!branch) {
      console.log(`❌ Branch ${item.branchName} not found`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(item.password, 10);

    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        password: hashedPassword,
        roleId: role.id,
        branchId: branch.id,
        phoneNumber: item.phoneNumber,
      },
      create: {
        name: item.name,
        email: item.email,
        password: hashedPassword,
        roleId: role.id,
        branchId: branch.id,
        phoneNumber: item.phoneNumber,
      },
    });

    const employeeBranch = await prisma.employeeBranch.findFirst({
      where: { userId: user.id, branchId: branch.id },
    });

    if (!employeeBranch) {
      await prisma.employeeBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          type: item.type,
        },
      });
      console.log(`✅ Employee Branch ${item.name} created`);
    } else {
      await prisma.employeeBranch.update({
        where: { id: employeeBranch.id },
        data: {
          type: item.type,
        },
      });
      console.log(`✅ Employee Branch ${item.name} updated`);
    }
  }
}
