const User = require("../models/userModel");
const EmotionLog = require("../models/EmotionLog");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// JWT generator
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

//  REGISTER USER (Admin Only)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please provide all fields");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: password,
    role,
  });

  res.status(201).json({
    message: "User created successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});


// LOGIN USER 
const loginUser = asyncHandler(async (req, res) => {
  console.log("📥 Login request received:", req.body);
  const email = req.body.email?.trim().toLowerCase();
  const { password, role } = req.body;

console.log("🟡 Login request body:", req.body);
  if (!email || !password || !role) {
    console.log("❌ Missing fields");
    res.status(400);
    throw new Error("Please provide email, password, and role");
  }

  const user = await User.findOne({ email });
console.log("👤 User found:", user);
console.log("🆚 Role from frontend:", role);
console.log("🧾 Role from DB:", user?.role);

  if (!user || user.role !== role) {
    console.log("❌ Invalid user or role mismatch");
    res.status(401);
    throw new Error("Invalid credentials or role");
    }
    

  const isMatch = await bcrypt.compare(password, user.password);
  console.log("🔁 Password match?", isMatch);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid password");
  }
  
  const token = generateToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.status(200).json({
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
  
});



//  DELETE USER (Admin Only) 
const mongoose = require("mongoose");

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.deleteOne();
  res.status(200).json({ message: `User ${user.email} deleted successfully` });
});



//  LOGOUT 
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  res.status(200).json({ message: "Logged out successfully" });
});

//  GET USER PROFILE 
const getUser = asyncHandler(async (req, res) => {
  // Fetch only users with role "staff"
  const staff = await User.find({ role: "staff" }).select("-password");
  res.status(200).json(staff);
});


//  UPDATE USER EMAIL 
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.email = req.body.email || user.email;
  await user.save();
  res.status(200).json({ message: "User updated" });
});

// CHANGE PASSWORD 
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Provide both old and new password");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Old password incorrect");
  }

  // Hash new password before saving
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  await user.save();
  res.status(200).json({ message: "Password updated" });
});

const updateUserPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    res.status(400);
    throw new Error("Please provide userId and newPassword");
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.password = newPassword; // 👉 no bcrypt.hash here
  await user.save(); // 👈 pre-save hook will hash it

  res.status(200).json({ message: `Password updated for ${user.email}` });
});



module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
  updateUserPassword,
};
