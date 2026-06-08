import bcrypt from 'bcrypt';
import { AUTH_BYPASS_PATHS, SALT_ROUNDS } from '../constants.js';

/**
 * This method checks if the URL is in the list of bypass paths.
 * @param url - The URL to check if it is bypassed
 * @returns true if the URL is bypassed, false otherwise
 */
export const isAuthBypassed = (url: string): boolean => {
  const path = url.split('?')[0];

  return AUTH_BYPASS_PATHS.some(
    (bypassPath) => path === bypassPath || path.startsWith(`${bypassPath}/`),
  );
};

/**
 * This method hashes a password using bcrypt.
 * @param password - The password to hash
 * @returns The hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * This method compares a password with a hash using bcrypt.
 * @param password - The password to compare
 * @param hash - The hash to compare
 * @returns true if the password matches the hash, false otherwise
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
