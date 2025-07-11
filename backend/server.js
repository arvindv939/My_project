const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const os = require("os");

// Load environment variables
dotenv.config();

const app = express();

// Import order automation service
const orderAutomationService = require("./services/orderAutomation");

app.use("/api/auto-reorders", require("./routes/autoReorder"));

// ✅ Dynamic CORS config to support localhost and LAN IPs
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://192.168.")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/greenmart",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // 🚀 Start order automation service after DB connection
    setTimeout(() => {
      orderAutomationService.start();
    }, 2000); // Wait 2 seconds for everything to initialize
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/shops", require("./routes/shops"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/promotions", require("./routes/promotions"));
app.use("/api/branches", require("./routes/branches"));
app.use("/api/bulk-orders", require("./routes/bulkOrders"));
app.use("/api/announcements", require("./routes/announcements"));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "GreenMart API is running",
    timestamp: new Date().toISOString(),
    orderAutomation: orderAutomationService.getStatus(),
  });
});

// Order automation control routes (for testing/debugging)
app.get("/api/automation/status", (req, res) => {
  res.json({
    success: true,
    automation: orderAutomationService.getStatus(),
  });
});

app.post("/api/automation/trigger", async (req, res) => {
  try {
    await orderAutomationService.triggerManually();
    res.json({
      success: true,
      message: "Order automation triggered manually",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to trigger automation",
      error: error.message,
    });
  }
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to GreenMart API",
    version: "1.0.0",
    features: {
      orderAutomation: "✅ Enabled",
      autoStatusProgression: "pending → confirmed → preparing → delivered",
    },
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      orders: "/api/orders",
      shops: "/api/shops",
      admin: "/api/admin",
      promotions: "/api/promotions",
      branches: "/api/branches",
      bulkOrders: "/api/bulk-orders",
      announcements: "/api/announcements",
      automation: "/api/automation",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  if (
    error.message &&
    error.message.includes("Objects are not valid as a React child")
  ) {
    return res.status(400).json({
      message: "Invalid data format for React rendering",
      error: "Data contains objects that cannot be rendered as React children",
      details:
        "Ensure all data being rendered is properly formatted (strings, numbers, or arrays)",
      timestamp: new Date().toISOString(),
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// ✅ Start the server and bind to all interfaces (0.0.0.0)
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  const interfaces = os.networkInterfaces();
  const wifi =
    interfaces.Ethernet || interfaces["Wi-Fi"] || interfaces["WLAN"] || [];
  const localIP =
    wifi.find((i) => i.family === "IPv4")?.address || "192.168.1.12";

  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(` Accessible on your LAN at: http://${localIP}:${PORT}`);
  console.log(` Health check: http://${localIP}:${PORT}/api/health`);
  console.log(` Order Automation: ENABLED`);
});

module.exports = app;
