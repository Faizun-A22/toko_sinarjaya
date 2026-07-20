const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const laporanKeuanganRoutes = require('./routes/laporanKeuangan');
const transaksiRoutes = require('./routes/transaksiRoutes'); 
const purchaseRoutes = require('./routes/purchaseRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const pesananRoutes = require('./routes/pesananRoutes');

// Import auth middleware
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://203.194.112.254'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Rute Publik & Rute Hybrid (Proteksi dikelola internal rute masing-masing)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pesanan', pesananRoutes);

// Rute Privat Global (Memerlukan token JWT aktif)
app.use('/api/purchases', authMiddleware, purchaseRoutes); 
app.use('/api/laporan-keuangan', authMiddleware, laporanKeuanganRoutes);
app.use('/api/transaksi', authMiddleware, transaksiRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);


const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
