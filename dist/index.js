"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const userroute_1 = __importDefault(require("./routes/userroute"));
const db_1 = __importDefault(require("./db"));
const adminroute_1 = __importDefault(require("./routes/adminroute"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Routes
app.use('/', userroute_1.default);
app.use('/admin/', adminroute_1.default);
// MongoDB connection
db_1.default.connect();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
