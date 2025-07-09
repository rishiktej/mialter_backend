import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import Template from "../models/template";
import requireAuth from './middleware/auth';

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


export default router;
