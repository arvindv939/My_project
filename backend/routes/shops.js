const express = require("express");
const Shop = require("../models/Shop");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// Get all shops
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const shops = await Shop.find(query)
      .populate("owner", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Shop.countDocuments(query);

    res.json({
      shops,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get shops error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get shop by ID
router.get("/:id", async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate(
      "owner",
      "name email"
    );

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    res.json(shop);
  } catch (error) {
    console.error("Get shop error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create shop (shop owner only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  async (req, res) => {
    try {
      const { name, description, location, contactInfo, images } = req.body;

      // Check if user already has a shop
      const existingShop = await Shop.findOne({ owner: req.user.userId });
      if (existingShop) {
        return res.status(400).json({ message: "You already have a shop" });
      }

      const shop = new Shop({
        name,
        description,
        location,
        contactInfo,
        images: images || [],
        owner: req.user.userId,
      });

      await shop.save();
      await shop.populate("owner", "name email");

      res.status(201).json(shop);
    } catch (error) {
      console.error("Create shop error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update shop
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id);

      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Check if user owns this shop
      if (shop.owner.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedShop = await Shop.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).populate("owner", "name email");

      res.json(updatedShop);
    } catch (error) {
      console.error("Update shop error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete shop
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner", "admin"]),
  async (req, res) => {
    try {
      const shop = await Shop.findById(req.params.id);

      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Check if user owns this shop or is admin
      if (
        shop.owner.toString() !== req.user.userId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await Shop.findByIdAndDelete(req.params.id);
      res.json({ message: "Shop deleted successfully" });
    } catch (error) {
      console.error("Delete shop error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get my shop (shop owner)
router.get(
  "/my/shop",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  async (req, res) => {
    try {
      const shop = await Shop.findOne({ owner: req.user.userId }).populate(
        "owner",
        "name email"
      );

      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      res.json(shop);
    } catch (error) {
      console.error("Get my shop error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
