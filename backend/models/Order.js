const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  picked: {
    type: Boolean,
    default: false,
  },
})

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: "",
  },
  updatedBy: {
    type: String,
    enum: ["system", "manual", "customer", "admin"],
    default: "system",
  },
})

const orderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [statusHistorySchema],
    orderType: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    fulfillmentMethod: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    storeLocation: {
      type: String,
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "India" },
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "upi",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderNotes: String,
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    // New fields for automated status progression
    confirmedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    deliveredAt: Date,
    estimatedPrepTime: {
      type: Number,
      default: 10, // minutes
    },
  },
  {
    timestamps: true,
  },
)

// Add virtual for customer reference (backward compatibility)
orderSchema.virtual("customer", {
  ref: "User",
  localField: "customerId",
  foreignField: "_id",
  justOne: true,
})

// Middleware to update timestamp fields when status changes
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    const now = new Date()
    switch (this.status) {
      case "confirmed":
        if (!this.confirmedAt) this.confirmedAt = now
        break
      case "preparing":
        if (!this.preparingAt) this.preparingAt = now
        break
      case "ready":
        if (!this.readyAt) this.readyAt = now
        break
      case "delivered":
        if (!this.deliveredAt) this.deliveredAt = now
        break
    }
  }
  next()
})

// Ensure virtual fields are serialized
orderSchema.set("toJSON", { virtuals: true })
orderSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Order", orderSchema)
