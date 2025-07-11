const express = require("express");
const router = express.Router();
const AutoReorder = require("../models/AutoReorder");
const auth = require("../middlewares/authMiddleware");

// Get all auto reorders for user
router.get("/", auth, async (req, res) => {
  const autoReorders = await AutoReorder.find({ userId: req.user._id });
  res.json({ autoReorders });
});

// Create new auto reorder
router.post("/", auth, async (req, res) => {
  const { orderTemplate, frequency, customInterval, time } = req.body;
  // Calculate nextRun based on current date and time
  let nextRun = new Date();
  const [hour, minute] = time.split(":");
  nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
  if (nextRun < new Date()) {
    // If time today already passed, set to tomorrow
    nextRun.setDate(nextRun.getDate() + 1);
  }
  const autoReorder = new AutoReorder({
    userId: req.user._id,
    orderTemplate,
    frequency,
    customInterval,
    time,
    nextRun,
  });
  await autoReorder.save();
  res.json({ success: true, autoReorder });
});

module.exports = router;
