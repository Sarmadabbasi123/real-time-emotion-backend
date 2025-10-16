const express = require("express");
const router = express.Router();
const { registerUser, deleteUser, updateUserPassword, getUser } = require("../controllers/admincontroller.js");
const {protect} = require("../middlewares/authmiddleware.js"); // your JWT middleware
const adminOnly = require("../middlewares/adminmiddleware.js"); // new admin-only middleware
const { isAdmin } = require("../middlewares/authmiddleware.js");

router.post("/create-user", protect, isAdmin, registerUser);
router.delete("/delete-user/:id", protect, isAdmin, deleteUser);
router.put("/update-password", protect, isAdmin, updateUserPassword);
router.get("/staff", protect, adminOnly, getUser);
module.exports = router;
