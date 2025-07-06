const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Get all announcements
router.get("/", authMiddleware, announcementController.getAnnouncements);

// Get single announcement
router.get("/:id", authMiddleware, announcementController.getAnnouncement);

// Create announcement (Admin only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.createAnnouncement
);

// Update announcement
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.updateAnnouncement
);

// Delete announcement
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.deleteAnnouncement
);

// Mark announcement as read
router.post("/:id/read", authMiddleware, announcementController.markAsRead);

// Get announcement statistics
router.get(
  "/stats/summary",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.getAnnouncementStats
);

// Get active discounts
router.get("/discounts/active", announcementController.getActiveDiscounts);

module.exports = router;
