const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: [100, "Shop name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    logo: String,
    images: [String],
    shopCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    theme: {
      primaryColor: { type: String, default: "#10B981" },
      secondaryColor: { type: String, default: "#059669" },
      accentColor: { type: String, default: "#34D399" },
    },
    settings: {
      acceptsOnlineOrders: { type: Boolean, default: true },
      deliveryAvailable: { type: Boolean, default: true },
      pickupAvailable: { type: Boolean, default: true },
      minimumOrderAmount: { type: Number, default: 0 },
      deliveryRadius: { type: Number, default: 5 }, // in km
      deliveryFee: { type: Number, default: 0 },
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate shop code before saving
shopSchema.pre("save", function (next) {
  if (!this.shopCode) {
    this.shopCode =
      this.name.substring(0, 3).toUpperCase() +
      Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

// Indexes
shopSchema.index({ owner: 1 });
shopSchema.index({ shopCode: 1 });
shopSchema.index({ "address.city": 1 });

module.exports = mongoose.model("Shop", shopSchema);
