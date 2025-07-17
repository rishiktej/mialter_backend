import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin';
import adminrequireAuth from './middleware/adminauth';
import User from '../models/user';
import template from '../models/template';


const adminrouter = express.Router();

// POST /signup
adminrouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await Admin.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }


        // Create new user
        const admin = new Admin({ username, email, password });
        await admin.save();

        // Generate JWT
        const admintoken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        res.status(201).json({
            admintoken,
            admin: {
                id: admin._id,
                name: admin.username,
                email: admin.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


adminrouter.post('/signin', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
        // Find user
        const admin = await Admin.findOne({ email });
        console.log("admin:", admin)
        if (!admin) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }


        // Generate JWT
        const admintoken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        res.json({
            admintoken,
            admin: {
                id: admin._id,
                name: admin.username,
                email: admin.email,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

adminrouter.get("/userscount", adminrequireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userscount = await User.countDocuments()
        res.json(userscount)
        return
    } catch {
        res.status(500).json({ message: 'failed to get count' })
    }
})

adminrouter.get("/templatescount", adminrequireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const count = await template.countDocuments()
        res.json(count)
        return
    } catch {
        res.status(500).json({ message: 'failed to get count of templates' })
    }
})

adminrouter.get("/users/list", adminrequireAuth, async (req: Request, res: Response) => {
    try {
        const users = await User.find({}, "_id username email").lean();

        const userIds = users.map((u) => u._id);
        const templates = await template.aggregate([
            { $match: { user: { $in: userIds } } },
            { $group: { _id: "$user", count: { $sum: 1 } } },
        ]);

        const templateMap = new Map(templates.map((t) => [t._id.toString(), t.count]));

        const result = users.map((user) => ({
            ...user,
            templatesCount: templateMap.get(user._id.toString()) || 0,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users", error });
    }
});



export default adminrouter


