const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middlewares/authmiddleware.js");
const { logEmotion, getEmotionLogs, getScannedCustomers } = require("../controllers/emotionscontroller.js");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  changePassword,
  deleteUser,
} = require("../controllers/admincontroller.js"); // using admincontroller here

const upload = require("../middlewares/uploadmiddleware.js");

router.post("/log", upload.single("image"), logEmotion);

router.post("/login", loginUser);
router.post("/log-emotion", logEmotion);
router.get("/auth/me", protect, (req, res) => {
  res.status(200).json({ user: req.user });
});
router.get("/emotions", getEmotionLogs);
router.get("/scanned-customers", getScannedCustomers);

module.exports = router;
