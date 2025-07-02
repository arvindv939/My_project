const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Normalize the user role to lowercase and underscore format
      const normalizeRole = (role) => {
        return role
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/-/g, "_")
          .trim();
      };

      const userRole = normalizeRole(req.user.role);

      const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(
            ", "
          )}. Your role: ${req.user.role}`,
        });
      }

      // Attach normalized role back to request for consistent downstream use
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
