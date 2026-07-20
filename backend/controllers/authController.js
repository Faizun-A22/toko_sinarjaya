const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = rows[0];

    // Bandingkan password yang diinput dengan password hash di database menggunakan bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Buat token JWT untuk sesi
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'jwtsecret_fallback',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login berhasil',
      token: token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat login' });
  }
};
