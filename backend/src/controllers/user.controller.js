import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;
    console.log("Backend - getRecommendedUsers: Current User ID:", currentUserId);
    console.log("Backend - getRecommendedUsers: Current User Friends:", currentUser.friends);

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    });
    console.log("Backend - getRecommendedUsers: Found Recommended Users:", recommendedUsers.map(user => user.fullName));
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const sendFriendRequest = async (req, res) => {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    // Emit real-time notification to the recipient
    // const recipientSocket = activeUsers.get(recipientId);
    // if (recipientSocket) {
    //   io.to(recipientSocket.socketId).emit("friend_request_received", {
    //     senderId: myId,
    //     sender: req.user, // Send sender's full user object for notification display
    //     requestId: friendRequest._id,
    //   });
    // }

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    // Emit real-time notification to the sender that their request was accepted
    // const senderSocket = activeUsers.get(friendRequest.sender.toString());
    // if (senderSocket) {
    //   io.to(senderSocket.socketId).emit("friend_request_accepted", {
    //     accepterId: req.user.id,
    //     accepter: req.user, // Send accepter's full user object
    //     requestId: friendRequest._id,
    //   });
    // }

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getUserProfile(req, res) {
  try {
    const userId = req.params.id;
    console.log("Backend - getUserProfile: Received userId", userId);
    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) {
      console.log("Backend - getUserProfile: User not found for userId", userId);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("Backend - getUserProfile: Found user", user.fullName);
    res.status(200).json(user);
  } catch (error) {
    console.error("Backend - getUserProfile: Error in controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, bio, skillsOffered, skillsWanted, experience, location, profilePic, isOnboarded } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        skillsOffered,
        skillsWanted,
        experience,
        location,
        profilePic,
        ...(typeof isOnboarded === "boolean" ? { isOnboarded } : {}),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateUserProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function uploadProfilePicture(req, res) {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create the profile picture URL
    const profilePicUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user's profile picture in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: profilePicUrl },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePic: profilePicUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error in uploadProfilePicture controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function searchUsersBySkill(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter 'query' is required" });
    }

    const searchRegex = new RegExp(query, "i"); // Case-insensitive search

    const users = await User.find({
      $or: [
        { skillsOffered: { $in: [searchRegex] } },
        { skillsWanted: { $in: [searchRegex] } },
      ],
      isOnboarded: true, // Only search for onboarded users
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsersBySkill controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function completeOnboarding(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, bio, skillsOffered, skillsWanted, experience, location, profilePic } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        skillsOffered,
        skillsWanted,
        experience,
        location,
        profilePic,
        isOnboarded: true,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in completeOnboarding controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const rejectFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Ensure the current user is the recipient of the request
    if (friendRequest.recipient.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to reject this request" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    // Emit real-time notification to the sender that their request was rejected
    // const senderSocket = activeUsers.get(friendRequest.sender.toString());
    // if (senderSocket) {
    //   io.to(senderSocket.socketId).emit("friend_request_rejected", {
    //     rejecterId: req.user.id,
    //     rejecter: req.user, // Send rejecter's full user object
    //     requestId: friendRequest._id,
    //   });
    // }

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
