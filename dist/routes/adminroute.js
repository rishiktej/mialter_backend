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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const admin_1 = __importDefault(require("../models/admin"));
const adminauth_1 = __importDefault(require("./middleware/adminauth"));
const user_1 = __importDefault(require("../models/user"));
const template_1 = __importDefault(require("../models/template"));
const mailer_1 = require("../utils/mailer");
const adminrouter = express_1.default.Router();
// POST /signup
adminrouter.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    try {
        // Check if user already exists
        const existingUser = yield admin_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Create new user
        const admin = new admin_1.default({ username, email, password });
        yield admin.save();
        // Generate JWT
        const admintoken = jsonwebtoken_1.default.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            admintoken,
            admin: {
                id: admin._id,
                name: admin.username,
                email: admin.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}));
adminrouter.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Find user
        const admin = yield admin_1.default.findOne({ email });
        console.log("admin:", admin);
        if (!admin) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = yield admin.matchPassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate JWT
        const admintoken = jsonwebtoken_1.default.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            admintoken,
            admin: {
                id: admin._id,
                name: admin.username,
                email: admin.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}));
adminrouter.get("/userscount", adminauth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userscount = yield user_1.default.countDocuments();
        res.json(userscount);
        return;
    }
    catch (_a) {
        res.status(500).json({ message: 'failed to get count' });
    }
}));
adminrouter.get("/templatescount", adminauth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield template_1.default.countDocuments();
        res.json(count);
        return;
    }
    catch (_a) {
        res.status(500).json({ message: 'failed to get count of templates' });
    }
}));
adminrouter.get("/users/list", adminauth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find({}, "_id username email").lean();
        const userIds = users.map((u) => u._id);
        const templates = yield template_1.default.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]);
        const templateMap = new Map(templates.map((t) => [t._id.toString(), t.count]));
        const result = users.map((user) => (Object.assign(Object.assign({}, user), { templatesCount: templateMap.get(user._id.toString()) || 0 })));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error });
    }
}));
adminrouter.post("/send-newsletter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subject, content } = req.body;
    try {
        const users = yield user_1.default.find({}, "email");
        const emails = users.map((user) => user.email);
        // Send email to all
        yield (0, mailer_1.sendNewsletterEmail)(emails, subject, content);
        res.status(200).json({ message: "Newsletter sent successfully!" });
    }
    catch (error) {
        console.error("Newsletter error:", error);
        res.status(500).json({ error: "Failed to send newsletter" });
    }
}));
exports.default = adminrouter;
