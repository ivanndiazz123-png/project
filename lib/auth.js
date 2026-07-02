import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'java-backup-console-secret-key-2024';
const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hashedPassword) {
  return bcryptjs.compare(password, hashedPassword);
}

export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      nickname: user.nickname 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}
