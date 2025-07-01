const express = require("express");
const { body } = require("express-validator");
const {
  registerShopOwner,
  loginShopOwner,
  getProfile,
} = require("../controllers/shopOwnerController.js");
const protect = require("../middleware/authMiddleware.js"); // Correct import path

const router = express.Router();

// ✅ Test Route
router.get("/", (req, res) => {
  res.send("ShopOwner API is working!");
});

// ✅ Shop Owner Registration Route
router.post(
  "/register",
  [
    body("name", "Name is required").not().isEmpty(),
    body("email", "Valid email is required").isEmail(),
    body("password", "Password should be at least 6 characters").isLength({
      min: 6,
    }),
    body("shopName", "Shop Name is required").not().isEmpty(),
    body("phone", "Phone number is required").not().isEmpty(),
  ],
  registerShopOwner
);

// ✅ Shop Owner Login Route
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  loginShopOwner
);

// ✅ Protected Route to Get Profile (Requires Auth)
router.get("/profile", protect, getProfile);

module.exports = router;
