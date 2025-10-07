import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Full name must be at least 3 characters long"],
      maxlength: [50, "Full name cannot exceed 50 characters"],
      match: [/^[a-zA-Z\s.'-]+$/, "Full name can only contain letters, spaces, hyphens, apostrophes, and periods"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    skillsOffered: [{
      type: String,
      trim: true
    }],
    skillsWanted: [{
      type: String,
      trim: true
    }],
    experience: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner"
    },
    location: {
      type: String,
      trim: true,
      // Optional at signup/onboarding; validate only if provided
      minlength: [3, "Location must be at least 3 characters long"],
      maxlength: [100, "Location cannot exceed 100 characters"],
      match: [/^[a-zA-Z0-9\s.,#'"-]+$/, "Location can only contain letters, numbers, spaces, and .,#'-"],
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
  return isPasswordCorrect;
};

const User = mongoose.model("User", userSchema);

export default User;
