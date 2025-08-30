const pool = require('../config/db');

// Get all purchases with filters
const getAllPurchases = async (req, res) => {
    try {
        const { search, supplier, status, date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                p.id_pembelian as id,
                p.no_pembelian as purchase_number,
                p.tanggal_pembelian as purchase_date,
                s.nama_supplier as supplier_name,
                p.total_harga as total_amount
            FROM pembelian p
            JOIN supplier s ON p.id_supplier = s.id_supplier
            WHERE 1=1
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM pembelian p
            JOIN supplier s ON p.id_supplier = s.id_supplier
            WHERE 1=1
        `;
        
        const params = [];
        const countParams = [];

        // Tambahkan filter
        if (search) {
            const searchParam = `%${search}%`;
            query += ` AND (p.no_pembelian LIKE ? OR s.nama_supplier LIKE ?)`;
            countQuery += ` AND (p.no_pembelian LIKE ? OR s.nama_supplier LIKE ?)`;
            params.push(searchParam, searchParam);
            countParams.push(searchParam, searchParam);
        }
        
        if (supplier && supplier !== 'all') {
            query += ` AND p.id_supplier = ?`;
            countQuery += ` AND p.id_supplier = ?`;
            params.push(supplier);
            countParams.push(supplier);
        }
        
        if (status && status !== 'all') {
            query += ` AND p.status_pembayaran = ?`;
            countQuery += ` AND p.status_pembayaran = ?`;
            params.push(status);
            countParams.push(status);
        }
        
        if (date) {
            query += ` AND DATE(p.tanggal_pembelian) = ?`;
            countQuery += ` AND DATE(p.tanggal_pembelian) = ?`;
            params.push(date);
            countParams.push(date);
        }

        // Hitung total data
        const [countRows] = await pool.query(countQuery, countParams);
        const total = countRows[0].total;

        if (total === 0) {
            return res.json({
                transactions: [],
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: 0
                }
            });
        }

        // Tambahkan sorting dan pagination
        query += ` ORDER BY p.tanggal_pembelian DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, params);

        res.json({
            transactions: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message,
            sql: error.sql 
        });
    }
};

// Get purchase summary
const getPurchaseSummary = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const [totalPurchases] = await pool.query(`
            SELECT COUNT(*) as total FROM pembelian
        `);

        const [todayPurchases] = await pool.query(`
            SELECT COUNT(*) as total FROM pembelian 
            WHERE DATE(tanggal_pembelian) = ?
        `, [today]);

        const [totalExpense] = await pool.query(`
            SELECT SUM(total_harga) as total FROM pembelian
        `);

        res.json({
            totalPurchases: totalPurchases[0].total,
            todayPurchases: todayPurchases[0].total,
            totalExpense: totalExpense[0].total || 0
        });
    } catch (error) {
        console.error('Error fetching purchase summary:', error);
        res.status(500).json({ message: 'Server error while fetching purchase summary' });
    }
};

// Get suppliers list
const getSuppliersList = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id_supplier as id, nama_supplier as name 
            FROM supplier 
            ORDER BY nama_supplier
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Server error while fetching suppliers' });
    }
};

// Get products list
const getProductsList = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id_produk as id, 
                kode_produk as code, 
                nama_produk as name,
                berat as weight,
                harga_beli as purchase_price
            FROM produk 
            ORDER BY nama_produk
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error while fetching products' });
    }
};

// Get single purchase
const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get purchase header
        const [purchaseRows] = await pool.query(`
            SELECT 
                p.id_pembelian as id,
                p.no_pembelian as purchase_number,
                p.tanggal_pembelian as purchase_date,
                s.id_supplier as supplier_id,
                s.nama_supplier as supplier_name,
                p.total_harga as total_amount,
                p.catatan as notes
            FROM pembelian p
            JOIN supplier s ON p.id_supplier = s.id_supplier
            WHERE p.id_pembelian = ?
        `, [id]);

        if (purchaseRows.length === 0) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        // Get purchase items
        const [itemRows] = await pool.query(`
            SELECT 
                dp.id_detail as id,
                dp.id_produk as product_id,
                pr.kode_produk as product_code,
                pr.nama_produk as product_name,
                dp.jumlah as quantity,
                dp.harga_satuan as purchase_price,
                dp.subtotal
            FROM detail_pembelian dp
            JOIN produk pr ON dp.id_produk = pr.id_produk
            WHERE dp.id_pembelian = ?
        `, [id]);

        const purchase = {
            ...purchaseRows[0],
            items: itemRows
        };

        res.json(purchase);
    } catch (error) {
        console.error('Error fetching purchase:', error);
        res.status(500).json({ message: 'Server error while fetching purchase' });
    }
};

