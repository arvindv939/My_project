const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Get all announcements
router.get("/", authMiddleware, announcementController.getAnnouncements);

// Get unread announcements count
router.get(
  "/unread-count",
  authMiddleware,
  announcementController.getUnreadCount
);

// Create announcement (Admin only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.createAnnouncement
);

// Mark announcement as read
router.post("/:id/read", authMiddleware, announcementController.markAsRead);

// Delete announcement (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  announcementController.deleteAnnouncement
);

module.exports = router;
