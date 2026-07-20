const pool = require('../config/db');

// Helper untuk mempermudah response error
const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
};

exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_produk AS id,
        p.kode_produk AS code,
        p.nama_produk AS name,
        p.berat AS weight,
        p.harga_beli AS buyPrice,
        p.harga_jual AS sellPrice,
        p.stok AS stock,
        p.deskripsi AS description,
        k.nama_kategori AS categoryName,
        p.id_kategori AS categoryId,
        p.featured
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      ORDER BY p.tanggal_ditambahkan DESC
    `);
    
    const formattedRows = rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      weight: row.weight,
      buyPrice: row.buyPrice,
      sellPrice: row.sellPrice,
      stock: row.stock,
      description: row.description,
      category: row.categoryName,
      featured: row.featured === 1 || row.featured === true || row.featured === 'true'
    }));
    
    res.json(formattedRows);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getProductById = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_produk AS id,
        p.kode_produk AS code,
        p.nama_produk AS name,
        p.berat AS weight,
        p.harga_beli AS buyPrice,
        p.harga_jual AS sellPrice,
        p.stok AS stock,
        p.deskripsi AS description,
        k.nama_kategori AS categoryName,
        p.id_kategori AS categoryId,
        p.featured
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      WHERE p.id_produk = ?
    `, [req.params.id]);
    
    if (rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    
    res.json({
      id: rows[0].id,
      code: rows[0].code,
      name: rows[0].name,
      weight: rows[0].weight,
      buyPrice: rows[0].buyPrice,
      sellPrice: rows[0].sellPrice,
      stock: rows[0].stock,
      description: rows[0].description,
      category: rows[0].categoryName,
      featured: rows[0].featured === 1 || rows[0].featured === true || rows[0].featured === 'true'
    });
  } catch (error) {
    handleError(res, error);
  }
};


