const jwt = require('jsonwebtoken');

/**
 * Protect middleware: Ensures a valid JWT is present in the Authorization header.
 * Attaches the decoded user payload to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DCLUB FARMERS_secure_kernel_2026');

      req.user = decoded;
      return next(); // Critical: Return after calling next to stop execution
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Session expired or invalid signature. Please login again.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No security token found.' });
  }
};

/**
 * Admin middleware: Ensures the authenticated user has the 'admin' role.
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access Denied: Administrative privileges required.' });
};

/**
 * Optional Protect middleware: Decodes token if present, but does not block if missing.
 */
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DCLUB FARMERS_secure_kernel_2026');
      req.user = decoded;
    } catch (error) {
      // Ignore token if invalid for optional protection
    }
  }
  next();
};

module.exports = { protect, admin, optionalProtect };
