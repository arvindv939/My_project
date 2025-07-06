const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: [
        "info",
        "warning",
        "success",
        "promotion",
        "maintenance",
        "update",
      ],
      default: "info",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    targetAudience: {
      type: String,
      enum: ["all", "customers", "shop_owners", "admins"],
      default: "all",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    metadata: {
      imageUrl: String,
      actionUrl: String,
      actionText: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
announcementSchema.index({ targetAudience: 1, isActive: 1, expiresAt: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ priority: -1 });

// Virtual to check if announcement is expired
announcementSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to check if user has read the announcement
announcementSchema.methods.isReadBy = function (userId) {
  return this.readBy.includes(userId);
};

// Static method to get active announcements for a user
announcementSchema.statics.getActiveForUser = function (userRole) {
  const targetAudiences = ["all"];

  if (userRole === "Customer") {
    targetAudiences.push("customers");
  } else if (userRole === "ShopOwner") {
    targetAudiences.push("shop_owners");
  } else if (userRole === "Admin") {
    targetAudiences.push("admins");
  }

  return this.find({
    targetAudience: { $in: targetAudiences },
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  }).sort({ priority: -1, createdAt: -1 });
};

module.exports = mongoose.model("Announcement", announcementSchema);
