"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./config/database"));
const routes_1 = __importDefault(require("./routes"));
// Connect to Database
(0, database_1.default)();
const app = (0, express_1.default)();
// --- Core Middleware ---
// Enable Cross-Origin Resource Sharing
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true,
}));
// Parse incoming JSON requests
app.use(express_1.default.json());
// Parse URL-encoded data
app.use(express_1.default.urlencoded({ extended: true }));
// This is where we mount our API routes
app.use('/api', routes_1.default);
app.get('/', (_req, res) => {
    res.send('API is running...');
});
exports.default = app;