// Create new purchase
const createPurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            purchase_number,
            purchase_date,
            supplier_id,
            items,
            total_amount,
            payment_method,
            notes
        } = req.body;

        // Insert purchase header
        const [purchaseResult] = await connection.query(`
            INSERT INTO pembelian (
                no_pembelian,
                id_supplier,
                tanggal_pembelian,
                total_harga,
                catatan
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            purchase_number,
            supplier_id,
            purchase_date,
            total_amount,
            notes || null
        ]);

        const purchaseId = purchaseResult.insertId;

        // Insert purchase items
        for (const item of items) {
            await connection.query(`
                INSERT INTO detail_pembelian (
                    id_pembelian,
                    id_produk,
                    jumlah,
                    harga_satuan,
                    subtotal
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                purchaseId,
                item.product_id,
                item.quantity,
                item.purchase_price,
                item.purchase_price * item.quantity
            ]);
        }

        await connection.commit();

        // Get the full purchase data to return
        const [newPurchase] = await connection.query(`
            SELECT 
                p.id_pembelian as id,
                p.no_pembelian as purchase_number,
                p.tanggal_pembelian as purchase_date,
                s.nama_supplier as supplier_name,
                p.total_harga as total_amount
            FROM pembelian p
            JOIN supplier s ON p.id_supplier = s.id_supplier
            WHERE p.id_pembelian = ?
        `, [purchaseId]);

        res.status(201).json(newPurchase[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error creating purchase:', error);
        res.status(500).json({ message: 'Server error while creating purchase' });
    } finally {
        connection.release();
    }
};

// Update purchase
const updatePurchase = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { purchase_number, purchase_date, supplier_id, items, total_amount, payment_method, notes } = req.body;

        console.log('Data received:', { id, ...req.body }); // Log data masuk

        // 1. Update header pembelian
        const [updateResult] = await connection.query(`
            UPDATE pembelian SET
                no_pembelian = ?,
                id_supplier = ?,
                tanggal_pembelian = ?,
                total_harga = ?,
                metode_pembayaran = ?,
                catatan = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_pembelian = ?
        `, [
            purchase_number,
            supplier_id,
            purchase_date,
            total_amount,
            payment_method, // Pastikan kolom ini ada di database
            notes || null,
            id
        ]);

        console.log('Update result:', updateResult); // Log hasil update

        // 2. Hapus item lama
        const [deleteResult] = await connection.query(`
            DELETE FROM detail_pembelian 
            WHERE id_pembelian = ?
        `, [id]);
        console.log('Deleted rows:', deleteResult.affectedRows);

        // 3. Insert item baru
        for (const item of items) {
            await connection.query(`
                INSERT INTO detail_pembelian (
                    id_pembelian,
                    id_produk,
                    jumlah,
                    harga_satuan,
                    subtotal
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                id,
                item.product_id,
                item.quantity,
                item.purchase_price,
                item.purchase_price * item.quantity
            ]);
        }

        await connection.commit();
        
        // Verifikasi perubahan
        const [updatedData] = await connection.query(`
            SELECT * FROM pembelian WHERE id_pembelian = ?
        `, [id]);
        console.log('Verified data:', updatedData[0]);

        res.json({ 
            success: true,
            message: 'Purchase updated successfully',
            affectedRows: updateResult.affectedRows
        });

    } catch (error) {
        await connection.rollback();
        console.error('Full error:', {
            message: error.message,
            sqlMessage: error.sqlMessage,
            stack: error.stack,
            sql: error.sql
        });
        res.status(500).json({ 
            success: false,
            message: 'Failed to update purchase',
            error: error.message,
            sqlError: error.sqlMessage
        });
    } finally {
        connection.release();
    }
};

// Delete purchase
const deletePurchase = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Hapus dulu detail pembelian
    await connection.query('DELETE FROM detail_pembelian WHERE id_pembelian = ?', [id]);

    // Baru hapus pembelian utamanya
    const [result] = await connection.query('DELETE FROM pembelian WHERE id_pembelian = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Purchase not found' });
    }

    await connection.commit();
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: 'Server error while deleting purchase' });
  } finally {
    connection.release();
  }
};


module.exports = {
    getAllPurchases,
    getPurchaseSummary,
    getSuppliersList,
    getProductsList,
    getPurchaseById,
    createPurchase,
    updatePurchase,
    deletePurchase
};