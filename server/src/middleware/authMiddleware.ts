// RMIT University Vietnam
// Course: COSC2769 - Full Stack Development
// Semester: 2025B
// Assessment: Assignment 02
// Author:
// ID:

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

interface TokenPayload {
  userId: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    preferences?: {
      dailyBudgetMin: number;
    };
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided or invalid format.',
      });
    }

    // Extract token safely (supports both slice and split approaches)
    const token = authHeader.split(' ')[1];
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      // console.log('Decoded JWT:', decoded);
    } catch {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
