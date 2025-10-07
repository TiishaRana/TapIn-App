import User from "../models/User.js";
import mongoose from "mongoose";

// Development-friendly auth middleware without Firebase
// - If `x-user-id` header is provided, use that user
// - Otherwise use the first user in DB, or create a demo user
export const protectRoute = async (req, res, next) => {
  try {
    const headerUserId = req.headers["x-user-id"]; // Optional header to select user

    let user = null;
    if (headerUserId) {
      // Only attempt lookup if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(headerUserId)) {
        user = await User.findById(headerUserId).select("-password");
      }
      // If invalid header or not found, fall back to default behavior
      if (!user) {
        const firstUser = await User.findOne().select("-password");
        if (firstUser) {
          user = firstUser;
        }
      }
    } else {
      user = await User.findOne().select("-password");
      if (!user) {
        // Create a demo user if DB is empty
        user = await User.create({
          fullName: "Demo User",
          email: "demo@example.com",
          password: "password123",
          isOnboarded: true,
        });
        // Re-fetch without password
        user = await User.findById(user._id).select("-password");
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware (no-firebase):", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
