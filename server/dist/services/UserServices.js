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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServices = void 0;
const UserModel_1 = require("../models/UserModel");
class UserServices {
    static findByUserName(username) {
        return __awaiter(this, void 0, void 0, function* () {
            return UserModel_1.UserModel.findOne({ username }).select('+passwordHash');
        });
    }
    static findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield UserModel_1.UserModel.findOne({ email });
                return user;
            }
            catch (error) {
                console.error('Error finding user by email:', error);
                throw new Error('Failed to find user');
            }
        });
    }
    static findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return UserModel_1.UserModel.findById(userId);
        });
    }
    static findByIdWithPassword(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try to find user in each collection with passwordHash field
                const user = yield UserModel_1.UserModel.findById(userId).select('+passwordHash');
                return user;
            }
            catch (error) {
                console.error('Error finding user by ID with passwordHash:', error);
                throw new Error('Failed to find user');
            }
        });
    }
    static usernameExists(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield UserModel_1.UserModel.findOne({ username });
                return !!user;
            }
            catch (error) {
                console.error('Error checking username existence:', error);
                throw new Error('Failed to check username');
            }
        });
    }
}
exports.UserServices = UserServices;
