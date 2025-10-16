const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const EmotionLog = require("../models/EmotionLog");

const router = express.Router();

// Determine Flask API base URL from env with sensible fallbacks
const DEFAULT_EMOTION_API_BASE = process.env.EMOTION_API_BASE || "http://localhost:8000"; // set to ngrok/local via env

// POST /api/emotion/detect
router.post("/detect", async (req, res) => {
  try {
    // Allow per-request override from header and prepare fallbacks
    const headerBase = req.headers["x-emotion-api-base"]; // e.g., https://<ngrok>.ngrok-free.app
    const backendPort = process.env.PORT || "5000";
    const isSelfBase = (base) => {
      try {
        const url = new URL(base);
        const host = `${url.hostname}:${url.port || (url.protocol === "https:" ? "443" : "80")}`;
        return host === `localhost:${backendPort}` || host === `127.0.0.1:${backendPort}`;
      } catch (_) {
        return false;
      }
    };

    const bases = [
      typeof headerBase === "string" ? headerBase : null,
      DEFAULT_EMOTION_API_BASE,
      "http://localhost:5000",
      "http://127.0.0.1:5000",
    ]
      .filter(Boolean)
      .filter((b) => !isSelfBase(b))
      .map((b) => b.replace(/\/$/, ""));
    const { imageData } = req.body; // Expecting data URL base64 from frontend

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: "'imageData' (base64 data URL) is required",
      });
    }

    // Extract base64 string and mime type from data URL
    const matches = imageData.match(/^data:(.*?);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Invalid image data URL",
      });
    }
    const mimeType = matches[1] || "image/jpeg";
    const base64String = matches[2];
    const imageBuffer = Buffer.from(base64String, "base64");

    // Build multipart/form-data as Flask expects: field name 'image'
    const form = new FormData();
    form.append("image", imageBuffer, {
      filename: `frame.${mimeType.includes("png") ? "png" : "jpg"}`,
      contentType: mimeType,
    });

    // Try each base and endpoint variant until one succeeds
    let lastError = null;
    for (const base of bases) {
      for (const path of ["/predict", "/detect"]) {
        const flaskUrl = `${base}${path}`;
        try {
          console.log(`[emotion] Forwarding to: ${flaskUrl}`);
          const response = await axios.post(flaskUrl, form, {
            headers: {
              ...form.getHeaders(),
            },
            timeout: 10000,
          });
          // Attempt to persist log to MongoDB
          try {
            const { customerId, imageData: loggedImage } = req.body;
            const raw = response.data || {};
            let emotionRaw = raw.emotion || "neutral";
            let emotionLower = String(emotionRaw).toLowerCase();
            if (emotionLower === "surprised") emotionLower = "surprise";
            const confidenceVal = typeof raw.confidence === "number" ? raw.confidence : 0;

            await EmotionLog.create({
              customerId: customerId || "anonymous",
              emotion: emotionLower,
              confidence: confidenceVal,
              timestamp: new Date(),
              image: loggedImage || "",
            });
          } catch (logErr) {
            console.warn("[emotion] Failed to save EmotionLog:", logErr.message);
          }

          return res.json({
            success: true,
            message: "Emotion detected successfully",
            data: response.data,
            targetApi: flaskUrl,
          });
        } catch (err) {
          const detail = err.response?.data || err.message;
          console.warn(`[emotion] Failed calling ${flaskUrl}:`, detail);
          lastError = { urlTried: flaskUrl, detail };
          // try next
        }
      }
    }

    // If we reach here, all attempts failed
    return res.status(502).json({
      success: false,
      message: "All emotion detection API targets are unreachable",
      error: lastError?.detail || "No further details",
      lastTried: lastError?.urlTried || null,
      tried: bases.flatMap((b) => ["/predict", "/detect"].map((p) => `${b}${p}`)),
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const details = error.response?.data;
    const message =
      (typeof details === "string" && details) ||
      details?.message ||
      details?.error ||
      (error.code === "ECONNREFUSED"
        ? "Connection refused to target API"
        : error.message);
    console.error(`[emotion] Error calling ${error.config?.url || 'unknown'}:`, message);
    return res.status(status).json({
      success: false,
      message,
      error: details || message,
      targetApi: error.config?.url || null,
    });
  }
});

module.exports = router;
