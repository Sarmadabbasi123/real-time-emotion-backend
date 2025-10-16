const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel"); // Adjust path if needed
require("dotenv").config();

const updatePassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@example.com";
    const newPassword = "Admin@123";
    const hashed = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { password: hashed },
      { new: true }
    );

    if (!user) {
      console.log("❌ User not found for email:", email);
    } else {
      console.log("✅ Password updated for", user.email);
      console.log("🔐 New hashed password:", user.password);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};

updatePassword();
