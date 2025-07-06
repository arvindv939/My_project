const Announcement = require("../models/Announcement");

// Get all announcements
const getAnnouncements = async (req, res) => {
  try {
    const { targetAudience, type, priority, active } = req.query;

    const filter = {};

    // Filter by target audience
    if (targetAudience && targetAudience !== "all") {
      filter.targetAudience = { $in: [targetAudience, "all"] };
    }

    // Filter by type
    if (type) {
      filter.type = type;
    }

    // Filter by priority
    if (priority) {
      filter.priority = priority;
    }

    // Filter by active status (not expired)
    if (active === "true") {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ];
    }

    const announcements = await Announcement.find(filter)
      .populate("createdBy", "name email")
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
};

// Get single announcement
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      announcement,
    });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
      error: error.message,
    });
  }
};

// Create announcement
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      type = "info",
      targetAudience = "all",
      priority = "medium",
      expiresAt,
    } = req.body;

    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const announcement = new Announcement({
      title,
      message,
      type,
      targetAudience,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id,
    });

    await announcement.save();

    // Populate the created announcement
    await announcement.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message,
    });
  }
};

// Update announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, targetAudience, priority, expiresAt } =
      req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Update fields
    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (type) announcement.type = type;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (priority) announcement.priority = priority;
    if (expiresAt !== undefined) {
      announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    announcement.updatedAt = new Date();

    await announcement.save();
    await announcement.populate("createdBy", "name email");

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: error.message,
    });
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    await Announcement.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message,
    });
  }
};

// Mark announcement as read by user
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Add user to readBy array if not already present
    if (!announcement.readBy.includes(userId)) {
      announcement.readBy.push(userId);
      await announcement.save();
    }

    res.json({
      success: true,
      message: "Announcement marked as read",
    });
  } catch (error) {
    console.error("Error marking announcement as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark announcement as read",
      error: error.message,
    });
  }
};

// Get announcement statistics
const getAnnouncementStats = async (req, res) => {
  try {
    const totalAnnouncements = await Announcement.countDocuments();
    const activeAnnouncements = await Announcement.countDocuments({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });
    const expiredAnnouncements = await Announcement.countDocuments({
      expiresAt: { $lte: new Date() },
    });

    // Get announcements by type
    const announcementsByType = await Announcement.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get announcements by priority
    const announcementsByPriority = await Announcement.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalAnnouncements,
        active: activeAnnouncements,
        expired: expiredAnnouncements,
        byType: announcementsByType,
        byPriority: announcementsByPriority,
      },
    });
  } catch (error) {
    console.error("Error fetching announcement stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  getAnnouncementStats,
};
