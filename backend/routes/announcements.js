const express = require("express");
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  markAsRead,
  getAnnouncementStats,
} = require("../controllers/announcementController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public routes (with authentication)
router.get("/", authMiddleware, getAnnouncements);
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["Admin"]),
  getAnnouncementStats
);
router.get("/:id", authMiddleware, getAnnouncementById);
router.put("/:id/read", authMiddleware, markAsRead);

// Admin only routes
router.post("/", authMiddleware, roleMiddleware(["Admin"]), createAnnouncement);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  updateAnnouncement
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["Admin"]),
  deleteAnnouncement
);

module.exports = router;
