const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
      maxlength: [100, "Branch name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    contact: {
      phone: { type: String, required: true },
      email: String,
      whatsapp: String,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shopOwners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    operatingHours: {
      monday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      tuesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      wednesday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      thursday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      friday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      saturday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: false },
      },
      sunday: {
        open: String,
        close: String,
        closed: { type: Boolean, default: true },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      deliveryAvailable: { type: Boolean, default: true },
      pickupAvailable: { type: Boolean, default: true },
      minimumOrderAmount: { type: Number, default: 0 },
      deliveryRadius: { type: Number, default: 5 }, // in km
      deliveryFee: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Generate branch code before saving
branchSchema.pre("save", function (next) {
  if (!this.code) {
    this.code =
      this.name.substring(0, 3).toUpperCase() +
      Math.random().toString(36).substr(2, 3).toUpperCase();
  }
  next();
});

module.exports = mongoose.model("Branch", branchSchema);
