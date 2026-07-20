const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  // Format header: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format token tidak valid. Harus "Bearer <token>"' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecret_fallback');
    req.user = decoded; // Menyimpan data user (id, nama, email, role) ke request
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
};

module.exports = authMiddleware;
