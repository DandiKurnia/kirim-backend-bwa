import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../src/generated/prisma/client';

interface BranchSeed {
  name: string;
  address: string;
  phoneNumber: string;
}

interface BranchesFile {
  data: BranchSeed[];
}

export async function branchesSeed(prisma: PrismaClient) {
  const branchesPath = path.resolve(__dirname, 'data', 'branch.json');
  const branchesRaw = fs.readFileSync(branchesPath, 'utf-8');

  const branchesFile: BranchesFile = JSON.parse(branchesRaw) as BranchesFile;

  const branches = branchesFile.data;

  for (const branch of branches) {
    const exitingBranch = await prisma.branch.findFirst({
      where: { name: branch.name },
    });
    if (!exitingBranch) {
      await prisma.branch.create({
        data: {
          name: branch.name,
          address: branch.address,
          phoneNumber: branch.phoneNumber,
        },
      });
    } else {
      console.log(`✅ Branch ${branch.name} already exists`);
    }
  }
}
