const mongoose = require("mongoose");

const autoReorderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderTemplate: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
      },
    ],
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom"],
      required: true,
    },
    customInterval: { type: Number }, // For custom: interval in days
    time: { type: String, required: true }, // e.g., "08:00"
    nextRun: { type: Date }, // Next scheduled run
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AutoReorder", autoReorderSchema);
