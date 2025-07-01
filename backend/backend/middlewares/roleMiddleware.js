const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Normalize role to handle both "ShopOwner" and "shop_owner"
      let userRole = req.user.role;
      if (userRole === "ShopOwner") {
        userRole = "shop_owner";
      }

      // Check if user's role is in the allowed roles array
      const normalizedAllowedRoles = allowedRoles.map((role) =>
        role === "ShopOwner" ? "shop_owner" : role
      );

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(
            ", "
          )}. Your role: ${req.user.role}`,
        });
      }

      // Update req.user.role to normalized version for consistency
      req.user.role = userRole;
      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Server error in role verification",
      });
    }
  };
};

module.exports = roleMiddleware;
