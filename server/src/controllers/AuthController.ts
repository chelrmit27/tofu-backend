import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import { UserModel, IUser } from '../models/UserModel';
import { UserServices } from '../services/UserServices';
import { signJWT } from '../utils/SignHelper';
import {
  userRegistrationSchema,
  loginSchema,
} from '../middleware/validationHelper';

interface TokenPayload {
  userId: string;
  username: string;
}

export const register = async (req: Request, res: Response) => {
  console.log('Register endpoint hit');
  try {
    // Validate the request body using Zod schema
    const validationResult = userRegistrationSchema.safeParse(req.body);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      console.log('Error validating');

      return res.status(400).json({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    const { username, email, password, name, profilePicture } =
      validationResult.data;

    // Check if username already exists
    const existingUser = await UserServices.usernameExists(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user: IUser = new UserModel({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashedPassword,
      name: name.trim(),
      profilePicture,
      preferences: {
        timezone: 'Asia/Ho_Chi_Minh',
        dailyBudgetMin: 720,
        theme: 'system',
      },
    });

    console.log('user:', user);

    await user.save();

    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      username: user.username,
    };

    const token = signJWT(tokenPayload);

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
      },
      token,
    });
  } catch (error: unknown) {
    console.error('User Registration Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate the request body using Zod schema
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    const { username, password } = validationResult.data;

    const user: IUser | null = await UserServices.findByUserName(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      username: user.username,
    };
    const token = signJWT(tokenPayload);

    const userData: Record<string, unknown> = {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    };

    return res
      .status(200)
      .json({ message: 'Login successful', user: userData, token });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
