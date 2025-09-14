"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Retrieve the MongoDB connection string from environment variables
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            console.error('Error: MONGO_URI is not defined in the .env file');
            process.exit(1); // Exit the process with a failure code
        }
        // Attempt to connect to the database
        const conn = yield mongoose_1.default.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error connecting to MongoDB: ${error.message}`);
        }
        else {
            console.error('An unknown error occurred while connecting to MongoDB');
        }
        process.exit(1); // Exit the process with a failure code
    }
});
exports.default = connectDB;
