const requireStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  return res.status(403).redirect('/login?error=Access denied');
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).redirect('/login?error=Access denied');
};

module.exports = { requireStudent, requireAdmin };
