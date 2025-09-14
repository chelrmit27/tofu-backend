import { UserModel, IUser } from '../models/UserModel';

export class UserServices {
  static async findByUserName(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username }).select('+passwordHash');
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await UserModel.findOne({ email });
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user');
    }
  }

  static async findById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId);
  }

  static async findByIdWithPassword(userId: string): Promise<IUser | null> {
    try {
      // Try to find user in each collection with passwordHash field
      const user: IUser | null =
        await UserModel.findById(userId).select('+passwordHash');
      return user;
    } catch (error) {
      console.error('Error finding user by ID with passwordHash:', error);
      throw new Error('Failed to find user');
    }
  }

  static async usernameExists(username: string): Promise<boolean> {
    try {
      const user = await UserModel.findOne({ username });
      return !!user;
    } catch (error) {
      console.error('Error checking username existence:', error);
      throw new Error('Failed to check username');
    }
  }
}
