import jwt, { JwtPayload } from "jsonwebtoken";
import Admin from "../../models/admin";
import { Request, Response, NextFunction } from "express";


declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}
const adminrequireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // now TS knows it's a string

        if (typeof decoded !== "object" || decoded === null || !('id' in decoded)) {
            throw new Error("Invalid token");
        }

        const userId = (decoded as JwtPayload).id;
        console.log("uid", userId)
        const user = await Admin.findById(userId);
        console.log(user)

        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        req.userId = userId;
        next();



    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
        return;
    }
};

export default adminrequireAuth;
