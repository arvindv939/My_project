const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// In-memory store for reset tokens (for demo only)
const resetTokens = {}; // { token: { email, expires } }

// === REGISTER ===
exports.register = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      password,
      role = "customer",
    } = req.body;

    const emailToCheck = email.toLowerCase();
    const userExists = await User.findOne({ email: emailToCheck });
    if (userExists) {
      return res
        .status(400)
        .json({ error: "User with this email already exists." });
    }

    const fullName = name || `${firstName} ${lastName}`.trim();

    if (!fullName) {
      return res.status(400).json({ error: "Name is required." });
    }

    const user = await User.create({
      name: fullName,
      email: emailToCheck,
      password,
      role,
    });

    return res.status(201).json({ message: "Registration successful!" });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "User with this email already exists." });
    }
    console.error("Error during registration:", error);
    return res.status(500).json({ error: error.message || "Server error." });
  }
};

// === LOGIN ===
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Login attempt:", email, password);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// === FORGOT PASSWORD ===
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(200).json({
      message: "If the email exists, a reset link has been sent!",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  resetTokens[token] = {
    email: user.email,
    expires: Date.now() + 1000 * 60 * 10, // 10 min
  };

  console.log(`Reset link: http://localhost:5173/reset-password/${token}`);

  res.status(200).json({
    message:
      "If the email exists, a reset link has been sent! (Check server logs for the link in demo.)",
  });
};

// === RESET PASSWORD ===
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!resetTokens[token]) {
    return res.status(400).json({ error: "Invalid or expired reset token." });
  }

  const { email, expires } = resetTokens[token];
  if (Date.now() > expires) {
    delete resetTokens[token];
    return res.status(400).json({ error: "Reset token expired." });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ error: "No user found for this token." });
  }

  user.password = password;
  await user.save();
  delete resetTokens[token];
  res
    .status(200)
    .json({ message: "Password reset successful! Please log in." });
};
