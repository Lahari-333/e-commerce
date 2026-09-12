/**
 * Admin Authorization Middleware
 * Verifies that the authenticated user possesses the 'admin' role
 * Must be preceded by authenticateToken middleware
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Authentication required"
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Administrator privileges required"
    });
  }

  next();
}

module.exports = {
  requireAdmin
};
