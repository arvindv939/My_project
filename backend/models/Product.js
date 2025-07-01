const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Vegetables",
        "Fruits",
        "Dairy",
        "Bakery",
        "Snacks",
        "Beverages",
        "Staples",
        "Household",
        "Personal Care",
        "Others",
      ],
    },
    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: [
        "Kg",
        "Grams",
        "Litres",
        "Millilitres",
        "Units",
        "Packets",
        "Pieces",
        "Dozen",
      ],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    images: [
      {
        type: String,
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    views: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
productSchema.index({ createdBy: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model("Product", productSchema);
