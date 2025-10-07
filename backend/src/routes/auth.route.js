import express from "express";
import { signup, login, logout, me } from "../controllers/auth.controller.js";
import { protectRouteJwt } from "../middleware/authJwt.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRouteJwt, me);

export default router;
