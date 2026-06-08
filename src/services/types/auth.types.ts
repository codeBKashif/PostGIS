import type { UserRole } from '../../database/enums/user-role.enum.js';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}
