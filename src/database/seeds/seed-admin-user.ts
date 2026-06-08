import type { DataSource } from 'typeorm';
import { UserRole } from '../enums/user-role.enum.js';
import { User } from '../entities/user.entity.js';
import { hashPassword } from '../../utils/index.js';

export const SEED_ADMIN_USERNAME = 'kashif.ali';
export const SEED_ADMIN_PASSWORD = 'admin';

export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const existing = await dataSource.getRepository(User).findOne({
    where: { username: SEED_ADMIN_USERNAME },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await dataSource.getRepository(User).save({
    username: SEED_ADMIN_USERNAME,
    password_hash: await hashPassword(SEED_ADMIN_PASSWORD),
    role: UserRole.ADMIN,
  });
}
