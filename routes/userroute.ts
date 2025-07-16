import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Template from "../models/template";
import requireAuth from './middleware/auth';
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"

const router = express.Router();

// POST /signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }


    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// POST /signin
router.post('/signin', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    // Find user
    const user = await User.findOne({ email });
    console.log("user", user)
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }


    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post("/templates", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const template = new Template({ ...req.body, user: req.userId });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: "Failed to save template" });
  }
});

// Get templates for a user
router.get("/templates", requireAuth, async (req, res): Promise<void> => {
  try {
    const templates = await Template.find({ user: req.userId });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

router.delete("/templates/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Template.findOneAndDelete({ _id: id, user: req.userId });

    if (!deleted) {
      res.status(404).json({ message: "Template not found or not authorized to delete" });
      return;
    }

    res.status(200).json({ message: "Template deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete the template" });
  }
});

// PUT /templates/:id - Update existing template
router.put("/templates/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const updated = await Template.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ message: "Template not found or not authorized" });
      return;
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update template" });
  }
});

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  try {
    const user = await User.findOne({ _id: req.userId });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user details" });
  }
}
)

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  try {
    const updated = await User.findOneAndUpdate(
      { _id: req.userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ message: "User not found or not authorized" });
      return;
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user details" });
  }
})

const otpMap = new Map<string, { otp: string; expiresAt: number }>();

// Email setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ 1. Send OTP
router.post("/forgotpassword", async (req, res): Promise<any> => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });
  console.log("user pass", user)

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
    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.log("err:", err)
    res.status(500).json({ message: "Failed to send OTP", error: err });
  }
});

// ✅ 2. Verify OTP
router.post("/verify-otp", (req, res): void => {
  const { email, otp } = req.body;
  const record = otpMap.get(email);

  if (!record) {
    res.status(400).json({ message: "OTP not requested" });
    return
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
router.post("/reset-password", async (req, res): Promise<void> => {
  const { email, otp, newPassword } = req.body;
  const record = otpMap.get(email);

  if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
    res.status(400).json({ message: "Invalid or expired OTP" });
    return
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ email }, { password: hashedPassword });

  otpMap.delete(email);
  res.json({ message: "Password reset successful" });
});


router.get("/proxy-image", async (req, res): Promise<any> => {
  const url = req.query.url as string;
  if (!url || !url.startsWith("http")) {
    return res.status(400).send("Invalid URL");
  }

  try {
    const imageRes = await fetch(url);
    if (!imageRes.ok) throw new Error("Image fetch failed");

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imageRes.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Proxy fetch failed:", error);
    res.status(500).send("Failed to fetch image");
  }
});

export default router;
