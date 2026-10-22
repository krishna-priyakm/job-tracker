import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ eroor: "Missing token" });
    }

    try {
        const token = header.slice(7);
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as jwt.JwtPayload;
        res.locals.userId = payload.sub;
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}