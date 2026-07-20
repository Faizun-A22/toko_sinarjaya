const pool = require('../config/db');

// Get dashboard summary data
exports.getSummaryData = async (req, res) => {
    try {
        // Get current month and year
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        
        // Query for monthly income
        const [monthlyIncome] = await pool.query(`
            SELECT COALESCE(SUM(total_bayar), 0) as income 
            FROM penjualan 
            WHERE MONTH(tanggal_penjualan) = ? AND YEAR(tanggal_penjualan) = ?
        `, [currentMonth, currentYear]);
        
        // Query for last month income for comparison
        const [lastMonthIncome] = await pool.query(`
            SELECT COALESCE(SUM(total_bayar), 0) as income 
            FROM penjualan 
            WHERE MONTH(tanggal_penjualan) = ? AND YEAR(tanggal_penjualan) = ?
        `, [lastMonth, lastMonthYear]);
        
        // Calculate income change percentage
const incomeChange = lastMonthIncome[0].income > 0 
    ? ((monthlyIncome[0].income - lastMonthIncome[0].income) / lastMonthIncome[0].income) * 100 
    : (monthlyIncome[0].income > 0 ? 100 : 0);

        // Query for total products
        const [totalProducts] = await pool.query('SELECT COUNT(*) as count FROM produk');
        
        // Query for low stock items (stock <= 20)
        const [lowStockItems] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM produk 
            WHERE stok <= 20
        `);
        
        // Query for monthly profit (income - expenses)
        const [monthlyProfit] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN bulan = ? AND tahun = ? THEN pendapatan ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN bulan = ? AND tahun = ? THEN pengeluaran ELSE 0 END), 0) as expenses
            FROM laporan_keuangan
        `, [currentMonth, currentYear, currentMonth, currentYear]);
        
        // Query for last month profit for comparison
        const [lastMonthProfit] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN bulan = ? AND tahun = ? THEN pendapatan ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN bulan = ? AND tahun = ? THEN pengeluaran ELSE 0 END), 0) as expenses
            FROM laporan_keuangan
        `, [lastMonth, lastMonthYear, lastMonth, lastMonthYear]);
        
        const currentProfit = monthlyProfit[0].income - monthlyProfit[0].expenses;
        const lastProfit = lastMonthProfit[0].income - lastMonthProfit[0].expenses;
      const profitChange = lastProfit > 0 
    ? ((currentProfit - lastProfit) / lastProfit) * 100 
    : (currentProfit > 0 ? 100 : 0);

        
        res.json({
            monthly_income: monthlyIncome[0].income,
            income_change: incomeChange.toFixed(2),
            total_products: totalProducts[0].count,
            low_stock_items: lowStockItems[0].count,
            monthly_profit: currentProfit,
            profit_change: profitChange.toFixed(2)
        });
        
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Gagal memuat data dashboard' });
    }
};

// Get sales chart data (last 6 months)
exports.getSalesChartData = async (req, res) => {
    try {
        const currentDate = new Date();
        const result = [];
        
        for (let i = 5; i >= 0; i--) {
            // Inisialisasi tanggal pada hari ke-1 untuk menghindari bug luapan hari (month-day overflow)
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const monthName = date.toLocaleString('id-ID', { month: 'long' });
            
            const [sales] = await pool.query(`
                SELECT COALESCE(SUM(total_bayar), 0) as total 
                FROM penjualan 
                WHERE MONTH(tanggal_penjualan) = ? AND YEAR(tanggal_penjualan) = ?
            `, [month, year]);
            
            result.push({
                month: monthName,
                total: sales[0].total
            });
        }
        
        res.json({
            labels: result.map(item => item.month),
            values: result.map(item => item.total)
        });
        
    } catch (error) {
        console.error('Error fetching sales chart data:', error);
        res.status(500).json({ message: 'Gagal memuat data penjualan' });
    }
};

// Get inventory distribution chart data
exports.getInventoryChartData = async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT k.nama_kategori, COUNT(p.id_produk) as product_count, SUM(p.stok) as total_stock
            FROM kategori k
            LEFT JOIN produk p ON k.id_kategori = p.id_kategori
            GROUP BY k.id_kategori
            ORDER BY total_stock DESC
        `);
        
        res.json({
            labels: categories.map(cat => cat.nama_kategori),
            values: categories.map(cat => cat.total_stock || 0)
        });
        
    } catch (error) {
        console.error('Error fetching inventory chart data:', error);
        res.status(500).json({ message: 'Gagal memuat data stok' });
    }
};

// Get recent transactions (last 10)
exports.getRecentTransactions = async (req, res) => {
    try {
        const [transactions] = await pool.query(`
            SELECT p.no_invoice, p.tanggal_penjualan, p.total_bayar, p.status_pembayaran, 
                   pl.nama_pelanggan
            FROM penjualan p
            LEFT JOIN pelanggan pl ON p.id_pelanggan = pl.id_pelanggan
            ORDER BY p.tanggal_penjualan DESC
            LIMIT 10
        `);
        
        res.json(transactions);
        
    } catch (error) {
        console.error('Error fetching recent transactions:', error);
        res.status(500).json({ message: 'Gagal memuat data transaksi terakhir' });
    }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.id_produk, p.kode_produk, p.nama_produk, p.stok, p.stok_minimal, k.nama_kategori
            FROM produk p
            JOIN kategori k ON p.id_kategori = k.id_kategori
            WHERE p.stok <= 20
            ORDER BY p.stok ASC
            LIMIT 10
        `);
        
        res.json(products);
        
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ message: 'Gagal memuat data stok rendah' });
    }
};