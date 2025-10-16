const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // Allow access
  } else {
    res.status(403).json({ message: "Only admins can perform this action." });
  }
};

module.exports = adminOnly;
