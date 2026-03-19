import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../../src/generated/prisma/client';

interface PermissionSeed {
  name: string;
  key: string;
  resource: string;
}

interface PermissionsFile {
  data: PermissionSeed[];
}

interface RolePermissionsFile {
  data: Record<string, string[]>;
}

export async function permissionsSeed(prisma: PrismaClient) {
  // Seed permissions
  const permissionsPath = path.resolve(__dirname, 'data', 'permissions.json');
  const permissionsRaw = fs.readFileSync(permissionsPath, 'utf-8');
  const permissionsFile: PermissionsFile = JSON.parse(
    permissionsRaw,
  ) as PermissionsFile;
  const permissions = permissionsFile.data;

  // Check if permissions already exist
  const existingPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: permissions.map((permission) => permission.key),
      },
    },
  });

  const existingPermissionKeys = existingPermissions.map(
    (permission) => permission.key,
  );
  const newPermissions = permissions.filter(
    (permission) => !existingPermissionKeys.includes(permission.key),
  );

  if (newPermissions.length > 0) {
    await prisma.permission.createMany({
      data: newPermissions,
      skipDuplicates: true,
    });
    console.log(`✅ ${newPermissions.length} new permissions seeded`);
  } else {
    console.log('⚠️  All permissions already exist. Skipping.');
  }

  // Seed role-permission mappings
  const rolePermissionsPath = path.resolve(
    __dirname,
    'data',
    'role-permissions.json',
  );
  const rolePermissionsRaw = fs.readFileSync(rolePermissionsPath, 'utf-8');
  const rolePermissionsFile = JSON.parse(
    rolePermissionsRaw,
  ) as RolePermissionsFile;
  const rolePermissions = rolePermissionsFile.data;

  // Get all roles and permissions
  const roles = await prisma.role.findMany();
  const allPermissions = await prisma.permission.findMany();

  for (const [roleKey, permissionKeys] of Object.entries(rolePermissions)) {
    const role = roles.find((r) => r.key === roleKey);
    if (!role) {
      console.log(`⚠️  Role ${roleKey} not found. Skipping.`);
      continue;
    }

    // Get permissions for this role
    const rolePermissionRecords = allPermissions.filter((p) =>
      permissionKeys.includes(p.key),
    );

    // Check existing role-permission mappings
    const existingMappings = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
    });

    const existingPermissionIds = existingMappings.map((m) => m.permissionId);

    // Create new mappings
    const newMappings = rolePermissionRecords
      .filter((p) => !existingPermissionIds.includes(p.id))
      .map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      }));

    if (newMappings.length > 0) {
      await prisma.rolePermission.createMany({
        data: newMappings,
        skipDuplicates: true,
      });
      console.log(
        `✅ ${newMappings.length} permissions assigned to role ${role.name}`,
      );
    } else {
      console.log(
        `⚠️  All permissions already assigned to role ${role.name}. Skipping.`,
      );
    }
  }

  console.log('✅ Role-permissions seeded');
}
