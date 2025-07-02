const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true, // Removed required: true
      uppercase: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "India",
      },
    },
    contact: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
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
    isActive: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      open: {
        type: String,
        default: "09:00",
      },
      close: {
        type: String,
        default: "21:00",
      },
    },
    deliveryRadius: {
      type: Number,
      default: 10, // in kilometers
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique branch code before saving
branchSchema.pre("save", async function (next) {
  if (!this.code) {
    const count = await mongoose.model("Branch").countDocuments();
    this.code = `BR${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Branch", branchSchema);
