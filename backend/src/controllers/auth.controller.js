import User from "../models/User.js";
import jwt from "jsonwebtoken";

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY; // support both names
  if (!secret) throw new Error("JWT secret is not configured");
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
};

const setCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ fullName, email, password, isOnboarded: false });
    // Do NOT auto-login on signup. Require explicit login.
    const clean = await User.findById(user._id).select("-password");
    res.status(201).json(clean);
  } catch (err) {
    console.error("signup error", err);
    // Duplicate key (email)
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // Mongoose validation error
    if (err?.name === "ValidationError") {
      const message = Object.values(err.errors).map(e => e.message).join("; ") || "Validation error";
      return res.status(400).json({ message });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const ok = await user.matchPassword(password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    setCookie(res, token);

    const clean = await User.findById(user._id).select("-password");
    res.status(200).json(clean);
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ message: "Logged out" });
  } catch (err) {
    console.error("logout error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const me = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json(user);
  } catch (err) {
    console.error("me error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
