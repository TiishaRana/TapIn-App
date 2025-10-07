import express from "express";
import { protectRouteJwt as protectRoute } from "../middleware/authJwt.middleware.js";
import upload from "../middleware/upload.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  searchUsersBySkill,
  rejectFriendRequest,
  completeOnboarding,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.put("/friend-request/:id/reject", rejectFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

// Place search before dynamic :id to avoid shadowing
router.get("/search/skills", searchUsersBySkill);

router.get("/:id", getUserProfile);
router.put("/profile", updateUserProfile);
router.post("/profile/upload-picture", upload.single("profilePicture"), uploadProfilePicture);
router.post("/onboarding", completeOnboarding);

export default router;
