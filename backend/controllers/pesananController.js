const pool = require('../config/db');

// Create new order from public landing page (no login needed)
exports.createPublicPesanan = async (req, res) => {
  const { id_produk, nama_pembeli, telepon_pembeli, alamat_pembeli, catatan } = req.body;
  
  if (!id_produk || !nama_pembeli || !telepon_pembeli || !alamat_pembeli) {
    return res.status(400).json({ message: 'Semua kolom wajib diisi kecuali catatan.' });
  }

  try {
    // Validasi produk exists
    const [prodCheck] = await pool.query('SELECT id_produk, nama_produk, harga_jual FROM produk WHERE id_produk = ?', [id_produk]);
    if (prodCheck.length === 0) {
      return res.status(404).json({ message: 'Produk yang dipesan tidak ditemukan.' });
    }

    const [result] = await pool.query(
      'INSERT INTO pesanan (id_produk, nama_pembeli, telepon_pembeli, alamat_pembeli, catatan, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id_produk, nama_pembeli, telepon_pembeli, alamat_pembeli, catatan || '', 'Pending']
    );

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil disimpan di database.',
      orderId: result.insertId,
      product: prodCheck[0]
    });
  } catch (error) {
    console.error('Error creating public order:', error);
    res.status(500).json({ message: 'Gagal memproses pesanan Anda.' });
  }
};

// Get all orders (auth required)
exports.getAllPesanan = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_pesanan,
        p.nama_pembeli,
        p.telepon_pembeli,
        p.alamat_pembeli,
        p.status,
        p.catatan,
        p.tanggal_pesanan,
        pr.id_produk,
        pr.nama_produk,
        pr.kode_produk,
        pr.berat,
        pr.harga_jual
      FROM pesanan p
      LEFT JOIN produk pr ON p.id_produk = pr.id_produk
      ORDER BY p.tanggal_pesanan DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Gagal mengambil daftar pesanan.' });
  }
};

// Update order status (auth required)
exports.updatePesananStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Pending', 'Selesai', 'Dibatalkan'

  if (!status) {
    return res.status(400).json({ message: 'Status wajib diisi.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE pesanan SET status = ? WHERE id_pesanan = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Status pesanan berhasil diperbarui.' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Gagal memperbarui status pesanan.' });
  }
};
