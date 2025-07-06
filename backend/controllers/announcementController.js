const Announcement = require("../models/Announcement");
const User = require("../models/User");

// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      priority,
      targetAudience,
      isActive,
      userId,
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Filter by expiry date
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gte: new Date() } },
    ];

    // Filter by user role if userId provided
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userRole = user.role.toLowerCase();
        query.$and = [
          {
            $or: [
              { targetAudience: "all" },
              {
                targetAudience:
                  userRole === "shopowner" ? "shop_owners" : userRole + "s",
              },
            ],
          },
        ];
      }
    }

    const announcements = await Announcement.find(query)
      .populate("createdBy", "name email")
      .populate("targetBranches", "name code")
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

// Get single announcement
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("targetBranches", "name code address")
      .populate("readBy.user", "name email");

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
      message: "Error fetching announcement",
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
      priority,
      targetAudience,
      targetBranches,
      expiresAt,
      attachments,
      discountPercentage,
      applicableProducts,
      minOrderValue,
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
      priority: priority || "medium",
      targetAudience: targetAudience || "all",
      targetBranches: targetBranches || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      attachments: attachments || [],
      createdBy: req.user.id,
      discountPercentage: discountPercentage || 0,
      applicableProducts: applicableProducts || [],
      minOrderValue: minOrderValue || 0,
    });

    await announcement.save();

    await announcement.populate("createdBy", "name email");
    await announcement.populate("targetBranches", "name code");

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

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if user has permission to update
    if (
      announcement.createdBy.toString() !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this announcement",
      });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("targetBranches", "name code");

    res.json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Error updating announcement",
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

    // Check if user has permission to delete
    if (
      announcement.createdBy.toString() !== req.user.id &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this announcement",
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
      message: "Error deleting announcement",
      error: error.message,
    });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
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

    // Check if already read by this user
    const alreadyRead = announcement.readBy.some(
      (read) => read.user.toString() === userId
    );

    if (!alreadyRead) {
      announcement.readBy.push({
        user: userId,
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

// Get announcement statistics
exports.getAnnouncementStats = async (req, res) => {
  try {
    const stats = await Announcement.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          byType: {
            $push: {
              type: "$type",
              count: 1,
            },
          },
          byPriority: {
            $push: {
              priority: "$priority",
              count: 1,
            },
          },
        },
      },
    ]);

    const typeStats = await Announcement.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const priorityStats = await Announcement.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        total: stats[0]?.total || 0,
        active: stats[0]?.active || 0,
        byType: typeStats,
        byPriority: priorityStats,
      },
    });
  } catch (error) {
    console.error("Error fetching announcement stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching announcement stats",
      error: error.message,
    });
  }
};

// Get active discounts for customers and shop owners
exports.getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const activeDiscounts = await Announcement.find({
      type: "promotion",
      isActive: true,
      discountPercentage: { $gt: 0 },
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }],
    }).populate("createdBy", "name");

    res.json({
      success: true,
      discounts: activeDiscounts,
    });
  } catch (error) {
    console.error("Error fetching active discounts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active discounts",
      error: error.message,
    });
  }
};
