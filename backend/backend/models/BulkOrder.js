const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Bulk order title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["bulk_purchase", "festive_pack", "seasonal_combo"],
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        discountPercentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      required: true,
    },
    minQuantity: {
      type: Number,
      default: 1,
    },
    maxQuantity: {
      type: Number,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
