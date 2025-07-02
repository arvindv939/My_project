const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["bulk", "festive", "seasonal", "combo"],
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
    pricing: {
      originalPrice: {
        type: Number,
        required: true,
      },
      discountedPrice: {
        type: Number,
        required: true,
      },
      savings: {
        type: Number,
        default: 0,
      },
    },
    minimumQuantity: {
      type: Number,
      default: 1,
    },
    maximumQuantity: {
      type: Number,
    },
    availableQuantity: {
      type: Number,
      required: true,
    },
    soldQuantity: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    deliveryOptions: {
      homeDelivery: {
        type: Boolean,
        default: true,
      },
      storePickup: {
        type: Boolean,
        default: true,
      },
      deliveryCharge: {
        type: Number,
        default: 0,
      },
    },
    terms: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate pricing before saving
bulkOrderSchema.pre("save", function (next) {
  if (this.pricing.originalPrice && this.pricing.discountedPrice) {
    this.pricing.savings =
      this.pricing.originalPrice - this.pricing.discountedPrice;
  }
  next();
});

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
