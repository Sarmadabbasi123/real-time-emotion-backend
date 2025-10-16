const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http"); // ⬅️ Required for Socket.IO
const { Server } = require("socket.io");
require("dotenv").config(); // To load .env variables
const PORT = process.env.PORT || 5000;
const sessionRoutes = require("./routes/sessionRoutes");
const emotionRoutes = require("./routes/emotionRoutes");

// Routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminRoutes");



const app = express();
const server = http.createServer(app); // ⬅️ Wrap app in HTTP server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://mern-task-app.onrender.com"], // your React frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Attach Socket.IO to app so it's accessible in controllers
app.set("io", io);

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


// Routes
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/emotion", emotionRoutes);



app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/api/sessions", sessionRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("🔌 New client connected via Socket.IO");

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Connect to MongoDB Atlas and start server
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });
