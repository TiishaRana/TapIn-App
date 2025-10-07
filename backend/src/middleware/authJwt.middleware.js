import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRouteJwt = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    if (!secret) {
      console.error("protectRouteJwt error: JWT secret not configured");
      return res.status(500).json({ message: "Server auth not configured" });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (err) {
    console.error("protectRouteJwt error", err.message);
    if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
