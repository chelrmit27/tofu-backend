import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const connectDB = async () => {
  try {
    // Retrieve the MongoDB connection string from environment variables
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('Error: MONGO_URI is not defined in the .env file');
      process.exit(1); // Exit the process with a failure code
    }

    // Attempt to connect to the database
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      console.error('An unknown error occurred while connecting to MongoDB');
    }
    process.exit(1); // Exit the process with a failure code
  }
};

export default connectDB;
