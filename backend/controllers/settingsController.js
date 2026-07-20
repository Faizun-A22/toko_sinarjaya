const pool = require('../config/db');

// Get settings for public access (no login needed)
exports.getPublicSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, value_data FROM settings');
    
    // Format menjadi key-value object sederhana
    const config = {};
    rows.forEach(row => {
      config[row.key_name] = row.value_data;
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan website.' });
  }
};

// Get settings (auth required)
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT key_name, value_data FROM settings');
    
    const config = {};
    rows.forEach(row => {
      config[row.key_name] = row.value_data;
    });
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Gagal mengambil pengaturan.' });
  }
};

// Update settings (auth required)
exports.updateSettings = async (req, res) => {
  const { hero_title, hero_subtitle, whatsapp_number, shop_address } = req.body;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    if (hero_title !== undefined) {
      await connection.query('UPDATE settings SET value_data = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?', [hero_title, 'hero_title']);
    }
    if (hero_subtitle !== undefined) {
      await connection.query('UPDATE settings SET value_data = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?', [hero_subtitle, 'hero_subtitle']);
    }
    if (whatsapp_number !== undefined) {
      await connection.query('UPDATE settings SET value_data = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?', [whatsapp_number, 'whatsapp_number']);
    }
    if (shop_address !== undefined) {
      await connection.query('UPDATE settings SET value_data = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?', [shop_address, 'shop_address']);
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Pengaturan website berhasil diperbarui.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Gagal memperbarui pengaturan website.' });
  } finally {
    connection.release();
  }
};
