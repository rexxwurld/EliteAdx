/**
 * Usage: router.get('/admin-only', protect, roleCheck('admin'), handler)
 */
function roleCheck(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = roleCheck;
