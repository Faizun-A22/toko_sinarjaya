const pool = require('../config/db');

// Helper function to generate invoice number
const generateInvoiceNumber = (type) => {
  const prefix = type === 'penjualan' ? 'INV' : type === 'pembelian' ? 'PBL' : 'RTR';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  
  return `${prefix}-${year}${month}${day}-${random}`;
};

// Get all transactions with filters
const getAllTransactions = async (req, res) => {
  try {
    const { type, status, startDate, endDate, search, page = 1, limit = 10 } = req.query;
    
    // Query utama
    let query = `
      SELECT 
        p.id_penjualan as id,
        p.no_invoice,
        p.tanggal_penjualan as tanggal,
        pl.nama_pelanggan as customer,
        'penjualan' as jenis,
        p.total_bayar as total,
        p.status_pembayaran as status,
        p.metode_pembayaran
      FROM penjualan p
      LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
      WHERE 1=1
    `;
    
    // Query count untuk pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM penjualan p
      LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Filter status
    if (status && status !== 'all') {
      query += ` AND p.status_pembayaran = ?`;
      params.push(status);
      countQuery += ` AND p.status_pembayaran = ?`;
      countParams.push(status);
    }
    
    // Filter tanggal
    if (startDate) {
      query += ` AND p.tanggal_penjualan >= ?`;
      params.push(startDate);
      countQuery += ` AND p.tanggal_penjualan >= ?`;
      countParams.push(startDate);
    }
    
    if (endDate) {
      query += ` AND p.tanggal_penjualan <= ?`;
      params.push(endDate + ' 23:59:59');
      countQuery += ` AND p.tanggal_penjualan <= ?`;
      countParams.push(endDate + ' 23:59:59');
    }
    
    // Filter pencarian
    if (search) {
      query += ` AND (p.no_invoice LIKE ? OR pl.nama_pelanggan LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
      countQuery += ` AND (p.no_invoice LIKE ? OR pl.nama_pelanggan LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY p.tanggal_penjualan DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    // Eksekusi query utama dan count
    const [transactions] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);
    
    // Query summary - PERBAIKAN UTAMA DI SINI
    let summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN DATE(tanggal_penjualan) = CURDATE() THEN 1 ELSE 0 END) as today_transactions,
        SUM(total_bayar) as total_income
      FROM penjualan
      WHERE 1=1
    `;
    
    const summaryParams = [];
    
    // Hanya tambahkan filter jika diperlukan
    if (status && status !== 'all') {
      summaryQuery += ` AND status_pembayaran = ?`;
      summaryParams.push(status);
    }
    
    if (startDate) {
      summaryQuery += ` AND tanggal_penjualan >= ?`;
      summaryParams.push(startDate);
    }
    
    if (endDate) {
      summaryQuery += ` AND tanggal_penjualan <= ?`;
      summaryParams.push(endDate + ' 23:59:59');
    }
    
    const [[summary]] = await pool.query(summaryQuery, summaryParams);
    
    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalTransactions: summary.total_transactions || 0,
        todayTransactions: summary.today_transactions || 0,
        totalIncome: summary.total_income || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get transaction header
    const [header] = await pool.query(`
      SELECT 
        p.*,
        pl.nama_pelanggan,
        pl.alamat,
        pl.telepon,
        pl.email
      FROM penjualan p
      LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
      WHERE p.id_penjualan = ?
    `, [id]);
    
    if (header.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Get transaction items
    const [items] = await pool.query(`
      SELECT 
        dp.*,
        pr.kode_produk,
        pr.nama_produk,
        pr.berat
      FROM detail_penjualan dp
      JOIN produk pr ON dp.id_produk = pr.id_produk
      WHERE dp.id_penjualan = ?
    `, [id]);
    
    res.json({
      ...header[0],
      items
    });
    
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { 
      customer, 
      transactionDate, 
      items, 
      discount = 0, 
      paymentMethod,
      notes = '' 
    } = req.body;
    console.log('Received transactionDate:', transactionDate);
    // Validasi wajib
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Items tidak boleh kosong" });
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber('penjualan');
    
    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
    
    // Insert transaction header (tanpa status_pembayaran)
    const [result] = await connection.query(`
      INSERT INTO penjualan (
        no_invoice,
        id_pelanggan,
        tanggal_penjualan,
        total_harga,
        diskon,
        total_bayar,
        metode_pembayaran,
        catatan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoiceNumber,
      customer,
      transactionDate,
      subtotal,
      discount,
      total,
      paymentMethod,
      notes
    ]);
    
    const transactionId = result.insertId;
    
    // Insert transaction items
    for (const item of items) {
      await connection.query(`
        INSERT INTO detail_penjualan (
          id_penjualan,
          id_produk,
          jumlah,
          harga_satuan,
          subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        transactionId,
        item.productId,
        item.quantity,
        item.price,
        item.price * item.quantity
      ]);
    }
    
    await connection.commit();
    
    res.status(201).json({ 
      message: 'Transaction created successfully',
      transactionId,
      invoiceNumber
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { 
      customer, 
      transactionDate, 
      items, 
      discount = 0, 
      paymentMethod,
      notes = '' 
    } = req.body;
    
    // Get current transaction
    const [currentTransaction] = await connection.query(`
      SELECT * FROM penjualan WHERE id_penjualan = ?
    `, [id]);
    
    if (currentTransaction.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Calculate new total
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
    
    // Update transaction header (tanpa status_pembayaran)
    await connection.query(`
      UPDATE penjualan SET
        id_pelanggan = ?,
        tanggal_penjualan = ?,
        total_harga = ?,
        diskon = ?,
        total_bayar = ?,
        metode_pembayaran = ?,
        catatan = ?
      WHERE id_penjualan = ?
    `, [
      customer,
      transactionDate,
      subtotal,
      discount,
      total,
      paymentMethod,
      notes,
      id
    ]);
    
    // Get current items to compare
    const [currentItems] = await connection.query(`
      SELECT * FROM detail_penjualan WHERE id_penjualan = ?
    `, [id]);
    
    // Delete items not in the new list
    const newItemIds = items.map(item => item.id).filter(Boolean);
    const itemsToDelete = currentItems.filter(item => !newItemIds.includes(item.id_detail));
    
    for (const item of itemsToDelete) {
      await connection.query(`
        DELETE FROM detail_penjualan WHERE id_detail = ?
      `, [item.id_detail]);
    }
    
    // Update or insert items
    for (const item of items) {
      if (item.id) {
        // Update existing item
        await connection.query(`
          UPDATE detail_penjualan SET
            id_produk = ?,
            jumlah = ?,
            harga_satuan = ?,
            subtotal = ?
          WHERE id_detail = ?
        `, [
          item.productId,
          item.quantity,
          item.price,
          item.price * item.quantity,
          item.id
        ]);
      } else {
        // Insert new item
        await connection.query(`
          INSERT INTO detail_penjualan (
            id_penjualan,
            id_produk,
            jumlah,
            harga_satuan,
            subtotal
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          item.productId,
          item.quantity,
          item.price,
          item.price * item.quantity
        ]);
      }
    }
    
    await connection.commit();
    
    res.json({ 
      message: 'Transaction updated successfully',
      transactionId: id
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    connection.release();
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // First check if transaction exists
    const [transaction] = await connection.query(`
      SELECT * FROM penjualan WHERE id_penjualan = ?
    `, [id]);
    
    if (transaction.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Delete transaction items (will cascade from the trigger)
    await connection.query(`
      DELETE FROM detail_penjualan WHERE id_penjualan = ?
    `, [id]);
    
    // Delete transaction header
    await connection.query(`
      DELETE FROM penjualan WHERE id_penjualan = ?
    `, [id]);
    
    await connection.commit();
    
    res.json({ message: 'Transaction deleted successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

// Get customers for dropdown
const getCustomers = async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT id_pelanggan as id, nama_pelanggan as name 
      FROM pelanggan 
      ORDER BY nama_pelanggan
    `);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get products for dropdown
const getProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        id_produk as id,
        kode_produk as code,
        nama_produk as name,
        berat,
        harga_jual as price,
        stok as stock
      FROM produk
      WHERE stok > 0
      ORDER BY nama_produk
    `);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCustomers,
  getProducts
};