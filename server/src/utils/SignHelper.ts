import jwt from 'jsonwebtoken';

const JWT_SECRET_TOKEN = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

// Helper function to validate JWT secret
const validateJWTSecret = (): string => {
  if (!JWT_SECRET_TOKEN) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return JWT_SECRET_TOKEN;
};

// Helper function to sign JWT tokens
export const signJWT = (payload: object): string => {
  const secret = validateJWTSecret();
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
};
