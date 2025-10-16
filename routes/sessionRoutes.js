// sessionRoutes.js

const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const User = require("../models/userModel"); // Assuming you have a User model
const { protect } = require("../middlewares/authmiddleware");

// Start Session
router.post("/start", protect, async (req, res) => {
  try {
    const session = new Session({
      staff: req.user.id,
      startTime: new Date(),
    });
    await session.save();

    const populatedSession = await session.populate("staff", "name email");

    res.status(201).json({
      session: {
        _id: populatedSession._id,
        staff: populatedSession.staff,
        startTime: populatedSession.startTime,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to start session" });
  }
});

// End Session
router.post("/end", protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      staff: req.user.id,
      endTime: null,
    })
      .sort({ startTime: -1 })
      .populate("staff", "name email");

    if (!session) {
      return res.status(404).json({ error: "No active session found" });
    }

    session.endTime = new Date();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000);
    await session.save();

    res.status(200).json({
      session: {
        _id: session._id,
        staff: session.staff,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to end session" });
  }
});

module.exports = router;
