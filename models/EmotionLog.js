const mongoose = require("mongoose");

const emotionLogSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
  },
  emotion: {
    type: String,
    enum: ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral" ],
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("EmotionLog", emotionLogSchema);