exports.createProduct = async (req, res) => {
     console.log('Data yang diterima:', req.body);
  try {
    const {
      code, name, category, weight, stock,
      buyPrice, sellPrice, description, featured
    } = req.body;

    // Validasi input
    if (!code || !name || !category || !weight || !stock || !buyPrice || !sellPrice) {
      return res.status(400).json({ message: 'Semua field wajib diisi kecuali deskripsi' });
    }

    // Cari ID kategori berdasarkan NAMA (seperti di updateProduct)
    const [categoryCheck] = await pool.query(
      'SELECT id_kategori FROM kategori WHERE LOWER(nama_kategori) = LOWER(?)', 
      [category.trim()]  // .trim() untuk hapus spasi di awal/akhir
    );

    if (categoryCheck.length === 0) {
      return res.status(400).json({ message: 'Kategori tidak valid' });
    }

    const categoryId = categoryCheck[0].id_kategori;
    const isFeatured = featured === true || featured === 1 || featured === 'true' || featured === '1' ? 1 : 0;

    const [result] = await pool.query(`
      INSERT INTO produk 
      (kode_produk, nama_produk, id_kategori, berat, stok, harga_beli, harga_jual, deskripsi, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, categoryId, parseFloat(weight), parseInt(stock), 
        parseFloat(buyPrice), parseFloat(sellPrice), description || '', isFeatured]);

    // Ambil data produk yang baru dibuat dengan JOIN ke kategori
    const [newProduct] = await pool.query(`
      SELECT 
        p.id_produk AS id,
        p.kode_produk AS code,
        p.nama_produk AS name,
        p.berat AS weight,
        p.harga_beli AS buyPrice,
        p.harga_jual AS sellPrice,
        p.stok AS stock,
        p.deskripsi AS description,
        k.nama_kategori AS category,
        p.featured
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      WHERE p.id_produk = ?
    `, [result.insertId]);
    
    const resProduct = {
      ...newProduct[0],
      featured: newProduct[0].featured === 1 || newProduct[0].featured === true
    };
    
    res.status(201).json(resProduct);
  } catch (error) {
    handleError(res, error);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const {
      code, name, category, weight, stock,
      buyPrice, sellPrice, description, featured
    } = req.body;

    // 1. Cari ID kategori berdasarkan nama kategori
    const [categoryData] = await pool.query(
      'SELECT id_kategori FROM kategori WHERE LOWER(nama_kategori) = LOWER(?)', 
      [category.trim()]
    );

    if (categoryData.length === 0) {
      return res.status(400).json({ message: 'Kategori tidak ditemukan' });
    }

    const categoryId = categoryData[0].id_kategori;
    const isFeatured = featured === true || featured === 1 || featured === 'true' || featured === '1' ? 1 : 0;

    // 2. Update produk dengan ID kategori yang ditemukan
    const [result] = await pool.query(`
      UPDATE produk SET 
        kode_produk = ?, nama_produk = ?, id_kategori = ?, berat = ?,
        stok = ?, harga_beli = ?, harga_jual = ?, deskripsi = ?, featured = ?
      WHERE id_produk = ?
    `, [code, name, categoryId, weight, stock, buyPrice, sellPrice, description, isFeatured, req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    
    // 3. Ambil data terbaru untuk response
    const [updatedProduct] = await pool.query(`
      SELECT p.*, k.nama_kategori 
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      WHERE p.id_produk = ?
    `, [req.params.id]);

    res.json({
      message: 'Produk berhasil diperbarui',
      product: {
        id: updatedProduct[0].id_produk,
        code: updatedProduct[0].kode_produk,
        name: updatedProduct[0].nama_produk,
        category: updatedProduct[0].nama_kategori, // Kirim nama kategori
        weight: parseFloat(updatedProduct[0].berat || 0), 
        stock: updatedProduct[0].stok,
        buyPrice: updatedProduct[0].harga_beli,
        sellPrice: updatedProduct[0].harga_jual,
        description: updatedProduct[0].deskripsi,
        featured: updatedProduct[0].featured === 1 || updatedProduct[0].featured === true
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Hapus detail pembelian terkait
    await connection.query('DELETE FROM detail_pembelian WHERE id_produk = ?', [req.params.id]);
    
    // 2. Hapus detail penjualan terkait (jika ada)
    await connection.query('DELETE FROM detail_penjualan WHERE id_produk = ?', [req.params.id]);
    
    // 3. Baru hapus produknya
    const [result] = await connection.query('DELETE FROM produk WHERE id_produk = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    await connection.commit();
    res.json({ message: 'Produk berhasil dihapus beserta data terkait' });
  } catch (error) {
    await connection.rollback();
    handleError(res, error);
  } finally {
    connection.release();
  }
};

// Get public products (featured or fallback to 6 latest)
exports.getPublicProducts = async (req, res) => {
  try {
    let [rows] = await pool.query(`
      SELECT 
        p.id_produk AS id,
        p.kode_produk AS code,
        p.nama_produk AS name,
        p.berat AS weight,
        p.harga_beli AS buyPrice,
        p.harga_jual AS sellPrice,
        p.stok AS stock,
        p.deskripsi AS description,
        k.nama_kategori AS categoryName,
        p.featured
      FROM produk p
      JOIN kategori k ON p.id_kategori = k.id_kategori
      WHERE p.featured = 1 OR p.featured = true
      ORDER BY p.tanggal_ditambahkan DESC
    `);
    
    if (rows.length === 0) {
      [rows] = await pool.query(`
        SELECT 
          p.id_produk AS id,
          p.kode_produk AS code,
          p.nama_produk AS name,
          p.berat AS weight,
          p.harga_beli AS buyPrice,
          p.harga_jual AS sellPrice,
          p.stok AS stock,
          p.deskripsi AS description,
          k.nama_kategori AS categoryName,
          p.featured
        FROM produk p
        JOIN kategori k ON p.id_kategori = k.id_kategori
        ORDER BY p.tanggal_ditambahkan DESC
        LIMIT 6
      `);
    }
    
    const formattedRows = rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name,
      weight: parseFloat(row.weight || 0),
      buyPrice: parseFloat(row.buyPrice || 0),
      sellPrice: parseFloat(row.sellPrice || 0),
      stock: row.stock,
      description: row.description,
      category: row.categoryName,
      featured: row.featured === 1 || row.featured === true || row.featured === 'true'
    }));
    
    res.json(formattedRows);
  } catch (error) {
    handleError(res, error);
  }
};