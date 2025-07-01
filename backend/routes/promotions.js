const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// In-memory storage for promotions (replace with database in production)
const promotions = [
  {
    _id: "1",
    shopOwnerId: "sample_owner_id",
    type: "flash_sale",
    title: "Weekend Flash Sale",
    description: "Get 30% off on all vegetables this weekend!",
    discountPercentage: 30,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    applicableProducts: [],
    minOrderValue: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Get all promotions
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Filter promotions by shop owner if not admin
    let userPromotions = promotions;
    if (req.user.role === "ShopOwner") {
      userPromotions = promotions.filter((p) => p.shopOwnerId === req.user.id);
    }

    res.json({
      success: true,
      promotions: userPromotions,
    });
  } catch (error) {
    console.error("Get promotions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new promotion
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const {
        type,
        title,
        description,
        discountPercentage,
        startDate,
        endDate,
        applicableProducts,
        minOrderValue,
      } = req.body;

      // Validate required fields
      if (!type || !title || !discountPercentage || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: type, title, discountPercentage, startDate, endDate",
        });
      }

      // Validate discount percentage
      if (discountPercentage < 1 || discountPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: "Discount percentage must be between 1 and 100",
        });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        });
      }

      if (start < new Date()) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be in the past",
        });
      }

      const newPromotion = {
        _id: Date.now().toString(),
        shopOwnerId: req.user.id,
        type,
        title: title.trim(),
        description: description ? description.trim() : "",
        discountPercentage: Number(discountPercentage),
        startDate: start,
        endDate: end,
        applicableProducts: applicableProducts || [],
        minOrderValue: Number(minOrderValue) || 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      promotions.push(newPromotion);

      console.log("Promotion created:", newPromotion);

      res.status(201).json({
        success: true,
        message: "Promotion created successfully",
        promotion: newPromotion,
      });
    } catch (error) {
      console.error("Create promotion error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update promotion
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "ShopOwner" && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const promotionIndex = promotions.findIndex((p) => p._id === req.params.id);

    if (promotionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found",
      });
    }

    const promotion = promotions[promotionIndex];

    // Check if user owns this promotion
    if (
      req.user.role === "ShopOwner" &&
      promotion.shopOwnerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this promotion",
      });
    }

    // Update promotion
    promotions[promotionIndex] = {
      ...promotion,
      ...req.body,
      updatedAt: new Date(),
    };

    res.json({
      success: true,
      message: "Promotion updated successfully",
      promotion: promotions[promotionIndex],
    });
  } catch (error) {
    console.error("Error updating promotion:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Delete promotion
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "ShopOwner" && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const promotionIndex = promotions.findIndex((p) => p._id === req.params.id);

    if (promotionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Promotion not found",
      });
    }

    const promotion = promotions[promotionIndex];

    // Check if user owns this promotion
    if (
      req.user.role === "ShopOwner" &&
      promotion.shopOwnerId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this promotion",
      });
    }

    promotions.splice(promotionIndex, 1);

    res.json({
      success: true,
      message: "Promotion deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Get active promotions for customers
router.get("/active", async (req, res) => {
  try {
    const now = new Date();
    const activePromotions = promotions.filter(
      (p) =>
        p.isActive && new Date(p.startDate) <= now && new Date(p.endDate) >= now
    );

    res.json({
      success: true,
      promotions: activePromotions,
    });
  } catch (error) {
    console.error("Error fetching active promotions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
