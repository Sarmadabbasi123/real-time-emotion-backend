const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // seconds
  },
});

module.exports = mongoose.model("Session", sessionSchema);
