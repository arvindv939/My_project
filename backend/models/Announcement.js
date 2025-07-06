const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error", "promotion"],
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
    targetBranches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        type: String, // URLs to images or documents
      },
    ],
    // Discount/Promotion fields
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    minOrderValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
announcementSchema.index({ targetAudience: 1, isActive: 1, expiresAt: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ type: 1, discountPercentage: 1 });

module.exports = mongoose.model("Announcement", announcementSchema);
