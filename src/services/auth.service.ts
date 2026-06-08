import type { FastifyBaseLogger } from 'fastify';
import type { DataSource } from 'typeorm';
import { FORBIDDEN_ROLE } from '../constants.js';
import { UserRole } from '../database/enums/user-role.enum.js';
import { User } from '../database/entities/user.entity.js';
import type { AuthenticatedUser } from './types/index.js';
import { comparePassword, hashPassword } from '../utils/index.js';

export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly log: FastifyBaseLogger,
  ) {}

  /**
   * This method validates the credentials of a user from the database by comparing password hash.
   * @param username - The username of the user
   * @param password - The password of the user
   * @returns The authenticated user if the credentials are valid, null otherwise
   */
  async validateCredentials(username: string, password: string): Promise<AuthenticatedUser | null> {
    
    const user = await this.dataSource.getRepository(User).findOne({
      where: { username },
      select: {
        id: true,
        username: true,
        password_hash: true,
        role: true,
      },
    });

    if (!user) {
      this.log.warn({ username }, 'User not found');
      return null;
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      this.log.warn({ username }, 'Invalid password');
      return null;
    }

    return { id: user.id, username: user.username, role: user.role };
  }

  /**
   * This method creates a new user in the database, checks if username is already taken.
   * Admin users cannot be created through this endpoint.
   * @param username - The username of the user
   * @param password - The password of the user
   * @param role - The role to assign (client or guest only)
   * @returns The authenticated user if the user is created, null if username exists, FORBIDDEN_ROLE if admin
   */
  async createUser(
    username: string,
    password: string,
    role: UserRole = UserRole.CLIENT,
  ): Promise<AuthenticatedUser | null | typeof FORBIDDEN_ROLE> {
    if (role === UserRole.ADMIN) {
      this.log.warn({ username }, 'Attempted to create admin user via public registration');
      return FORBIDDEN_ROLE;
    }

    const existing = await this.dataSource.getRepository(User).findOne({
      where: { username },
      select: { id: true },
    });

    if (existing) {
      this.log.warn({ username }, 'User already exists');
      return null;
    }

    const user = await this.dataSource.getRepository(User).save({
      username,
      password_hash: await hashPassword(password),
      role,
    });

    return { id: user.id, username: user.username, role: user.role };
  }
}
