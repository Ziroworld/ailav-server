// Usage: router.delete('/some/:id', authenticateAccessToken, checkRole('admin'), handler)
function checkRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
    }
    next();
  };
}

module.exports = { checkRole };
