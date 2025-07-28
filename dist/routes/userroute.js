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
const user_1 = __importDefault(require("../models/user"));
const template_1 = __importDefault(require("../models/template"));
const auth_1 = __importDefault(require("./middleware/auth"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mailer_1 = require("../utils/mailer");
const router = express_1.default.Router();
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ message: 'This is home page!!' });
}));
// POST /signup
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, subscription } = req.body;
    try {
        // Check if user already exists
        const existingUser = yield user_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Create new user
        const user = new user_1.default({ username, email, password, subscription });
        yield user.save();
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.username,
                email: user.email,
                subscription: user.subscription
            },
        });
        yield (0, mailer_1.sendWelcomeEMail)(user.email, "Welcome to mialter", `Hello ${user.username}, Enjoy our services!`);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}));
// POST /signin
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Find user
        const user = yield user_1.default.findOne({ email });
        console.log("user", user);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = yield user.matchPassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}));
router.post("/templates", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const template = new template_1.default(Object.assign(Object.assign({}, req.body), { user: req.userId }));
        yield template.save();
        res.status(201).json(template);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to save template" });
    }
}));
// Get templates for a user
router.get("/templates", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const templates = yield template_1.default.find({ user: req.userId });
        res.json(templates);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch templates" });
    }
}));
router.delete("/templates/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield template_1.default.findOneAndDelete({ _id: id, user: req.userId });
        if (!deleted) {
            res.status(404).json({ message: "Template not found or not authorized to delete" });
            return;
        }
        res.status(200).json({ message: "Template deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to delete the template" });
    }
}));
// PUT /templates/:id - Update existing template
router.put("/templates/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield template_1.default.findOneAndUpdate({ _id: req.params.id, user: req.userId }, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ message: "Template not found or not authorized" });
            return;
        }
        res.status(200).json(updated);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update template" });
    }
}));
router.get("/user/profile", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findOne({ _id: req.userId });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch user details" });
    }
}));
router.put("/user/profile", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updated = yield user_1.default.findOneAndUpdate({ _id: req.userId }, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ message: "User not found or not authorized" });
            return;
        }
        res.status(200).json(updated);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch user details" });
    }
}));
const otpMap = new Map();
// ✅ 1. Send OTP
router.post("/user/forgotpassword", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const user = yield user_1.default.findOne({ email });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    console.log("user pass", user);
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpMap.set(email, { otp, expiresAt });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP",
        text: `Your OTP to reset password is: ${otp}`,
    };
    try {
        yield mailer_1.transporter.sendMail(mailOptions);
        res.json({ message: "OTP sent to your email" });
    }
    catch (err) {
        console.log("err:", err);
        res.status(500).json({ message: "Failed to send OTP", error: err });
    }
}));
// ✅ 2. Verify OTP
router.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    const record = otpMap.get(email);
    if (!record) {
        res.status(400).json({ message: "OTP not requested" });
        return;
    }
    if (record.expiresAt < Date.now()) {
        res.status(400).json({ message: "OTP expired" });
    }
    if (record.otp !== otp) {
        res.status(400).json({ message: "Invalid OTP" });
    }
    res.json({ message: "OTP verified successfully" });
});
// ✅ 3. Reset Password
router.post("/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp, newPassword } = req.body;
    const record = otpMap.get(email);
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
        res.status(400).json({ message: "Invalid or expired OTP" });
        return;
    }
    const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
    yield user_1.default.updateOne({ email }, { password: hashedPassword });
    otpMap.delete(email);
    res.json({ message: "Password reset successful" });
}));
router.put("/subscribe", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subscription } = req.body;
    try {
        const updated = yield user_1.default.findOneAndUpdate({ _id: req.userId }, { $set: { subscription } });
        if (!updated) {
            res.status(404).json("User not found or unauthorised");
            return;
        }
        res.status(200).json("subscription status updated successfully");
    }
    catch (_a) {
        res.status(500).json("Error occured on server side");
    }
}));
router.get("/subscribe", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_1.default.findOne({ _id: req.userId });
        if (!user) {
            res.status(404).json("User not found or unauthorised");
            return;
        }
        res.json(user.subscription);
        res.status(200).json("subscription status updated successfully");
    }
    catch (_a) {
        res.status(500).json("Error occured on server side");
    }
}));
router.get("/proxy-image", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = req.query.url;
    if (!url || !url.startsWith("http")) {
        return res.status(400).send("Invalid URL");
    }
    try {
        const imageRes = yield fetch(url);
        if (!imageRes.ok)
            throw new Error("Image fetch failed");
        const contentType = imageRes.headers.get("content-type") || "image/jpeg";
        const buffer = yield imageRes.arrayBuffer();
        res.setHeader("Content-Type", contentType);
        res.send(Buffer.from(buffer));
    }
    catch (error) {
        console.error("Proxy fetch failed:", error);
        res.status(500).send("Failed to fetch image");
    }
}));
exports.default = router;
