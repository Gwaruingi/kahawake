import crypto from 'crypto';
import bcrypt from 'bcrypt';

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function verifyToken(token: string, secret: string): boolean {
  // In a real application, you would verify the token against your database
  // This is just a placeholder function
  return true;
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) reject(err);
      resolve(hash);
    });
  });
}

export function comparePasswords(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}
