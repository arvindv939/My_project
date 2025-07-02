const Announcement = require("../models/Announcement");

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 10, targetAudience, type } = req.query;

    const query = { isActive: true };

    // Filter by target audience if specified
    if (targetAudience) {
      query.$or = [
        { targetAudience: targetAudience },
        { targetAudience: "all" },
      ];
    }

    // Filter by type if specified
    if (type) {
      query.type = type;
    }

    // Filter by expiry date
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ];

    const announcements = await Announcement.find(query)
      .populate("createdBy", "name email")
      .populate("branches", "name code")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ priority: -1, createdAt: -1 });

    const total = await Announcement.countDocuments(query);

    res.json({
      success: true,
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcements",
      error: error.message,
    });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      branches,
      priority,
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
      title: title.trim(),
      message: message.trim(),
      type: type || "info",
      targetAudience: targetAudience || "all",
      branches: branches || [],
      priority: priority || "medium",
      expiresAt,
      createdBy: req.user.userId,
    });

    await announcement.save();

    // Populate the fields for response
    await announcement.populate("createdBy", "name email");
    await announcement.populate("branches", "name code");

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error creating announcement",
      error: error.message,
    });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if user already marked as read
    const alreadyRead = announcement.readBy.some(
      (read) => read.user.toString() === req.user.userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: req.user.userId,
        readAt: new Date(),
      });
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
      message: "Error marking announcement as read",
      error: error.message,
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if user created this announcement
    if (announcement.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own announcements",
      });
    }

    // Soft delete
    await Announcement.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting announcement",
      error: error.message,
    });
  }
};

// Get unread announcements count
exports.getUnreadCount = async (req, res) => {
  try {
    const query = {
      isActive: true,
      $or: [
        { targetAudience: req.user.role.toLowerCase() },
        { targetAudience: "all" },
      ],
      "readBy.user": { $ne: req.user.userId },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    const count = await Announcement.countDocuments(query);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message,
    });
  }
};
