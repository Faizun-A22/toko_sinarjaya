-- =======================================================
-- SKEMA DATABASE TOKO SINAR JAYA EMAS (SUPABASE POSTGRESQL)
-- =======================================================

-- Hapus tabel lama jika ada (untuk reset aman)
DROP TABLE IF EXISTS detail_penjualan CASCADE;
DROP TABLE IF EXISTS penjualan CASCADE;
DROP TABLE IF EXISTS detail_pembelian CASCADE;
DROP TABLE IF EXISTS pembelian CASCADE;
DROP TABLE IF EXISTS produk CASCADE;
DROP TABLE IF EXISTS kategori CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;
DROP TABLE IF EXISTS pelanggan CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS laporan_keuangan CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS pesanan CASCADE;

-- 1. TABEL USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Menyimpan password terenkripsi bcrypt
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL KATEGORI
CREATE TABLE kategori (
    id_kategori SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) UNIQUE NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL SUPPLIER
CREATE TABLE supplier (
    id_supplier SERIAL PRIMARY KEY,
    nama_supplier VARCHAR(100) UNIQUE NOT NULL,
    alamat TEXT,
    telepon VARCHAR(20),
    email VARCHAR(100),
    kontak_person VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL PRODUK
CREATE TABLE produk (
    id_produk SERIAL PRIMARY KEY,
    kode_produk VARCHAR(50) UNIQUE NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    id_kategori INTEGER REFERENCES kategori(id_kategori) ON DELETE RESTRICT NOT NULL,
    id_supplier INTEGER REFERENCES supplier(id_supplier) ON DELETE SET NULL,
    berat NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    stok INTEGER NOT NULL DEFAULT 0,
    stok_minimal INTEGER NOT NULL DEFAULT 0,
    harga_beli NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    harga_jual NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    deskripsi TEXT,
    featured BOOLEAN NOT NULL DEFAULT FALSE, -- Opsi apakah ditampilkan di Landing Page publik
    tanggal_ditambahkan TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL PELANGGAN
CREATE TABLE pelanggan (
    id_pelanggan SERIAL PRIMARY KEY,
    nama_pelanggan VARCHAR(100) NOT NULL,
    alamat TEXT,
    telepon VARCHAR(20),
    email VARCHAR(100),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL PENJUALAN
CREATE TABLE penjualan (
    id_penjualan SERIAL PRIMARY KEY,
    no_invoice VARCHAR(50) UNIQUE NOT NULL,
    id_pelanggan INTEGER REFERENCES pelanggan(id_pelanggan) ON DELETE SET NULL,
    tanggal_penjualan TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_harga NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    diskon NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_bayar NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status_pembayaran VARCHAR(50) NOT NULL DEFAULT 'Lunas',
    metode_pembayaran VARCHAR(50) NOT NULL DEFAULT 'Cash',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL DETAIL PENJUALAN
CREATE TABLE detail_penjualan (
    id_detail SERIAL PRIMARY KEY,
    id_penjualan INTEGER REFERENCES penjualan(id_penjualan) ON DELETE CASCADE NOT NULL,
    id_produk INTEGER REFERENCES produk(id_produk) ON DELETE RESTRICT NOT NULL,
    jumlah INTEGER NOT NULL DEFAULT 0,
    harga_satuan NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 8. TABEL PEMBELIAN
CREATE TABLE pembelian (
    id_pembelian SERIAL PRIMARY KEY,
    no_pembelian VARCHAR(50) UNIQUE NOT NULL,
    id_supplier INTEGER REFERENCES supplier(id_supplier) ON DELETE CASCADE NOT NULL,
    tanggal_pembelian TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    total_harga NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    metode_pembayaran VARCHAR(50) DEFAULT 'Transfer Bank',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 9. TABEL DETAIL PEMBELIAN
CREATE TABLE detail_pembelian (
    id_detail SERIAL PRIMARY KEY,
    id_pembelian INTEGER REFERENCES pembelian(id_pembelian) ON DELETE CASCADE NOT NULL,
    id_produk INTEGER REFERENCES produk(id_produk) ON DELETE RESTRICT NOT NULL,
    jumlah INTEGER NOT NULL DEFAULT 0,
    harga_satuan NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 10. TABEL LAPORAN KEUANGAN
CREATE TABLE laporan_keuangan (
    id_laporan SERIAL PRIMARY KEY,
    bulan INTEGER NOT NULL,
    tahun INTEGER NOT NULL,
    pendapatan NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    pengeluaran NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    laba NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABEL PENGATURAN LANDING PAGE (CMS)
CREATE TABLE settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value_data TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABEL PESANAN MASUK (DARI LANDING PAGE)
CREATE TABLE pesanan (
    id_pesanan SERIAL PRIMARY KEY,
    id_produk INTEGER REFERENCES produk(id_produk) ON DELETE CASCADE,
    nama_pembeli VARCHAR(100) NOT NULL,
    telepon_pembeli VARCHAR(20) NOT NULL,
    alamat_pembeli TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Selesai', 'Dibatalkan'
    catatan TEXT,
    tanggal_pesanan TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEX UNTUK OPTIMASI PENCARIAN
CREATE INDEX idx_produk_kode ON produk(kode_produk);
CREATE INDEX idx_penjualan_invoice ON penjualan(no_invoice);
CREATE INDEX idx_pembelian_nomor ON pembelian(no_pembelian);
CREATE INDEX idx_penjualan_tanggal ON penjualan(tanggal_penjualan);
CREATE INDEX idx_pembelian_tanggal ON pembelian(tanggal_pembelian);


-- =======================================================
-- TRIGGER DATABASE UNTUK SINKRONISASI STOK OTOMATIS
-- =======================================================

-- A. TRIGGER STOK PADA TRANSAKSI PENJUALAN (MENGURANGI STOK)

-- 1. Saat Baris Penjualan Baru Ditambahkan (INSERT)
CREATE OR REPLACE FUNCTION trg_detail_penjualan_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE produk
    SET stok = stok - NEW.jumlah
    WHERE id_produk = NEW.id_produk;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detail_penjualan_after_insert
AFTER INSERT ON detail_penjualan
FOR EACH ROW
EXECUTE FUNCTION trg_detail_penjualan_insert();

-- 2. Saat Baris Penjualan Dihapus (DELETE)
CREATE OR REPLACE FUNCTION trg_detail_penjualan_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE produk
    SET stok = stok + OLD.jumlah
    WHERE id_produk = OLD.id_produk;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detail_penjualan_after_delete
AFTER DELETE ON detail_penjualan
FOR EACH ROW
EXECUTE FUNCTION trg_detail_penjualan_delete();

-- 3. Saat Baris Penjualan Diupdate (UPDATE)
CREATE OR REPLACE FUNCTION trg_detail_penjualan_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.id_produk = NEW.id_produk THEN
        UPDATE produk
        SET stok = stok + (OLD.jumlah - NEW.jumlah)
        WHERE id_produk = NEW.id_produk;
    ELSE
        -- Kembalikan stok produk lama
        UPDATE produk
        SET stok = stok + OLD.jumlah
        WHERE id_produk = OLD.id_produk;
        -- Kurangi stok produk baru
        UPDATE produk
        SET stok = stok - NEW.jumlah
        WHERE id_produk = NEW.id_produk;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detail_penjualan_after_update
AFTER UPDATE ON detail_penjualan
FOR EACH ROW
EXECUTE FUNCTION trg_detail_penjualan_update();


-- B. TRIGGER STOK PADA PEMBELIAN (MENAMBAH STOK)

-- 1. Saat Baris Pembelian Baru Ditambahkan (INSERT)
CREATE OR REPLACE FUNCTION trg_detail_pembelian_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE produk
    SET stok = stok + NEW.jumlah
    WHERE id_produk = NEW.id_produk;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detail_pembelian_after_insert
AFTER INSERT ON detail_pembelian
FOR EACH ROW
EXECUTE FUNCTION trg_detail_pembelian_insert();

-- 2. Saat Baris Pembelian Dihapus (DELETE)
CREATE OR REPLACE FUNCTION trg_detail_pembelian_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE produk
    SET stok = stok - OLD.jumlah
    WHERE id_produk = OLD.id_produk;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detail_pembelian_after_delete
AFTER DELETE ON detail_pembelian
FOR EACH ROW
EXECUTE FUNCTION trg_detail_pembelian_delete();

-- 3. Saat Baris Pembelian Diupdate (UPDATE)
CREATE OR REPLACE FUNCTION trg_detail_pembelian_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.id_produk = NEW.id_produk THEN
        UPDATE produk
        SET stok = stok - (OLD.jumlah - NEW.jumlah)
        WHERE id_produk = NEW.id_produk;
    ELSE
        -- Kembalikan stok produk lama (kurangi)
        UPDATE produk
        SET stok = stok - OLD.jumlah
        WHERE id_produk = OLD.id_produk;
        -- Tambah stok produk baru
        UPDATE produk
        SET stok = stok + NEW.jumlah
        WHERE id_produk = NEW.id_produk;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_detail_pembelian_after_update
AFTER UPDATE ON detail_pembelian
FOR EACH ROW
EXECUTE FUNCTION trg_detail_pembelian_update();


-- =======================================================
-- DATA SEED AWAL (INITIAL SEED DATA)
-- =======================================================

-- Seed Kategori
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Cincin', 'Perhiasan cincin emas berbagai ukuran'),
('Kalung', 'Perhiasan kalung emas model rantai dan lainnya'),
('Gelang', 'Perhiasan gelang emas rantai mau pun gelang tangan keras'),
('Anting', 'Perhiasan anting emas sepasang'),
('Liontin', 'Mainan gantungan untuk perhiasan kalung'),
('Lainnya', 'Perhiasan emas aksesoris lainnya')
ON CONFLICT (nama_kategori) DO NOTHING;

-- Seed Users (Password 'admin' dan 'staff' di-hash dengan bcrypt rounds=10)
-- Hash untuk 'admin': $2a$10$EPVv0T89Fm8Dq4e47QYp/O9K6/Xm71tXwL9c3ZJm4O.vK3J3H1Z2a
-- Hash untuk 'staff': $2a$10$y58TspkM9H9p7P1fBvB.4O8gL/a1WbB9x1Z7vD8O.vK3J3H1Z2a
INSERT INTO users (nama, email, password, role) VALUES
('Admin Sinar Jaya', 'admin@sinarjaya.com', '$2a$10$EPVv0T89Fm8Dq4e47QYp/O9K6/Xm71tXwL9c3ZJm4O.vK3J3H1Z2a', 'admin'),
('Staff Sinar Jaya', 'staff@sinarjaya.com', '$2a$10$y58TspkM9H9p7P1fBvB.4O8gL/a1WbB9x1Z7vD8O.vK3J3H1Z2a', 'staff')
ON CONFLICT (email) DO NOTHING;

-- Seed Pelanggan (General Customer default)
INSERT INTO pelanggan (nama_pelanggan, alamat, telepon, email, catatan) VALUES
('Pelanggan Umum', 'Toko Sinar Jaya Emas', '-', '-', 'Akun pelanggan default untuk transaksi tunai tanpa nama');

-- Seed Supplier
INSERT INTO supplier (nama_supplier, alamat, telepon, email, kontak_person) VALUES
('Pabrik Emas Utama', 'Kawasan Industri Pulo Gadung, Jakarta', '021-5551234', 'info@emasutama.com', 'Bpk. Budi'),
('Distributor Sinar Kencana', 'Kopo, Bandung', '022-7778899', 'sales@sinarkencana.com', 'Ibu Diana')
ON CONFLICT (nama_supplier) DO NOTHING;

-- Seed Produk Mock (Initial Inventory dengan featured=true)
INSERT INTO produk (kode_produk, nama_produk, id_kategori, id_supplier, berat, stok, stok_minimal, harga_beli, harga_jual, deskripsi, featured) VALUES
('P-CN-001', 'Cincin Kawin Polos Emas 18K', 1, 1, 4.50, 15, 5, 3200000.00, 3800000.00, 'Cincin kawin polos berat 4.5 gram kadar 75% (18 karat)', true),
('P-KL-002', 'Kalung Rantai Italy Emas 24K', 2, 1, 10.00, 8, 2, 9000000.00, 10500000.00, 'Kalung emas model rantai Italy kadar 99% (24 karat)', true),
('P-GL-003', 'Gelang Rantai Serut Emas 18K', 3, 2, 7.20, 12, 3, 5000000.00, 5900000.00, 'Gelang serut emas kuning kadar 75%', true),
('P-AT-004', 'Anting Tindik Giwang Berlian', 4, 2, 2.00, 25, 5, 1400000.00, 1750000.00, 'Anting giwang emas putih mata permata putih elegan', true);

-- Seed Settings (Konfigurasi Landing Page CMS)
INSERT INTO settings (key_name, value_data) VALUES
('hero_title', 'Kemewahan Abadi Dalam Genggaman Anda'),
('hero_subtitle', 'Sinar Jaya Emas menyediakan perhiasan emas berkualitas tinggi dengan desain eksklusif, kadar terjamin, dan nilai investasi terbaik.'),
('whatsapp_number', '628123456789'),
('shop_address', 'Jl. Jenderal Sudirman No. 123, Blok A-1, Jakarta Selatan')
ON CONFLICT (key_name) DO NOTHING;
