const EmotionLog = require("../models/EmotionLog");

const logEmotion = async (req, res) => {
  try {
    const { customerId, emotion, confidence, timestamp } = req.body;
    const { image } = req.body;

    const log = await EmotionLog.create({
      customerId,
      emotion,
      confidence,
      timestamp,
      image,
    });

    const io = req.app.get("io");
    io.emit("emotionData", log);

    res.status(200).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEmotionLogs = async (req, res) => {
  try {
    const logs = await EmotionLog.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getScannedCustomers = async (req, res) => {
  try {
    // Get unique customerIds from emotion logs
    const customers = await EmotionLog.aggregate([
      { $group: { _id: "$customerId", latest: { $max: "$timestamp" } } },
      { $sort: { latest: -1 } }
    ]);
    res.status(200).json({ success: true, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { logEmotion, getEmotionLogs, getScannedCustomers };
