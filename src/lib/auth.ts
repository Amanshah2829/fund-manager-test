
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-secure';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

export async function comparePassword(password: string, hash: string | undefined) {
    if (!password || !hash) {
        return false;
    }
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        // If hash is not a valid bcrypt hash (e.g. plain text password), it will throw.
        // In this case, we know it's not a match.
        console.error("Error comparing password:", error);
        return false;
    }
}


export function generateToken(user: any) {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
  
  return token;
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as any;
  } catch (error) {
    console.log("Token verification failed:", error);
    return null;
  }
}

    