// Casss SPA Navigation
const API_BASE_URL = 'http://localhost:3000'; 
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenu = document.getElementById('casss-mobile-menu');
    const navbarMenu = document.querySelector('.casss-navbar-menu');
    
    mobileMenu.addEventListener('click', function() {
        mobileMenu.classList.toggle('casss-active');
        navbarMenu.classList.toggle('casss-active');
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.casss-navbar-links');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Only close menu on mobile
            if (window.innerWidth <= 768) {
                mobileMenu.classList.remove('casss-active');
                navbarMenu.classList.remove('casss-active');
            }
        });
    });
    
    // Dropdown menu functionality - PERUBAHAN PENTING DI SINI
    const dropdownParents = document.querySelectorAll('.casss-dropdown');
    
    dropdownParents.forEach(parent => {
        const dropdownLink = parent.querySelector('.casss-navbar-links');
        
        dropdownLink.addEventListener('click', function(e) {
            // Prevent default link behavior on mobile
            if (window.innerWidth <= 768) {
                e.preventDefault();
            }
            
            // Toggle active class on parent
            parent.classList.toggle('casss-active');
            
            // Close other dropdowns
            dropdownParents.forEach(otherParent => {
                if (otherParent !== parent) {
                    otherParent.classList.remove('casss-active');
                }
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.casss-dropdown')) {
            dropdownParents.forEach(parent => {
                parent.classList.remove('casss-active');
            });
        }
    });
    
    // SPA navigation
    const sections = document.querySelectorAll('.casss-section');
    const navItems = document.querySelectorAll('.casss-navbar-links');
    
    function setActiveSection(sectionId) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('casss-active');
        });
        
        // Show the selected section
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('casss-active');
        }
        
        // Update active nav item
        navItems.forEach(item => {
            item.classList.remove('casss-active');
            if (item.getAttribute('href') === `#${sectionId}`) {
                item.classList.add('casss-active');
            }
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
    
    // Handle nav link clicks
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Skip dropdown parents (handled separately)
            if (this.parentElement.classList.contains('casss-dropdown')) {
                // On desktop, allow normal navigation for dropdown parents
                if (window.innerWidth > 768) {
                    e.preventDefault();
                    return;
                }
            }
            
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            setActiveSection(sectionId);
            
            // Update URL without reload
            history.pushState(null, null, `#${sectionId}`);
        });
    });
    
    // Handle dropdown item clicks
    const dropdownItems = document.querySelectorAll('.casss-dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            setActiveSection(sectionId);
            
            // Update URL without reload
            history.pushState(null, null, `#${sectionId}`);
            
            // Close dropdowns and mobile menu
            dropdownParents.forEach(parent => {
                parent.classList.remove('casss-active');
            });
            
            if (window.innerWidth <= 768) {
                mobileMenu.classList.remove('casss-active');
                navbarMenu.classList.remove('casss-active');
            }
        });
    });
    
    // Handle back/forward navigation
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            setActiveSection(hash);
        } else {
            setActiveSection('home');
        }
    });
    
    // Set initial section based on URL hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        setActiveSection(initialHash);
    } else {
        setActiveSection('home');
    }
    
    // Inventory control buttons
    const inventoryBtns = document.querySelectorAll('.casss-inventory-btn');
    inventoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            inventoryBtns.forEach(b => b.classList.remove('casss-active'));
            this.classList.add('casss-active');
            // Here you would typically filter the inventory table
        });
    });
});


document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api';
  
  // Elemen DOM utama
  const reportTableBody = document.getElementById('casss-report-body');
  const monthFilter = document.getElementById('casss-month-filter');
  const yearFilter = document.getElementById('casss-year-filter');
  const applyFilterBtn = document.getElementById('casss-apply-filter');
  const resetFilterBtn = document.getElementById('casss-reset-filter');
  const prevPageBtn = document.getElementById('casss-prev-page');
  const nextPageBtn = document.getElementById('casss-next-page');
  const pageInfo = document.getElementById('casss-page-info');

  // Data & Pagination state
  let financialData = []; // Ini akan menyimpan data gabungan penjualan dan pembelian
  let filteredData = [];
  let currentPage = 1;
  const reportsPerPage = 5;

  // Chart.js instance
  let financeChart = null;
  let profitChart = null;

  // Load Chart.js dan init chart
  function loadChartJs(callback) {
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = callback;
      document.head.appendChild(script);
    } else {
      callback();
    }
  }

  function initializeCharts() {
    const financeCtx = document.getElementById('casss-finance-chart').getContext('2d');
    financeChart = new Chart(financeCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Pendapatan',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
          {
            label: 'Pengeluaran',
            data: [],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `Rp ${val.toLocaleString('id-ID')}`
            }
          }
        }
      }
    });

    const profitCtx = document.getElementById('casss-profit-chart').getContext('2d');
    profitChart = new Chart(profitCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Laba',
          data: [],
          backgroundColor: 'rgba(212, 175, 55, 0.3)',
          borderColor: 'rgba(212, 175, 55, 1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: val => `Rp ${val.toLocaleString('id-ID')}`
            }
          }
        }
      }
    });
  }

  // Format angka ke Rupiah
  function formatCurrency(num) {
    return `Rp ${Number(num).toLocaleString('id-ID')}`;
  }

  // Ambil data penjualan dari backend
  async function fetchSales() {
    try {
      const res = await fetch(`${API_URL}/transaksi`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Fetch penjualan error:', error);
      return [];
    }
  }

  // Ambil data pembelian dari backend
  async function fetchPurchases() {
    try {
      const res = await fetch(`${API_URL}/purchases`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Fetch pembelian error:', error);
      return [];
    }
  }

  // Proses data untuk laporan keuangan
  async function processFinancialData() {
    const [salesData, purchasesData] = await Promise.all([fetchSales(), fetchPurchases()]);
    
    // Gabungkan dan kelompokkan data per bulan
    const monthlyData = {};
    
    // Proses penjualan (pendapatan)
    salesData.transactions.forEach(transaction => {
      const date = new Date(transaction.tanggal);
      const month = date.getMonth() + 1; // 1-12
      const year = date.getFullYear();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          bulan: month,
          tahun: year,
          pendapatan: 0,
          pengeluaran: 0,
          laba: 0
        };
      }
      
      monthlyData[key].pendapatan += parseFloat(transaction.total) || 0;
    });
    
    // Proses pembelian (pengeluaran)
    purchasesData.transactions.forEach(purchase => {
      const date = new Date(purchase.purchase_date);
      const month = date.getMonth() + 1; // 1-12
      const year = date.getFullYear();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          bulan: month,
          tahun: year,
          pendapatan: 0,
          pengeluaran: 0,
          laba: 0
        };
      }
      
      monthlyData[key].pengeluaran += parseFloat(purchase.total_amount) || 0;
    });
    
    // Hitung laba dan konversi ke array
    const result = Object.values(monthlyData).map(item => {
      return {
        ...item,
        laba: item.pendapatan - item.pengeluaran
      };
    });
    
    return result;
  }

  // Render tabel laporan dengan pagination dan filter
  function renderTable() {
    reportTableBody.innerHTML = '';

    // Filter dulu
    filteredData = financialData.filter(r => {
      const bulanStr = r.bulan.toString().padStart(2, '0');
      const tahunStr = r.tahun.toString();
      const filterMonth = monthFilter.value;
      const filterYear = yearFilter.value;
      if (filterMonth !== 'all' && filterMonth !== bulanStr) return false;
      if (filterYear !== 'all' && filterYear !== tahunStr) return false;
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / reportsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const startIdx = (currentPage - 1) * reportsPerPage;
    const paginated = filteredData.slice(startIdx, startIdx + reportsPerPage);

    if (paginated.length === 0) {
      reportTableBody.innerHTML = `
        <tr><td colspan="5" style="text-align:center; padding:1em;">Data tidak ditemukan.</td></tr>
      `;
    } else {
      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      paginated.forEach((r, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${monthNames[r.bulan-1]} ${r.tahun}</td>
          <td>${formatCurrency(r.pendapatan)}</td>
          <td>${formatCurrency(r.pengeluaran)}</td>
          <td style="color:${r.laba>=0 ? 'green' : 'red'}">${formatCurrency(r.laba)}</td>
          <td>
            <button class="casss-detail-btn" data-month="${r.bulan}" data-year="${r.tahun}">Detail</button>
          </td>
        `;
        reportTableBody.appendChild(tr);
      });
    }

    pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    updateCharts(filteredData);
    addTableButtonListeners();
  }

  // Update Chart dengan data filteredData
  function updateCharts(data) {
    if (!financeChart || !profitChart) return;

    // Sort data by tahun + bulan ascending
    const sorted = [...data].sort((a,b) => a.tahun - b.tahun || a.bulan - b.bulan);

    const labels = sorted.map(r => {
      const shortMonths = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
      return `${shortMonths[r.bulan - 1]} ${r.tahun}`;
    });
    const pendapatan = sorted.map(r => Number(r.pendapatan));
    const pengeluaran = sorted.map(r => Number(r.pengeluaran));
    const laba = sorted.map(r => Number(r.laba));

    financeChart.data.labels = labels;
    financeChart.data.datasets[0].data = pendapatan;
    financeChart.data.datasets[1].data = pengeluaran;
    financeChart.update();

    profitChart.data.labels = labels;
    profitChart.data.datasets[0].data = laba;
    profitChart.update();
  }

  // Tombol detail di tabel
  function addTableButtonListeners() {
    const detailBtns = reportTableBody.querySelectorAll('.casss-detail-btn');
    detailBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const month = btn.getAttribute('data-month');
        const year = btn.getAttribute('data-year');
        showDetailModal(month, year);
      });
    });
  }

  // Tampilkan modal detail
  async function showDetailModal(month, year) {
    try {
      // Dapatkan data penjualan dan pembelian untuk bulan dan tahun tertentu
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const [salesRes, purchasesRes] = await Promise.all([
        fetch(`${API_URL}/transaksi?startDate=${startDate}&endDate=${endDate}`),
        fetch(`${API_URL}/purchases?date=${startDate},${endDate}`)
      ]);
      
      if (!salesRes.ok || !purchasesRes.ok) {
        throw new Error('Gagal mengambil data detail');
      }
      
      const sales = await salesRes.json();
      const purchases = await purchasesRes.json();
      
      // Tampilkan dalam modal atau alert sederhana
      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      const monthName = monthNames[parseInt(month) - 1];
      
      let message = `Detail Laporan ${monthName} ${year}\n\n`;
      message += `Total Penjualan: ${formatCurrency(sales.summary?.totalIncome || 0)}\n`;
      message += `Jumlah Transaksi: ${sales.summary?.totalTransactions || 0}\n\n`;
      message += `Total Pembelian: ${formatCurrency(purchases.transactions.reduce((sum, p) => sum + parseFloat(p.total_amount), 0))}\n`;
      message += `Jumlah Pembelian: ${purchases.transactions.length}`;
      
      alert(message);
    } catch (error) {
      console.error('Error showing detail:', error);
      alert('Gagal menampilkan detail laporan');
    }
  }

  // Event filter dan pagination
  applyFilterBtn.addEventListener('click', () => {
    currentPage = 1;
    renderTable();
  });

  resetFilterBtn.addEventListener('click', () => {
    monthFilter.value = 'all';
    yearFilter.value = new Date().getFullYear().toString();
    currentPage = 1;
    renderTable();
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / reportsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  // Load data dari backend dan render
  async function loadDataAndRender() {
    financialData = await processFinancialData();
    currentPage = 1;
    
    // Set tahun filter dengan tahun yang tersedia di data
    const years = [...new Set(financialData.map(item => item.tahun))].sort();
    yearFilter.innerHTML = '<option value="all">Semua Tahun</option>' + 
      years.map(year => `<option value="${year}">${year}</option>`).join('');
    
    // Set tahun terbaru sebagai default
    if (years.length > 0) {
      yearFilter.value = Math.max(...years);
    }
    
    renderTable();
  }

  // Init: load Chart.js, load data dan render
  loadChartJs(() => {
    initializeCharts();
    loadDataAndRender();
  });
});




// Data transaksi contoh (nanti diganti dengan data dari database)
let transactions = [];

function confirmDeleteTransaction(id) {
    // Contoh implementasi sederhana menggunakan confirm
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        // Panggil fungsi untuk menghapus transaksi
        deleteTransaction(id);
    }
}


// Fungsi untuk menampilkan transaksi ke tabel
function displayTransactions() {
    const transactionBody = document.getElementById('casss-transaction-body');
    transactionBody.innerHTML = '';
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Tentukan kelas status untuk styling
        let statusClass = '';
        if (transaction.status === 'lunas') statusClass = 'casss-paid';
        else if (transaction.status === 'pending') statusClass = 'casss-pending';
        else if (transaction.status === 'batal') statusClass = 'casss-cancelled';
        
        row.innerHTML = `
            <td class="casss-table-data">${transaction.invoice}</td>
            <td class="casss-table-data">${formatDate(transaction.date)}</td>
            <td class="casss-table-data">${transaction.customer}</td>
            <td class="casss-table-data">${formatTransactionType(transaction.type)}</td>
            <td class="casss-table-data">${formatCurrency(transaction.total)}</td>
            <td class="casss-table-data"><span class="casss-status ${statusClass}">${formatStatus(transaction.status)}</span></td>
            <td class="casss-table-data">
                <button class="casss-action-btn casss-view-btn" data-id="${transaction.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="casss-action-btn casss-edit-btn" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="casss-action-btn casss-delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        transactionBody.appendChild(row);
    });
    
    // Update summary
    updateTransactionSummary();
    
    // Tambahkan event listeners untuk tombol aksi
    addTransactionActionListeners();
}

// Fungsi untuk menambahkan transaksi baru
function addTransaction(newTransaction) {
    // Di sini nanti bisa ditambahkan kode untuk mengirim data ke server
    transactions.push(newTransaction);
    displayTransactions();
}

// Fungsi untuk mengupdate transaksi
function updateTransaction(updatedTransaction) {
    // Di sini nanti bisa ditambahkan kode untuk mengirim data ke server
    const index = transactions.findIndex(t => t.id === updatedTransaction.id);
    if (index !== -1) {
        transactions[index] = updatedTransaction;
        displayTransactions();
    }
}

// Fungsi untuk menghapus transaksi
function deleteTransaction(id) {
    // Di sini nanti bisa ditambahkan kode untuk mengirim permintaan ke server
    transactions = transactions.filter(t => t.id !== id);
    displayTransactions();
}

// Fungsi untuk menampilkan detail transaksi
function showTransactionDetail(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Isi modal detail
    document.getElementById('casss-detail-invoice').textContent = transaction.invoice;
    document.getElementById('casss-detail-date').textContent = formatDate(transaction.date);
    document.getElementById('casss-detail-customer').textContent = transaction.customer;
    document.getElementById('casss-detail-type').textContent = formatTransactionType(transaction.type);
    document.getElementById('casss-detail-status').textContent = formatStatus(transaction.status);
    document.getElementById('casss-detail-status').className = `casss-status ${transaction.status === 'lunas' ? 'casss-paid' : transaction.status === 'pending' ? 'casss-pending' : 'casss-cancelled'}`;
   
    
    // Isi item transaksi
    const itemsBody = document.getElementById('casss-detail-items-body');
    itemsBody.innerHTML = '';
    
    let subtotal = 0;
    transaction.items.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.weight} gr</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(itemSubtotal)}</td>
        `;
        itemsBody.appendChild(row);
    });
    
    document.getElementById('casss-detail-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('casss-detail-discount').textContent = formatCurrency(transaction.discount);
    document.getElementById('casss-detail-total').textContent = formatCurrency(transaction.total);
    
    // Tampilkan modal
    document.getElementById('casss-detail-modal').style.display = 'block';
}

// Fungsi untuk mengupdate summary transaksi
function updateTransactionSummary() {
    const totalTransactions = transactions.length;
    const totalIncome = transactions.reduce((sum, t) => t.type === 'penjualan' ? sum + t.total : sum, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.date === today).length;
    
    document.getElementById('casss-total-transactions').textContent = totalTransactions;
    document.getElementById('casss-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('casss-today-transactions').textContent = todayTransactions;
}

// Fungsi helper untuk format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}

function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatStatus(status) {
    const statusMap = {
        'lunas': 'Lunas',
        'pending': 'Pending',
        'batal': 'Batal'
    };
    return statusMap[status] || status;
}

function formatTransactionType(type) {
    const typeMap = {
        'penjualan': 'Penjualan',
        'pembelian': 'Pembelian',
        'retur': 'Retur'
    };
    return typeMap[type] || type;
}

function formatPaymentMethod(method) {
    const methodMap = {
        'tunai': 'Tunai',
        'transfer': 'Transfer Bank',
        'kredit': 'Kartu Kredit'
    };
    return methodMap[method] || method;
}

// Event listeners untuk tombol aksi
function addTransactionActionListeners() {
    // Tombol view
    document.querySelectorAll('.casss-view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            showTransactionDetail(id);
        });
    });
    
    // Tombol edit
    document.querySelectorAll('.casss-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            editTransaction(id);
        });
    });
    
    // Tombol delete
    document.querySelectorAll('.casss-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            confirmDeleteTransaction(id);
        });
    });
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    displayTransactions();
    
    // Tambahkan event listeners lainnya untuk modal, form, dll.
});





document.addEventListener('DOMContentLoaded', function () {
    const bulanFilter = document.getElementById('casss-month-filter');
    const tahunFilter = document.getElementById('casss-year-filter');

    // ======== 1. ISI BULAN =========
    const bulanList = [
        { value: "01", nama: "Januari" },
        { value: "02", nama: "Februari" },
        { value: "03", nama: "Maret" },
        { value: "04", nama: "April" },
        { value: "05", nama: "Mei" },
        { value: "06", nama: "Juni" },
        { value: "07", nama: "Juli" },
        { value: "08", nama: "Agustus" },
        { value: "09", nama: "September" },
        { value: "10", nama: "Oktober" },
        { value: "11", nama: "November" },
        { value: "12", nama: "Desember" },
    ];

    // Tambahkan opsi "Semua Bulan"
    bulanFilter.innerHTML = '<option value="all">Semua Bulan</option>';
    bulanList.forEach(b => {
        const option = document.createElement('option');
        option.value = b.value;
        option.textContent = b.nama;
        bulanFilter.appendChild(option);
    });

    // ======== 2. ISI TAHUN =========
    const tahunSekarang = new Date().getFullYear();
    const tahunMulai = 2020; // Ubah sesuai kebutuhan

    tahunFilter.innerHTML = ''; // Kosongkan dulu
    for (let tahun = tahunSekarang; tahun >= tahunMulai; tahun--) {
        const option = document.createElement('option');
        option.value = tahun;
        option.textContent = tahun;
        tahunFilter.appendChild(option);
    }

    // ======== 3. BUTTON FILTER ========
    document.getElementById('casss-apply-filter').addEventListener('click', function () {
        const bulan = bulanFilter.value;
        const tahun = tahunFilter.value;

        console.log(`Filter diterapkan: Bulan=${bulan}, Tahun=${tahun}`);
        // Jalankan fungsi filter data sesuai bulan dan tahun
    });

    document.getElementById('casss-reset-filter').addEventListener('click', function () {
        bulanFilter.value = 'all';
        tahunFilter.value = tahunSekarang.toString();
        console.log('Filter direset');
        // Jalankan logika reset filter
    });
});





//transaksi
document.addEventListener('DOMContentLoaded', function() {
    // Variabel global
    let currentPage = 1;
    const itemsPerPage = 10;
    let transactions = [];
    let customers = [];
    let products = [];
    let currentTransactionId = null;
    let transactionItems = [];

    // DOM Elements
    const transactionTableBody = document.getElementById('casss-transaction-body');
    const transactionSearch = document.getElementById('casss-transaction-search');
    const transactionTypeFilter = document.getElementById('casss-transaction-type');
    const transactionDateFilter = document.getElementById('casss-transaction-date');
    const addTransactionBtn = document.getElementById('casss-add-transaction');
    const exportTransactionBtn = document.getElementById('casss-export-transaction');
    const prevPageBtn = document.getElementById('casss-transaction-prev');
    const nextPageBtn = document.getElementById('casss-transaction-next');
    const pageInfo = document.getElementById('casss-transaction-page-info');
    const totalTransactionsSpan = document.getElementById('casss-total-transactions');
    const totalIncomeSpan = document.getElementById('casss-total-income');
    const todayTransactionsSpan = document.getElementById('casss-today-transactions');

    // Modal Elements
    const transactionModal = document.getElementById('casss-transaction-modal');
    const transactionForm = document.getElementById('casss-transaction-form');
    const transactionIdInput = document.getElementById('casss-transaction-id');
    const transactionInvoiceInput = document.getElementById('casss-transaction-invoice');
    const transactionFilterDateInput = document.getElementById('casss-transaction-date');
const transactionModalDateInput = document.getElementById('casss-transaction-modal-date');
    const transactionCustomerSelect = document.getElementById('casss-transaction-customer');
    const transactionTypeSelect = document.getElementById('casss-transaction-type');
    const transactionPaymentSelect = document.getElementById('casss-transaction-payment');
    const transactionDiscountInput = document.getElementById('casss-transaction-discount');
    const transactionTotalInput = document.getElementById('casss-transaction-total');
    const transactionItemsContainer = document.getElementById('casss-transaction-items');
    const itemsTotalSpan = document.getElementById('casss-items-total');
    const addItemBtn = document.getElementById('casss-add-item');

    // Item Modal Elements
    const itemModal = document.getElementById('casss-item-modal');
    const itemForm = document.getElementById('casss-item-form');
    const itemProductSelect = document.getElementById('casss-item-product');
    const itemCodeInput = document.getElementById('casss-item-code');
    const itemWeightInput = document.getElementById('casss-item-weight');
    const itemPriceInput = document.getElementById('casss-item-price');
    const itemQuantityInput = document.getElementById('casss-item-quantity');
    const itemStockInput = document.getElementById('casss-item-stock');

    // Detail Modal Elements
    const detailModal = document.getElementById('casss-detail-modal');
    const detailInvoiceSpan = document.getElementById('casss-detail-invoice');
    const detailDateSpan = document.getElementById('casss-detail-date');
    const detailCustomerSpan = document.getElementById('casss-detail-customer');
    const detailTypeSpan = document.getElementById('casss-detail-type');
    const detailPaymentSpan = document.getElementById('casss-detail-payment');
    const detailItemsBody = document.getElementById('casss-detail-items-body');
    const detailSubtotalSpan = document.getElementById('casss-detail-subtotal');
    const detailDiscountSpan = document.getElementById('casss-detail-discount');
    const detailTotalSpan = document.getElementById('casss-detail-total');
    const detailNotesP = document.getElementById('casss-detail-notes');
    const printDetailBtn = document.getElementById('casss-print-detail');
    const closeDetailBtn = document.getElementById('casss-close-detail');

    // Confirm Modal Elements
    const confirmModal = document.getElementById('casss-transaction-confirm-modal');
    const confirmDeleteBtn = document.getElementById('casss-confirm-transaction-delete');
    const cancelDeleteBtn = document.getElementById('casss-cancel-transaction-delete');

    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.casss-close-modal, .casss-form-cancel');

    // Event Listeners
    transactionSearch.addEventListener('input', debounce(loadTransactions, 300));
    transactionTypeFilter.addEventListener('change', loadTransactions);
    transactionDateFilter.addEventListener('change', loadTransactions);
    addTransactionBtn.addEventListener('click', openAddTransactionModal);
    exportTransactionBtn.addEventListener('click', exportTransactions);
    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);
    transactionForm.addEventListener('submit', saveTransaction);
    addItemBtn.addEventListener('click', openAddItemModal);
    itemForm.addEventListener('submit', addItemToTransaction);
    printDetailBtn.addEventListener('click', printTransactionDetail);
    closeDetailBtn.addEventListener('click', () => detailModal.style.display = 'none');
    confirmDeleteBtn.addEventListener('click', confirmDeleteTransaction);
    cancelDeleteBtn.addEventListener('click', () => confirmModal.style.display = 'none');

    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.casss-modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Initialize
    loadTransactions();
    loadCustomers();
    loadProducts();

    // Fungsi untuk debounce
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // Fungsi untuk memuat transaksi
async function loadTransactions() {
    try {
        const search = transactionSearch.value;
        const type = transactionTypeFilter.value;
        const date = transactionDateFilter.value;

        let url = `${API_BASE_URL}/api/transaksi?page=${currentPage}&limit=${itemsPerPage}`;
        if (search) url += `&search=${search}`;
        if (type !== 'all') url += `&type=${type}`;
        if (date) url += `&startDate=${date}&endDate=${date}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        transactions = data.transactions;
        renderTransactions(transactions);
        updatePagination(data.pagination);

        totalTransactionsSpan.textContent = data.summary.totalTransactions;
        todayTransactionsSpan.textContent = data.summary.todayTransactions;
        totalIncomeSpan.textContent = formatCurrency(data.summary.totalIncome);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showAlert('error', 'Gagal memuat data transaksi: ' + error.message);
    }
}

    // Fungsi untuk merender tabel transaksi
    function renderTransactions(transactions) {
        transactionTableBody.innerHTML = '';

        if (transactions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" class="casss-text-center">Tidak ada data transaksi</td>`;
            transactionTableBody.appendChild(row);
            return;
        }

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.no_invoice}</td>
                <td>${formatDate(transaction.tanggal)}</td>
                <td>${transaction.customer || '-'}</td>
                <td>${capitalizeFirstLetter(transaction.jenis)}</td>
                <td>${formatCurrency(transaction.total)}</td>
                <td>
                    <button class="casss-action-btn casss-view-btn" data-id="${transaction.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                      <button class="casss-transaction-edit-btn" data-id="${transaction.id}">
    <i class="fas fa-edit"></i>
  </button>
                    <button class="casss-action-btn casss-delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            transactionTableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.casss-view-btn').forEach(btn => {
            btn.addEventListener('click', () => viewTransaction(btn.dataset.id));
        });

        document.querySelectorAll('.casss-transaction-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Edit transaction clicked:', btn.dataset.id);
            editTransaction(btn.dataset.id);
        });
        });
        document.querySelectorAll('.casss-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => showDeleteConfirmation(btn.dataset.id));
        });
    }

    // Fungsi untuk update pagination
    function updatePagination(pagination) {
        const { total, page, limit, totalPages } = pagination;
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        pageInfo.textContent = `Menampilkan ${start}-${end} dari ${total} transaksi`;
        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page === totalPages;
    }

    // Fungsi untuk pindah halaman
    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            loadTransactions();
        }
    }

    function goToNextPage() {
        currentPage++;
        loadTransactions();
    }

    // Fungsi untuk memuat daftar pelanggan
    async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/transaksi/customers/list`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        customers = await response.json();
        transactionCustomerSelect.innerHTML = '<option value="">Pilih Pelanggan</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            transactionCustomerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        showAlert('error', 'Gagal memuat data pelanggan: ' + error.message);
    }
}

    // Fungsi untuk memuat daftar produk
    async function loadProducts() {
        try {
           const response = await fetch('http://localhost:3000/api/transaksi/products/list');
            products = await response.json();

            // Update product dropdown in item modal
            itemProductSelect.innerHTML = '<option value="">Pilih Produk</option>';
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.code})`;
                option.dataset.code = product.code;
                option.dataset.weight = product.berat;
                option.dataset.price = product.price;
                option.dataset.stock = product.stock;
                itemProductSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // Fungsi untuk membuka modal tambah transaksi
    function openAddTransactionModal() {
        currentTransactionId = null;
        transactionItems = [];
        
        // Reset form
        transactionForm.reset();
        transactionIdInput.value = '';
        transactionInvoiceInput.value = generateInvoiceNumber('penjualan');
        transactionModalDateInput.value = new Date().toISOString().split('T')[0];
        transactionItemsContainer.innerHTML = '';
        itemsTotalSpan.textContent = 'Rp 0';
        transactionTotalInput.value = '0';
        transactionDiscountInput.value = '0';
        
        // Set modal title
        document.getElementById('casss-transaction-modal-title').textContent = 'Tambah Transaksi Baru';
        
        // Show modal
        transactionModal.style.display = 'block';
    }

    // Fungsi untuk generate nomor invoice
    function generateInvoiceNumber(type) {
        const prefix = type === 'penjualan' ? 'INV' : 'PBL';
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        
        return `${prefix}-${year}${month}${day}-${random}`;
    }

    
    // Fungsi untuk membuka modal tambah item
    function openAddItemModal() {
        // Reset form
        itemForm.reset();
        itemCodeInput.value = '';
        itemWeightInput.value = '';
        itemPriceInput.value = '';
        itemQuantityInput.value = '1';
        itemStockInput.value = '';
        
        // Show modal
        itemModal.style.display = 'block';
    }

    // Event ketika produk dipilih di modal item
    itemProductSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.value) {
            itemCodeInput.value = selectedOption.dataset.code;
            itemWeightInput.value = selectedOption.dataset.weight;
            itemPriceInput.value = selectedOption.dataset.price;
            itemStockInput.value = selectedOption.dataset.stock;
        } else {
            itemCodeInput.value = '';
            itemWeightInput.value = '';
            itemPriceInput.value = '';
            itemStockInput.value = '';
        }
    });

    // Fungsi untuk menambahkan item ke transaksi
    function addItemToTransaction(e) {
        e.preventDefault();
        
        const productId = itemProductSelect.value;
        const productName = itemProductSelect.options[itemProductSelect.selectedIndex].text;
        const productCode = itemCodeInput.value;
        const weight = parseFloat(itemWeightInput.value);
        const price = parseFloat(itemPriceInput.value);
        const quantity = parseInt(itemQuantityInput.value);
        const stock = parseInt(itemStockInput.value);
        
        // Validasi
        if (!productId) {
            showAlert('error', 'Silakan pilih produk');
            return;
        }
        
        if (quantity <= 0) {
            showAlert('error', 'Quantity harus lebih dari 0');
            return;
        }
        
        if (quantity > stock) {
            showAlert('error', 'Quantity melebihi stok tersedia');
            return;
        }
        
        // Tambahkan item ke daftar
        const item = {
            productId,
            productName,
            productCode,
            weight,
            price,
            quantity,
            subtotal: price * quantity
        };
        
        transactionItems.push(item);
        renderTransactionItems();
        calculateTotal();
        
        // Tutup modal
        itemModal.style.display = 'none';
    }

    // Fungsi untuk merender daftar item transaksi
    function renderTransactionItems() {
        transactionItemsContainer.innerHTML = '';
        
        if (transactionItems.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" class="casss-text-center">Belum ada item</td>`;
            transactionItemsContainer.appendChild(row);
            return;
        }
        
        transactionItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.productName}</td>
                <td>${item.productCode}</td>
                <td>${item.weight}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.subtotal)}</td>
                <td>
                    <button class="casss-action-btn casss-edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="casss-action-btn casss-delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            transactionItemsContainer.appendChild(row);
        });
        
        // Hitung total
        const total = transactionItems.reduce((sum, item) => sum + item.subtotal, 0);
        itemsTotalSpan.textContent = formatCurrency(total);
        
        // Add event listeners to item action buttons
        document.querySelectorAll('#casss-transaction-items .casss-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editTransactionItem(btn.dataset.index));
        });
        
            document.querySelectorAll('#casss-transaction-items .casss-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTransactionItem(Number(btn.dataset.index)));
});
}
    

    // Fungsi untuk mengedit item transaksi
    function editTransactionItem(index) {
        const item = transactionItems[index];
        
        // Isi form dengan data item
        itemProductSelect.value = item.productId;
        itemCodeInput.value = item.productCode;
        itemWeightInput.value = item.weight;
        itemPriceInput.value = item.price;
        itemQuantityInput.value = item.quantity;
        itemStockInput.value = products.find(p => p.id == item.productId).stock;
        
        // Set hidden input untuk index item
        document.getElementById('casss-item-id').value = index;
        
        // Ubah judul modal
        document.querySelector('#casss-item-modal .casss-modal-title').textContent = 'Edit Item Transaksi';
        
        // Show modal
        itemModal.style.display = 'block';
    }

    // Fungsi untuk menghapus item transaksi
    function deleteTransactionItem(index) {
        itemModal.style.display = 'block';
            transactionItems.splice(index, 1);
    
    // Render ulang daftar item
    renderTransactionItems();
    
    // Hitung ulang total transaksi
    calculateTotal()
    }

    // Fungsi untuk menghitung total transaksi
    function calculateTotal() {
        const subtotal = transactionItems.reduce((sum, item) => sum + item.subtotal, 0);
        const discount = parseFloat(transactionDiscountInput.value) || 0;
        const total = subtotal - discount;
        
        itemsTotalSpan.textContent = formatCurrency(subtotal);
        transactionTotalInput.value = total.toFixed(2);
    }

    // Event listener untuk diskon
    transactionDiscountInput.addEventListener('input', calculateTotal);

    // Fungsi untuk menyimpan transaksi
async function saveTransaction(e) {
    e.preventDefault();
    
    // Validasi item
    if (transactionItems.length === 0) {
        showAlert('error', 'Transaksi harus memiliki minimal 1 item');
        return;
    }
    
    // Validasi tanggal
        if (!transactionModalDateInput.value) { // Sebelumnya: transactionDateInput
        showAlert('error', 'Tanggal transaksi harus diisi');
        return;
    }

    try {
        // Pastikan format tanggal sesuai dengan yang diinput user (YYYY-MM-DD)
        const transactionDate = transactionModalDateInput.value; 
        console.log('Tanggal yang akan dikirim:', transactionDate); // Debugging

        const transactionData = {
            customer: transactionCustomerSelect.value,
            transactionDate: transactionDate,
            items: transactionItems.map(item => ({
                productId: item.productId,
                price: item.price,
                quantity: item.quantity
            })),
            discount: parseFloat(transactionDiscountInput.value) || 0,
            paymentMethod: transactionPaymentSelect.value,
            no_invoice: transactionInvoiceInput.value
        };
        
        console.log('Data lengkap yang dikirim:', transactionData); // Debugging
        
        const url = currentTransactionId 
            ? `http://localhost:3000/api/transaksi/${currentTransactionId}`
            : 'http://localhost:3000/api/transaksi';
            
        const response = await fetch(url, {
            method: currentTransactionId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('success', currentTransactionId ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil dibuat');
            transactionModal.style.display = 'none';
            loadTransactions();
        } else {
            throw new Error(data.message || 'Gagal menyimpan transaksi');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showAlert('error', error.message);
    }
}


const API_URL = 'http://localhost:3000/api';

    // Fungsi untuk melihat detail transaksi
async function viewTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/transaksi/${id}`);
        const transaction = await response.json();
        
        if (response.ok) {
            // Isi detail modal dengan data transaksi
            if (detailInvoiceSpan) detailInvoiceSpan.textContent = transaction.no_invoice;
            if (detailDateSpan) detailDateSpan.textContent = formatDate(transaction.tanggal_penjualan);
            if (detailCustomerSpan) detailCustomerSpan.textContent = transaction.nama_pelanggan || '-';
            if (detailTypeSpan) detailTypeSpan.textContent = 'Penjualan';
            if (detailPaymentSpan) detailPaymentSpan.textContent = capitalizeFirstLetter(transaction.metode_pembayaran);
            
            // Isi item transaksi
            if (detailItemsBody) {
                detailItemsBody.innerHTML = '';
                transaction.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.nama_produk}</td>
                        <td>${item.kode_produk}</td>
                        <td>${item.berat}</td>
                        <td>${formatCurrency(item.harga_satuan)}</td>
                        <td>${item.jumlah}</td>
                        <td>${formatCurrency(item.subtotal)}</td>
                    `;
                    detailItemsBody.appendChild(row);
                });
            }
            
            // Hitung total
            const subtotal = transaction.items.reduce((sum, item) => sum + item.subtotal, 0);
            const discount = transaction.diskon || 0;
            const total = subtotal - discount;
            
            if (detailSubtotalSpan) detailSubtotalSpan.textContent = formatCurrency(subtotal);
            if (detailDiscountSpan) detailDiscountSpan.textContent = formatCurrency(discount);
            if (detailTotalSpan) detailTotalSpan.textContent = formatCurrency(total);
            
            // Isi catatan jika ada
            if (detailNotesP) detailNotesP.textContent = transaction.catatan || 'Tidak ada catatan';
            
            // Tampilkan modal
            if (detailModal) detailModal.style.display = 'block';
        } else {
            throw new Error(transaction.message || 'Gagal memuat detail transaksi');
        }
    } catch (error) {
        console.error('Error viewing transaction:', error);
        showAlert('error', error.message);
    }
}

    // Fungsi untuk mengedit transaksi
async function editTransaction(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/transaksi/${id}`);
        const transaction = await response.json();
        
        if (response.ok) {
            currentTransactionId = transaction.id_penjualan;
            transactionItems = transaction.items.map(item => ({
                productId: item.id_produk,
                productName: item.nama_produk,
                productCode: item.kode_produk,
                weight: item.berat,
                price: item.harga_satuan,
                quantity: item.jumlah,
                subtotal: item.subtotal
            }));
            
            // Isi form dengan data transaksi
            transactionIdInput.value = transaction.id_penjualan;
            transactionInvoiceInput.value = transaction.no_invoice;
            
            // Pastikan format tanggal sesuai dengan input date (YYYY-MM-DD)
            const transactionDate = new Date(transaction.tanggal_penjualan);
            const formattedDate = transactionDate.toISOString().split('T')[0];
            transactionModalDateInput.value = formattedDate;
            
            transactionCustomerSelect.value = transaction.id_pelanggan;
            transactionPaymentSelect.value = transaction.metode_pembayaran;
            transactionDiscountInput.value = transaction.diskon || 0;
            transactionTotalInput.value = transaction.total_bayar;
            
            // Render items
            renderTransactionItems();
            
            // Set modal title
            document.getElementById('casss-transaction-modal-title').textContent = 'Edit Transaksi';
            
            // Show modal
            transactionModal.style.display = 'block';
        } else {
            throw new Error(transaction.message || 'Gagal memuat data transaksi');
        }
    } catch (error) {
        console.error('Error editing transaction:', error);
        showAlert('error', error.message);
    }
}



    // Fungsi untuk menampilkan konfirmasi hapus
    function showDeleteConfirmation(id) {
        currentTransactionId = id;
        confirmModal.style.display = 'block';
    }

    // Fungsi untuk menghapus transaksi
    async function confirmDeleteTransaction() {
    try {
        const response = await fetch(`http://localhost:3000/api/transaksi/${currentTransactionId}`, {
            method: 'DELETE'
        });
        
        // Jika response tidak OK, baca error dari response JSON
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Gagal menghapus transaksi');
        }

        const data = await response.json(); // response sudah OK, parse JSON

        showAlert('success', 'Transaksi berhasil dihapus');
        confirmModal.style.display = 'none';
        loadTransactions();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showAlert('error', error.message);
    }
}


    // Fungsi untuk export transaksi
    function exportTransactions() {
        // Implementasi export ke Excel atau CSV
        showAlert('info', 'Fitur export akan segera tersedia');
    }

    // Fungsi untuk mencetak detail transaksi
    function printTransactionDetail() {
        window.print();
    }

    // Helper functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function getStatusClass(status) {
        switch (status) {
            case 'lunas': return 'paid';
            case 'pending': return 'pending';
            case 'hutang': return 'debt';
            default: return '';
        }
    }

    function showAlert(type, message) {
        const alert = document.createElement('div');
        alert.className = `casss-alert casss-${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
});







// Purchase Transaction Module
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = 'http://localhost:3000/api/purchases';
    const ITEMS_PER_PAGE = 10;
    
    // State variables
    let currentPage = 1;
    let purchaseTransactions = [];
    let suppliers = [];
    let products = [];
    let currentTransactionId = null;
    let transactionItems = [];
    
    // DOM Elements
    const transactionTableBody = document.getElementById('purchsss-transaction-body');
    const transactionSearch = document.getElementById('purchsss-transaction-search');
    const transactionSupplierFilter = document.getElementById('purchsss-form-transaction-supplier');
    const transactionDateFilter = document.getElementById('purchsss-transaction-date');
    const addTransactionBtn = document.getElementById('purchsss-add-transaction');
    const exportTransactionBtn = document.getElementById('purchsss-export-transaction');
    const prevPageBtn = document.getElementById('purchsss-transaction-prev');
    const nextPageBtn = document.getElementById('purchsss-transaction-next');
    const pageInfo = document.getElementById('purchsss-transaction-page-info');
    const totalTransactionsSpan = document.getElementById('purchsss-total-transactions');
    const totalExpenseSpan = document.getElementById('purchsss-total-expense');
    const todayTransactionsSpan = document.getElementById('purchsss-today-transactions');
    
    // Modal Elements
    const transactionModal = document.getElementById('purchsss-transaction-modal');
    const transactionForm = document.getElementById('purchsss-transaction-form');
    const transactionIdInput = document.getElementById('purchsss-transaction-id');
    const transactionNumberInput = document.getElementById('purchsss-transaction-number');
    const transactionDateInput = document.getElementById('purchsss-transaction-date');
    const transactionSupplierSelect = document.getElementById('purchsss-transaction-supplier');
    const transactionPaymentSelect = document.getElementById('purchsss-transaction-payment');
    const transactionTotalInput = document.getElementById('purchsss-transaction-total');
    const transactionItemsContainer = document.getElementById('purchsss-transaction-items');
    const itemsTotalSpan = document.getElementById('purchsss-items-total');
    const addItemBtn = document.getElementById('purchsss-add-item');
    
    // Item Modal Elements
    const itemModal = document.getElementById('purchsss-item-modal');
    const itemForm = document.getElementById('purchsss-item-form');
    const itemProductSelect = document.getElementById('purchsss-item-product');
    const itemCodeInput = document.getElementById('purchsss-item-code');
    const itemWeightInput = document.getElementById('purchsss-item-weight');
    const itemPriceInput = document.getElementById('purchsss-item-price');
    const itemQuantityInput = document.getElementById('purchsss-item-quantity');
    
    // Detail Modal Elements
    const detailModal = document.getElementById('purchsss-detail-modal');
    const detailNumberSpan = document.getElementById('purchsss-detail-number');
    const detailDateSpan = document.getElementById('purchsss-detail-date');
    const detailSupplierSpan = document.getElementById('purchsss-detail-supplier');
    const detailStatusSpan = document.getElementById('purchsss-detail-status');
    const detailPaymentSpan = document.getElementById('purchsss-detail-payment');
    const detailItemsBody = document.getElementById('purchsss-detail-items-body');
    const detailTotalSpan = document.getElementById('purchsss-detail-total');
    const detailNotesP = document.getElementById('purchsss-detail-notes');
    const printDetailBtn = document.getElementById('purchsss-print-detail');
    const closeDetailBtn = document.getElementById('purchsss-close-detail');
    
    // Confirm Modal Elements
    const confirmModal = document.getElementById('purchsss-transaction-confirm-modal');
    const confirmDeleteBtn = document.getElementById('purchsss-confirm-transaction-delete');
    const cancelDeleteBtn = document.getElementById('purchsss-cancel-transaction-delete');
    
    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.purchsss-close-modal, .purchsss-form-cancel');
    
    // Helper Functions
    const formatCurrency = (amount) => {
        return 'Rp ' + amount.toLocaleString('id-ID');
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID');
    };
    
    const showAlert = (type, message) => {
        const alert = document.createElement('div');
        alert.className = `purchsss-alert purchsss-${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
    };
    
    const debounce = (func, wait) => {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    };
    
    // API Functions
    const loadPurchaseTransactions = async () => {
        try {
            console.log('Loading purchase transactions...'); 
            const search = transactionSearch?.value || '';
            const supplier = transactionSupplierFilter?.value || 'all';
            const date = transactionDateFilter?.value || '';
            
            let url = `${API_BASE_URL}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
            if (search) url += `&search=${search}`;
            if (supplier !== 'all') url += `&supplier=${supplier}`;
            if (date) url += `&date=${date}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            purchaseTransactions = data.transactions || [];
            renderPurchaseTransactions();
            updatePagination(data.pagination);
            
            // Load summary separately
            const summaryResponse = await fetch(`${API_BASE_URL}/summary`);
            if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                if (totalTransactionsSpan) totalTransactionsSpan.textContent = summaryData.totalPurchases || 0;
                if (todayTransactionsSpan) todayTransactionsSpan.textContent = summaryData.todayPurchases || 0;
                if (totalExpenseSpan) totalExpenseSpan.textContent = formatCurrency(summaryData.totalExpense || 0);
            }
        } catch (error) {
            console.error('Error loading purchase transactions:', error);
            showAlert('error', 'Gagal memuat data transaksi pembelian');
        }
    };
    
    const loadSuppliers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/suppliers/list`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            suppliers = await response.json();
            
            // Update supplier dropdowns if elements exist
            if (transactionSupplierSelect) {
                transactionSupplierSelect.innerHTML = '<option value="">Pilih Supplier</option>';
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    transactionSupplierSelect.appendChild(option);
                });
            }
            
            if (transactionSupplierFilter) {
                transactionSupplierFilter.innerHTML = '<option value="all">Semua Supplier</option>';
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    transactionSupplierFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
            showAlert('error', 'Gagal memuat data supplier');
        }
    };
    
    const loadProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/list`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            products = await response.json();
            
            // Update product dropdown if element exists
            if (itemProductSelect) {
                itemProductSelect.innerHTML = '<option value="">Pilih Produk</option>';
                products.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} (${product.code})`;
                    option.dataset.code = product.code;
                    option.dataset.weight = product.weight;
                    option.dataset.price = product.purchase_price;
                    itemProductSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading products:', error);
            showAlert('error', 'Gagal memuat data produk');
        }
    };
    
    // Render Functions
    const renderPurchaseTransactions = () => {
    if (!transactionTableBody) {
        console.error('Transaction table body not found!');
        return;
    }
    
    transactionTableBody.innerHTML = '';
    
    if (purchaseTransactions.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="purchsss-text-center">Tidak ada data transaksi pembelian</td>`;
        transactionTableBody.appendChild(row);
        return;
    }
    
    purchaseTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.purchase_number}</td>
            <td>${formatDate(transaction.purchase_date)}</td>
            <td>${transaction.supplier_name}</td>
            <td>${formatCurrency(transaction.total_amount)}</td>
            <td>
                <button class="purchsss-action-btn purchsss-view-btn" data-id="${transaction.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="purchsss-action-btn purchsss-edit-btn" data-id="${transaction.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="purchsss-action-btn purchsss-delete-btn" data-id="${transaction.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        transactionTableBody.appendChild(row);
    });
    
    setupActionButtons();
};
    
    const updatePagination = (pagination) => {
        if (!pageInfo || !prevPageBtn || !nextPageBtn) return;
        
        const { total, page, limit, totalPages } = pagination;
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        
        pageInfo.textContent = `Menampilkan ${start}-${end} dari ${total} pembelian`;
        prevPageBtn.disabled = page === 1;
        nextPageBtn.disabled = page === totalPages;
    };
    
    // Event Handlers
   const setupActionButtons = () => {
    console.log('Setting up action buttons...');
    
    // View buttons
    document.querySelectorAll('.purchsss-view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewPurchaseTransaction(btn.dataset.id));
    });
    
    // Edit buttons
    document.querySelectorAll('.purchsss-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editPurchaseTransaction(btn.dataset.id));
    });
    
    // Delete buttons
    document.querySelectorAll('.purchsss-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (btn.dataset.id) {
                showDeleteConfirmation(btn.dataset.id);
            } else {
                console.error('Delete button has no data-id attribute');
            }
        });
    });
};
    
    const setupEventListeners = () => {
        if (transactionSearch) {
            transactionSearch.addEventListener('input', debounce(loadPurchaseTransactions, 300));
        }
        
        if (transactionSupplierFilter) {
            transactionSupplierFilter.addEventListener('change', loadPurchaseTransactions);
        }
        
        if (transactionDateFilter) {
            transactionDateFilter.addEventListener('change', loadPurchaseTransactions);
        }
        
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', openAddPurchaseModal);
        }
        
        if (exportTransactionBtn) {
            exportTransactionBtn.addEventListener('click', exportPurchaseTransactions);
        }
        
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', goToPrevPage);
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', goToNextPage);
        }
        
        if (transactionForm) {
            transactionForm.addEventListener('submit', savePurchaseTransaction);
        }
        
        if (addItemBtn) {
            addItemBtn.addEventListener('click', openAddItemModal);
        }
        
        if (itemForm) {
            itemForm.addEventListener('submit', addItemToPurchase);
        }
        
        if (itemProductSelect) {
            itemProductSelect.addEventListener('change', updateProductDetails);
        }
        
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => {
                if (detailModal) detailModal.style.display = 'none';
            });
        }
        
        if (confirmDeleteBtn && cancelDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', confirmDeletePurchase);
            cancelDeleteBtn.addEventListener('click', () => {
                if (confirmModal) confirmModal.style.display = 'none';
            });
        }
        
        closeModalButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.purchsss-modal');
                if (modal) modal.style.display = 'none';
            });
        });
    };
    
    // Transaction Functions
    const openAddPurchaseModal = () => {
        if (!transactionModal) return;
        
        currentTransactionId = null;
        transactionItems = [];
        
        // Reset form
        if (transactionForm) transactionForm.reset();
        if (transactionIdInput) transactionIdInput.value = '';
        if (transactionNumberInput) transactionNumberInput.value = generatePurchaseNumber();
        if (transactionDateInput) transactionDateInput.value = new Date().toISOString().split('T')[0];
        if (transactionItemsContainer) transactionItemsContainer.innerHTML = '';
        if (itemsTotalSpan) itemsTotalSpan.textContent = 'Rp 0';
        if (transactionTotalInput) transactionTotalInput.value = '0';
        
        // Set modal title
        const modalTitle = document.getElementById('purchsss-transaction-modal-title');
        if (modalTitle) modalTitle.textContent = 'Tambah Pembelian Baru';
        
        // Show modal
        transactionModal.style.display = 'block';
    };
    
    const generatePurchaseNumber = () => {
        const prefix = 'PBL';
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        
        return `${prefix}-${year}${month}${day}-${random}`;
    };
    
    const openAddItemModal = () => {
        if (!itemModal) return;
        
        // Reset form
        if (itemForm) itemForm.reset();
        if (itemCodeInput) itemCodeInput.value = '';
        if (itemWeightInput) itemWeightInput.value = '';
        if (itemPriceInput) itemPriceInput.value = '';
        if (itemQuantityInput) itemQuantityInput.value = '1';
        
        // Show modal
        itemModal.style.display = 'block';
    };
    
    const updateProductDetails = () => {
        if (!itemProductSelect || !itemCodeInput || !itemWeightInput || !itemPriceInput) return;
        
        const selectedOption = itemProductSelect.options[itemProductSelect.selectedIndex];
        if (selectedOption.value) {
            itemCodeInput.value = selectedOption.dataset.code || '';
            itemWeightInput.value = selectedOption.dataset.weight || '';
            itemPriceInput.value = selectedOption.dataset.price || '';
        } else {
            itemCodeInput.value = '';
            itemWeightInput.value = '';
            itemPriceInput.value = '';
        }
    };
    
    const addItemToPurchase = (e) => {
        e.preventDefault();
        
        if (!itemProductSelect || !itemCodeInput || !itemWeightInput || !itemPriceInput || !itemQuantityInput) return;
        
        const productId = itemProductSelect.value;
        const productName = itemProductSelect.options[itemProductSelect.selectedIndex].text;
        const productCode = itemCodeInput.value;
        const weight = parseFloat(itemWeightInput.value) || 0;
        const price = parseFloat(itemPriceInput.value) || 0;
        const quantity = parseInt(itemQuantityInput.value) || 1;
        
        // Validation
        if (!productId) {
            showAlert('error', 'Silakan pilih produk');
            return;
        }
        
        if (quantity <= 0) {
            showAlert('error', 'Quantity harus lebih dari 0');
            return;
        }
        
        // Add item
        const item = {
            productId,
            productName,
            productCode,
            weight,
            price,
            quantity,
            subtotal: price * quantity
        };
        
        transactionItems.push(item);
        calculatePurchaseTotal();
        
        // Close modal
        if (itemModal) itemModal.style.display = 'none';
    };
    
    function renderPurchaseItems() {
    if (!transactionItemsContainer) return;
    
    transactionItemsContainer.innerHTML = '';
    
    if (transactionItems.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="casss-text-center">Belum ada item</td>`;
        transactionItemsContainer.appendChild(row);
        return;
    }
    
    transactionItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.productCode}</td>
            <td>${item.weight}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.subtotal)}</td>
                <td>
        <button class="purchsss-action-btn purchsss-edit-btn" data-index="${index}">
            <i class="fas fa-edit"></i>
        </button>
        <button class="purchsss-action-btn purchsss-delete-btn" data-index="${index}">
            <i class="fas fa-trash"></i>
        </button>
    </td>
        `;
        transactionItemsContainer.appendChild(row);
    });
    
    // Setup event listeners
    setupItemActionButtons();
    calculatePurchaseTotal();
}
    
    const editPurchaseItem = (index) => {
        const item = transactionItems[index];
        
        // Fill form with item data
        if (itemProductSelect) itemProductSelect.value = item.productId;
        if (itemCodeInput) itemCodeInput.value = item.productCode;
        if (itemWeightInput) itemWeightInput.value = item.weight;
        if (itemPriceInput) itemPriceInput.value = item.price;
        if (itemQuantityInput) itemQuantityInput.value = item.quantity;
        
        // Show modal
        if (itemModal) itemModal.style.display = 'block';
        
        // Remove the item if saved again
        transactionItems.splice(index, 1);
    };
    
    const deletePurchaseItem = (index) => {
    transactionItems.splice(index, 1);
    renderPurchaseItems(); // Refresh the display after deletion
    calculatePurchaseTotal(); // Recalculate the total
};
    
    const calculatePurchaseTotal = () => {
        const total = transactionItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        if (itemsTotalSpan) itemsTotalSpan.textContent = formatCurrency(total);
        if (transactionTotalInput) transactionTotalInput.value = total.toFixed(2);
    };
    
 const savePurchaseTransaction = async (e) => {
    e.preventDefault();
    
    // Validasi
    if (transactionItems.length === 0) {
        showAlert('error', 'Transaksi pembelian harus memiliki minimal 1 item');
        return;
    }
    
    if (!transactionSupplierSelect?.value) {
        showAlert('error', 'Silakan pilih supplier');
        return;
    }
    const purchaseData = {
        purchase_number: transactionNumberInput?.value || '',
        purchase_date: transactionDateInput?.value || '',
        supplier_id: transactionSupplierSelect.value,
        items: transactionItems.map(item => ({
            product_id: item.productId,
            purchase_price: item.price,
            quantity: item.quantity,
            weight: item.weight
        })),
        total_amount: parseFloat(transactionTotalInput?.value || 0),
        payment_method: document.getElementById('purchsss-transaction-payment')?.value || 'tunai'
    };
    
    console.log('Data to be sent:', purchaseData); // Debug log
    
    try {
        const url = currentTransactionId 
            ? `${API_BASE_URL}/${currentTransactionId}`
            : API_BASE_URL;
            
        const method = currentTransactionId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData)
        });
                const responseData = await response.json();
        console.log('Response:', responseData); 
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        
        showAlert('success', 
            currentTransactionId 
                ? 'Pembelian berhasil diperbarui' 
                : 'Pembelian berhasil dibuat');
                
        if (transactionSearch) transactionSearch.value = '';
        if (transactionSupplierFilter) transactionSupplierFilter.value = 'all';
        if (transactionDateFilter) transactionDateFilter.value = '';

        currentPage = 1;

        if (transactionModal) transactionModal.style.display = 'none';
        await loadPurchaseTransactions();
        
    } catch (error) {
        console.error('Save transaction error:', {
            error: error.message,
            stack: error.stack,
            data: purchaseData
        });
        showAlert('error', `Gagal menyimpan: ${error.message}`);
    }
};
    
    const viewPurchaseTransaction = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const transaction = await response.json();
            
            // Fill detail modal
            if (detailNumberSpan) detailNumberSpan.textContent = transaction.purchase_number;
            if (detailDateSpan) detailDateSpan.textContent = formatDate(transaction.purchase_date);
            if (detailSupplierSpan) detailSupplierSpan.textContent = transaction.supplier_name;
            // Fill items
            if (detailItemsBody) {
                detailItemsBody.innerHTML = '';
                transaction.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.product_name}</td>
                        <td>${item.product_code}</td>
                        <td>${item.weight}</td>
                        <td>${formatCurrency(item.purchase_price)}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.subtotal)}</td>
                    `;
                    detailItemsBody.appendChild(row);
                });
            }
            
            // Update total
            if (detailTotalSpan) {
                const total = transaction.items.reduce((sum, item) => sum + item.subtotal, 0);
                detailTotalSpan.textContent = formatCurrency(total);
            }
            
            // Show modal
            if (detailModal) detailModal.style.display = 'block';
        } catch (error) {
            console.error('Error viewing purchase transaction:', error);
            showAlert('error', 'Gagal memuat detail transaksi pembelian');
        }
    };
    
const editPurchaseTransaction = async (id) => {
    try {
        // 1. Fetch transaction data
        const response = await fetch(`${API_BASE_URL}/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const transaction = await response.json();
        
        // 2. Set current transaction data
        currentTransactionId = transaction.id;
        transactionItems = transaction.items.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            productCode: item.product_code,
            weight: item.weight,
            price: item.purchase_price,
            quantity: item.quantity,
            subtotal: item.purchase_price * item.quantity
        }));
        
        // 3. Fill form with transaction data
        if (transactionIdInput) transactionIdInput.value = transaction.id;
        if (transactionNumberInput) transactionNumberInput.value = transaction.purchase_number;
        if (transactionDateInput) transactionDateInput.value = transaction.purchase_date.split('T')[0];
        if (transactionSupplierSelect) transactionSupplierSelect.value = transaction.supplier_id;
        if (transactionPaymentSelect) transactionPaymentSelect.value = transaction.payment_method || 'tunai';
        if (transactionTotalInput) transactionTotalInput.value = transaction.total_amount;
        
        // 4. Render transaction items
        renderPurchaseItems();
        
        // 5. Set modal title and show
        const modalTitle = document.getElementById('purchsss-transaction-modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Pembelian';
        
        if (transactionModal) transactionModal.style.display = 'block';
        
    } catch (error) {
        console.error('Error editing purchase transaction:', error);
        showAlert('error', 'Gagal memuat data transaksi pembelian');
    }
};
    
    const showDeleteConfirmation = (id) => {
    if (!id) {
        console.error('No transaction ID provided for deletion');
        return;
    }
    currentTransactionId = id;
    if (confirmModal) confirmModal.style.display = 'block';
};

    function setupItemActionButtons() {
    // Edit buttons for items
    document.querySelectorAll('.casss-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.dataset.index);
            if (!isNaN(index)) {
                editPurchaseItem(index);
            }
        });
    });

    // Delete buttons for items
    document.querySelectorAll('.casss-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(btn.dataset.index);
            if (!isNaN(index)) {
                deletePurchaseItem(index);
            }
        });
    });
}
const confirmDeletePurchase = async () => {
    if (!currentTransactionId) {
        showAlert('error', 'Tidak ada transaksi yang dipilih untuk dihapus');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${currentTransactionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('success', 'Transaksi pembelian berhasil dihapus');
            if (confirmModal) confirmModal.style.display = 'none';
            loadPurchaseTransactions();
        } else {
            throw new Error('Gagal menghapus transaksi pembelian');
        }
    } catch (error) {
        console.error('Error deleting purchase transaction:', error);
        showAlert('error', error.message);
    }
};

    
    const exportPurchaseTransactions = () => {
        showAlert('info', 'Fitur export akan segera tersedia');
    };
    
    const goToPrevPage = () => {
        if (currentPage > 1) {
            currentPage--;
            loadPurchaseTransactions();
        }
    };
    
    const goToNextPage = () => {
        currentPage++;
        loadPurchaseTransactions();
    };
    
    // Initialize
    const initialize = async () => {
        try {
            await loadSuppliers();
            await loadProducts();
            await loadPurchaseTransactions();
            setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            showAlert('error', 'Gagal memuat data awal');
        }
    };
    
    initialize();
});









// Inventory Control CRUD Operations
document.addEventListener('DOMContentLoaded', function() {
    // ... (kode sebelumnya)
    const API_BASE_URL = 'http://localhost:3000';
    // Data contoh produk (akan diganti dengan data dari database)
    let inventoryProducts = [  ];
    
    let currentInventoryPage = 1;
    const productsPerPage = 5;
    let currentProductId = null;
    
    // Elemen DOM
    const inventoryBody = document.getElementById('casss-inventory-body');
    const inventorySearch = document.getElementById('casss-inventory-search');
    const categoryFilter = document.getElementById('casss-category-filter');
    const stockFilter = document.getElementById('casss-stock-filter');
    const addProductBtn = document.getElementById('casss-add-product');
    const productModal = document.getElementById('casss-product-modal');
    const productForm = document.getElementById('casss-product-form');
    const productModalTitle = document.getElementById('casss-product-modal-title');
    const confirmProductModal = document.getElementById('casss-inventory-confirm-modal');
    const prevInventoryPageBtn = document.getElementById('casss-inventory-prev');
    const nextInventoryPageBtn = document.getElementById('casss-inventory-next');
    const inventoryPageInfo = document.getElementById('casss-inventory-page-info');
    
async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products');
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    
    // Konversi data ke format yang benar
    inventoryProducts = data.map(product => ({
      id: product.id,
      code: product.code,
      name: product.name,
      weight: parseFloat(product.weight), // Konversi string ke number
      buyPrice: parseFloat(product.buyPrice),
      sellPrice: parseFloat(product.sellPrice),
      stock: parseInt(product.stock),
      description: product.description,
      category: product.category
    }));
    renderInventory();
  } catch (error) {
    console.error('Error:', error);
    inventoryBody.innerHTML = `
      <tr>
        <td colspan="8" class="casss-table-data casss-no-data">Error: ${error.message}</td>
      </tr>
    `;
  }
}

    // Render tabel inventory
    function renderInventory(data = inventoryProducts) {
        inventoryBody.innerHTML = '';

        // Filter data
        let filteredData = [...data];
        const searchTerm = inventorySearch.value.toLowerCase();
        const category = categoryFilter.value;
        const stockStatus = stockFilter.value;
        if (searchTerm) {
            filteredData = filteredData.filter(product => 
                product.code.toLowerCase().includes(searchTerm) || 
                product.name.toLowerCase().includes(searchTerm)
            );
        }
                if (stockStatus === 'low') {
    filteredData = filteredData.filter(product => product.stock > 0 && product.stock <= 20); // Ubah dari 5 menjadi 20
} else if (stockStatus === 'out') {
    filteredData = filteredData.filter(product => product.stock === 0);
}
        if (category !== 'all') {
    filteredData = filteredData.filter(product => {
        // Buat mapping antara nilai dropdown dan data
        const categoryMapping = {
            'cincin': 'Cincin',
            'kalung': 'Kalung',
            'gelang': 'Gelang',
            'anting': 'Anting',
            'liontin': 'Liontin'
        };
        
        // Dapatkan nilai yang sesuai dari mapping
        const expectedCategory = categoryMapping[category];
        
        // Bandingkan dengan kategori produk
        return product.category === expectedCategory;
    });
}
        
        const startIndex = (currentInventoryPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        if (paginatedData.length === 0) {
            inventoryBody.innerHTML = `
                <tr>
                    <td colspan="9" class="casss-table-data casss-no-data">Tidak ada produk yang ditemukan</td>
                </tr>
            `;
        } else {
            paginatedData.forEach(product => {
                const row = document.createElement('tr');
                
                // Tentukan class stok
 // Di dalam fungsi renderInventory(), modifikasi bagian penentuan kelas stok:
let stockClass = '';
let stockText = product.stock;

if (product.stock === 0) {
    stockClass = 'casss-out-of-stock';
    stockText = 'Habis';
} else if (product.stock <= 20) {  // Ubah menjadi satu kondisi untuk ≤20
    stockClass = 'casss-critical-stock';
    if (product.stock <= 5) {  // Untuk stok sangat rendah (≤5)
        stockClass += ' casss-very-low-stock'; // Bisa tambah class khusus
    }
}               
                row.innerHTML = `
                    <td class="casss-table-data">${product.code}</td>
                    <td class="casss-table-data">${product.name}</td>
                    <td class="casss-table-data">${formatCategory(product.category)}</td>
                    <td class="casss-table-data">${product.weight.toFixed(2)}</td>
                    <td class="casss-table-data ${stockClass}">${stockText}</td>
                    <td class="casss-table-data">${formatCurrency(product.buyPrice)}</td>
                    <td class="casss-table-data">${formatCurrency(product.sellPrice)}</td>
                    <td class="casss-table-data casss-actions">
                        <button class="casss-action-icon casss-edit-icon" data-id="${product.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="casss-action-icon casss-delete-icon" data-id="${product.id}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                inventoryBody.appendChild(row);
            });
        }
        
        // Update pagination info
        const totalProducts = filteredData.length;
        const startProduct = totalProducts > 0 ? startIndex + 1 : 0;
        const endProduct = Math.min(endIndex, totalProducts);
        
        inventoryPageInfo.textContent = `Menampilkan ${startProduct}-${endProduct} dari ${totalProducts} produk`;
        prevInventoryPageBtn.disabled = currentInventoryPage === 1;
        nextInventoryPageBtn.disabled = currentInventoryPage === Math.ceil(totalProducts / productsPerPage);
        
        // Tambahkan event listener untuk edit dan delete
        document.querySelectorAll('.casss-edit-icon').forEach(btn => {
            btn.addEventListener('click', handleEditProduct);
        });
        
        document.querySelectorAll('.casss-delete-icon').forEach(btn => {
            btn.addEventListener('click', handleDeleteProductClick);
        });
    }
    
    // Format kategori untuk tampilan
    function formatCategory(category) {
    const lowerCategory = category.toLowerCase();
    const categories = {
        'cincin': 'Cincin',
        'kalung': 'Kalung',
        'gelang': 'Gelang',
        'anting': 'Anting',
        'liontin': 'Liontin',
        'lainnya': 'Lainnya'
    };
    return categories[lowerCategory] || category;
}
    
    // Format mata uang
    function formatCurrency(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }
    
    // Filter produk
    function filterProducts() {
        currentInventoryPage = 1;
        renderInventory();
    }
    
    // Buka modal tambah produk
    function openAddProductModal() {
        currentProductId = null;
        productModalTitle.textContent = 'Tambah Produk Baru';
        productForm.reset();
        document.getElementById('casss-product-id').value = '';
        productModal.style.display = 'block';
    }
    
    // Buka modal edit produk
    function handleEditProduct(e) {
        const productId = parseInt(e.currentTarget.getAttribute('data-id'));
        const product = inventoryProducts.find(p => p.id === productId);
        
        if (product) {
            currentProductId = productId;
            productModalTitle.textContent = 'Edit Produk';
            document.getElementById('casss-product-id').value = product.id;
            document.getElementById('casss-product-code').value = product.code;
            document.getElementById('casss-product-name').value = product.name;
            document.getElementById('casss-product-category').value = product.category;
            document.getElementById('casss-product-weight').value = product.weight;
            document.getElementById('casss-product-stock').value = product.stock;
            document.getElementById('casss-product-buy-price').value = product.buyPrice;
            document.getElementById('casss-product-sell-price').value = product.sellPrice;
            document.getElementById('casss-product-description').value = product.description || '';
            productModal.style.display = 'block';
        }
    }
    
    // Konfirmasi hapus produk
    function handleDeleteProductClick(e) {
        currentProductId = parseInt(e.currentTarget.getAttribute('data-id'));
        confirmProductModal.style.display = 'block';
    }
    
    // Submit form produk
    function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const productData = {
        code: document.getElementById('casss-product-code').value,
        name: document.getElementById('casss-product-name').value,
        category: document.getElementById('casss-product-category').value,
        weight: parseFloat(document.getElementById('casss-product-weight').value),
        stock: parseInt(document.getElementById('casss-product-stock').value),
        buyPrice: parseInt(document.getElementById('casss-product-buy-price').value),
        sellPrice: parseInt(document.getElementById('casss-product-sell-price').value),
        description: document.getElementById('casss-product-description').value
    };
    
    const url = currentProductId 
        ? `http://localhost:3000/api/products/${currentProductId}`
        : 'http://localhost:3000/api/products';
        
    const method = currentProductId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
    })
    .then(async response => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Terjadi kesalahan');
        }
        return data;
    })
    .then(data => {
        // Pastikan data yang diterima sesuai format
        const newProduct = {
    id: data.id || currentProductId || Math.max(0, ...inventoryProducts.map(p => p.id)) + 1,
    ...productData
};

        
        if (currentProductId) {
            // Update existing product
            const index = inventoryProducts.findIndex(p => p.id === currentProductId);
            if (index !== -1) {
                inventoryProducts[index] = newProduct;
            }
        } else {
            // Add new product (tambahkan di awal array)
            inventoryProducts.unshift(newProduct);
        }
        
        renderInventory();
        closeProductModal();
        alert('Produk berhasil disimpan!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Gagal menyimpan produk: ${error.message}`);
    });
}
    
    // Hapus produk
    function handleDeleteProduct() {
        inventoryProducts = inventoryProducts.filter(product => product.id !== currentProductId);
        
        // Di sini Anda akan mengirim permintaan DELETE ke server
        fetch(`http://localhost:3000/api/products/${currentProductId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                inventoryProducts = inventoryProducts.filter(product => product.id !== currentProductId);
                renderInventory();
                closeProductModal();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

        
        // Untuk contoh, kita update UI langsung
        renderInventory();
        closeProductModal();
    }
    
    // Tutup modal produk
    function closeProductModal() {
        productModal.style.display = 'none';
        confirmProductModal.style.display = 'none';
        currentProductId = null;
    }
    
    // Fungsi untuk menampilkan modal konfirmasi
function showConfirmModal(message, callback) {
    const modal = document.getElementById('casss-confirm-modal');
    const messageEl = document.querySelector('.casss-confirm-message');
    const confirmBtn = document.getElementById('casss-confirm-delete');
    const cancelBtn = document.getElementById('casss-cancel-delete');

    // Set pesan konfirmasi
    messageEl.textContent = message || 'Apakah Anda yakin ingin melanjutkan?';

    // Tampilkan modal
    modal.style.display = 'flex';

    // Event listeners untuk tombol
    confirmBtn.onclick = function() {
        callback(true);
        modal.style.display = 'none';
    };

    cancelBtn.onclick = function() {
        callback(false);
        modal.style.display = 'none';
    };

    // Tutup modal ketika klik di luar area konten
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}


    // Event listeners
    inventorySearch.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    stockFilter.addEventListener('change', filterProducts);
    addProductBtn.addEventListener('click', openAddProductModal);
    productForm.addEventListener('submit', handleProductFormSubmit);
    
    document.querySelectorAll('.casss-close-modal').forEach(btn => {
        btn.addEventListener('click', closeProductModal);
    });
    
    document.querySelector('.casss-form-cancel').addEventListener('click', closeProductModal);
    document.getElementById('casss-confirm-product-delete').addEventListener('click', handleDeleteProduct);
    document.getElementById('casss-cancel-product-delete').addEventListener('click', closeProductModal);
    
    prevInventoryPageBtn.addEventListener('click', () => {
        if (currentInventoryPage > 1) {
            currentInventoryPage--;
            renderInventory();
        }
    });
    
    nextInventoryPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(inventoryProducts.length / productsPerPage);
        if (currentInventoryPage < totalPages) {
            currentInventoryPage++;
            renderInventory();
        }
    });
    
    // Klik di luar modal untuk menutup
    window.addEventListener('click', (e) => {
        if (e.target === productModal || e.target === confirmProductModal) {
            closeProductModal();
        }
    });
    
fetchProducts();
});





//supplier
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const suppliersTable = document.getElementById('casss-suppliers-table');
  const suppliersBody = document.getElementById('casss-suppliers-body');
  const supplierSearch = document.getElementById('casss-supplier-search');
  const addSupplierBtn = document.getElementById('casss-add-supplier');
  const supplierModal = document.getElementById('casss-supplier-modal');
  const supplierForm = document.getElementById('casss-supplier-form');
  const supplierConfirmModal = document.getElementById('casss-supplier-confirm-modal');
  const prevBtn = document.getElementById('casss-suppliers-prev');
  const nextBtn = document.getElementById('casss-suppliers-next');
  const pageInfo = document.getElementById('casss-suppliers-page-info');
  
  // Variables
  let currentPage = 1;
  const itemsPerPage = 10;
  let suppliers = [];
  let totalSuppliers = 0;
  let supplierToDelete = null;
  
  // Initialize
  loadSuppliers();
  
  // Event Listeners
  supplierSearch.addEventListener('input', debounce(searchSuppliers, 300));
  addSupplierBtn.addEventListener('click', openAddSupplierModal);
  supplierForm.addEventListener('submit', handleSupplierSubmit);
  prevBtn.addEventListener('click', goToPrevPage);
  nextBtn.addEventListener('click', goToNextPage);
  
  // Modal close buttons
  document.querySelectorAll('.casss-close-modal, .casss-form-cancel').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  document.getElementById('casss-confirm-supplier-delete').addEventListener('click', confirmDeleteSupplier);
  document.getElementById('casss-cancel-supplier-delete').addEventListener('click', () => {
    supplierConfirmModal.style.display = 'none';
  });
  
  // Functions
 async function loadSuppliers() {
  try {
    const response = await fetch('http://localhost:3000/api/suppliers');
    if (!response.ok) throw new Error('Failed to fetch suppliers');
    
    suppliers = await response.json();
    totalSuppliers = suppliers.length;
    renderSuppliers();
    updatePagination();
  } catch (error) {
    console.error('Error loading suppliers:', error);
    showAlert('error', 'Gagal memuat data supplier');
  }
}
  
  async function searchSuppliers() {
    const query = supplierSearch.value.trim();
    
    if (query === '') {
      loadSuppliers();
      return;
    }
    
    try {
    const response = await fetch(`${API_BASE_URL}/api/suppliers/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      suppliers = await response.json();
      totalSuppliers = suppliers.length;
      currentPage = 1;
      renderSuppliers();
      updatePagination();
    } catch (error) {
      console.error('Error searching suppliers:', error);
      showAlert('error', 'Gagal melakukan pencarian');
    }
  }
  
  function renderSuppliers() {
    suppliersBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, suppliers.length);
    const paginatedSuppliers = suppliers.slice(startIndex, endIndex);
    
    if (paginatedSuppliers.length === 0) {
      suppliersBody.innerHTML = `
        <tr>
          <td colspan="5" class="casss-no-data">Tidak ada data supplier</td>
        </tr>
      `;
      return;
    }
    
    paginatedSuppliers.forEach(supplier => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${supplier.nama_supplier}</td>
        <td>${supplier.kontak_person || '-'}</td>
        <td>${supplier.telepon || '-'}</td>
        <td>${supplier.email || '-'}</td>
        <td class="casss-actions">
              <button class="casss-supplier-edit-btn" data-id="${supplier.id_supplier}">
    <i class="fas fa-edit"></i>
  </button>
          <button class="casss-delete-btn" data-id="${supplier.id_supplier}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      suppliersBody.appendChild(row);
    });
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.casss-supplier-edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('Edit supplier clicked:', btn.dataset.id);
    openEditSupplierModal(btn.dataset.id);
  });
});
    
    document.querySelectorAll('.casss-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });
  }
  
  function updatePagination() {
    const totalPages = Math.ceil(totalSuppliers / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalSuppliers);
    
    pageInfo.textContent = `Menampilkan ${startItem}-${endItem} dari ${totalSuppliers} supplier`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  }
  
  function goToPrevPage() {
    if (currentPage > 1) {
      currentPage--;
      renderSuppliers();
      updatePagination();
    }
  }
  
  function goToNextPage() {
    const totalPages = Math.ceil(totalSuppliers / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderSuppliers();
      updatePagination();
    }
  }
  
  function openAddSupplierModal() {
    document.getElementById('casss-supplier-modal-title').textContent = 'Tambah Supplier Baru';
    supplierForm.reset();
    document.getElementById('casss-supplier-id').value = '';
    supplierModal.style.display = 'block';
  }
  
  async function openEditSupplierModal(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch supplier');
      
      const supplier = await response.json();
      
      document.getElementById('casss-supplier-modal-title').textContent = 'Edit Supplier';
      document.getElementById('casss-supplier-id').value = supplier.id_supplier;
      document.getElementById('casss-supplier-name').value = supplier.nama_supplier;
      document.getElementById('casss-supplier-contact').value = supplier.kontak_person || '';
      document.getElementById('casss-supplier-phone').value = supplier.telepon || '';
      document.getElementById('casss-supplier-email').value = supplier.email || '';
      document.getElementById('casss-supplier-address').value = supplier.alamat || '';
      
      supplierModal.style.display = 'block';
    } catch (error) {
      console.error('Error fetching supplier:', error);
      showAlert('error', 'Gagal memuat data supplier');
    }
  }
  
async function handleSupplierSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('casss-supplier-id').value;
  const nama_supplier = document.getElementById('casss-supplier-name').value.trim();
  const kontak_person = document.getElementById('casss-supplier-contact').value.trim();
  const telepon = document.getElementById('casss-supplier-phone').value.trim();
  const email = document.getElementById('casss-supplier-email').value.trim();
  const alamat = document.getElementById('casss-supplier-address').value.trim();
  
  if (!nama_supplier) {
    showAlert('error', 'Nama supplier wajib diisi');
    return;
  }
  
  const supplierData = {
    nama_supplier,
    kontak_person: kontak_person || null,
    telepon: telepon || null,
    email: email || null,
    alamat: alamat || null,
  };
  
  try {
    let response;
    if (id) {
      // Update existing supplier
      response = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });
    } else {
      // Create new supplier
      response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      });
    }
    
    // Periksa status response terlebih dahulu
    if (!response.ok) {
      // Coba parsing error message
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Gagal menyimpan supplier (${response.status})`);
      } catch (e) {
        // Jika parsing error gagal, gunakan teks response
        const text = await response.text();
        throw new Error(text || `Gagal menyimpan supplier (${response.status})`);
      }
    }
    
    // Coba parsing response JSON
    const result = await response.json().catch(() => ({}));
    
    closeAllModals();
    loadSuppliers();
    showAlert('success', `Supplier berhasil ${id ? 'diperbarui' : 'ditambahkan'}`);
  } catch (error) {
    console.error('Error saving supplier:', error);
    showAlert('error', error.message || 'Gagal menyimpan supplier');
  }
}
  
  const supplierController = {
    // Get all suppliers
    getAllSuppliers: async (req, res) => {
      try {
        const [rows] = await pool.query('SELECT * FROM supplier ORDER BY nama_supplier ASC');
        res.json(rows);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
      }
    },
  
    // Search suppliers
    searchSuppliers: async (req, res) => {
      const { query } = req.query;
      try {
        const [rows] = await pool.query(
          'SELECT * FROM supplier WHERE nama_supplier LIKE ? OR kontak_person LIKE ? ORDER BY nama_supplier ASC',
          [`%${query}%`, `%${query}%`]
        );
        res.json(rows);
      } catch (err) {
        console.error('Error searching suppliers:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
      }
    },
  
    // Get single supplier
    getSupplierById: async (req, res) => {
      const { id } = req.params;
      try {
        const [rows] = await pool.query('SELECT * FROM supplier WHERE id_supplier = ?', [id]);
        if (rows.length === 0) {
          return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(rows[0]);
      } catch (err) {
        console.error('Error fetching supplier:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
      }
    },
  
    // Create new supplier
    createSupplier: async (req, res) => {
      const { nama_supplier, alamat, telepon, email, kontak_person } = req.body;
      
      // Validation
      if (!nama_supplier) {
        return res.status(400).json({ message: 'Nama supplier is required' });
      }
  
      try {
        const [result] = await pool.query(
          'INSERT INTO supplier (nama_supplier, alamat, telepon, email, kontak_person) VALUES (?, ?, ?, ?, ?)',
          [nama_supplier, alamat, telepon, email, kontak_person]
        );
        
        const newSupplier = {
          id_supplier: result.insertId,
          nama_supplier,
          alamat,
          telepon,
          email,
          kontak_person
        };
        
        res.status(201).json(newSupplier);
      } catch (err) {
        console.error('Error creating supplier:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ message: 'Server Error', error: err.message });
      }
    },
  
    // Update supplier
    updateSupplier: async (req, res) => {
      const { id } = req.params;
      const { nama_supplier, alamat, telepon, email, kontak_person } = req.body;
      
      // Validation
      if (!nama_supplier) {
        return res.status(400).json({ message: 'Nama supplier is required' });
      }
  
      try {
        const [result] = await pool.query(
          'UPDATE supplier SET nama_supplier = ?, alamat = ?, telepon = ?, email = ?, kontak_person = ? WHERE id_supplier = ?',
          [nama_supplier, alamat, telepon, email, kontak_person, id]
        );
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ 
          id_supplier: id, 
          nama_supplier, 
          alamat, 
          telepon, 
          email, 
          kontak_person 
        });
      } catch (err) {
        console.error('Error updating supplier:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Supplier with this name already exists' });
        }
        res.status(500).json({ message: 'Server Error', error: err.message });
      }
    },
  
    // Delete supplier
    deleteSupplier: async (req, res) => {
      const { id } = req.params;
      try {
        // Check if any products are associated with this supplier
        const [products] = await pool.query(
          'SELECT COUNT(*) as count FROM produk WHERE id_supplier = ?', 
          [id]
        );
        
        if (products[0].count > 0) {
          // Set supplier to NULL for associated products
          await pool.query(
            'UPDATE produk SET id_supplier = NULL WHERE id_supplier = ?', 
            [id]
          );
        }
        
        // Delete the supplier
        const [result] = await pool.query(
          'DELETE FROM supplier WHERE id_supplier = ?', 
          [id]
        );
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Supplier not found' });
        }
        
        res.json({ message: 'Supplier deleted successfully' });
      } catch (err) {
        console.error('Error deleting supplier:', err);
        res.status(500).json({ message: 'Server Error', error: err.message });
      }
    }
  };
  
  function confirmDelete(id) {
    supplierToDelete = id;
    supplierConfirmModal.style.display = 'block';
  }
  
  async function confirmDeleteSupplier() {
    if (!supplierToDelete) return;
    
    try {
 const response = await fetch(`http://localhost:3000/api/suppliers/${supplierToDelete}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete supplier');
      
      supplierConfirmModal.style.display = 'none';
      loadSuppliers();
      showAlert('success', 'Supplier berhasil dihapus');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showAlert('error', 'Gagal menghapus supplier');
    } finally {
      supplierToDelete = null;
    }
  }
  
  function closeAllModals() {
    supplierModal.style.display = 'none';
    supplierConfirmModal.style.display = 'none';
  }
  
  // Utility functions
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `casss-alert casss-${type}-alert`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.classList.add('casss-alert-fade');
      setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
  }
});




//dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    loadDashboardData();
    
    // Set up auto-refresh every 5 minutes
    setInterval(loadDashboardData, 300000);
});

async function loadDashboardData() {
    try {
        // Load summary data
        const summaryResponse = await fetch('http://localhost:3000/api/dashboard/summary');
        const summaryData = await summaryResponse.json();
        updateSummaryCards(summaryData);

        // Load sales chart data
        const salesResponse = await fetch('http://localhost:3000/api/dashboard/sales-chart');
        const salesData = await salesResponse.json();
        renderSalesChart(salesData);

        // Load inventory chart data
        const inventoryResponse = await fetch('http://localhost:3000/api/dashboard/inventory-chart');
        const inventoryData = await inventoryResponse.json();
        renderInventoryChart(inventoryData);

        // Load recent transactions
        const transactionsResponse = await fetch('http://localhost:3000/api/dashboard/recent-transactions');
        const transactionsData = await transactionsResponse.json();
        populateRecentTransactions(transactionsData);

        // Load low stock items
        const lowStockResponse = await fetch('http://localhost:3000/api/dashboard/low-stock');
        const lowStockData = await lowStockResponse.json();
        populateLowStockItems(lowStockData);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorToast('Gagal memuat data dashboard');
    }
}
function updateSummaryCards(data) {
    function isValidNumber(val) {
        return typeof val === 'number' && !isNaN(val) && isFinite(val);
    }

    // Update monthly income
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(1) .casss-summary-value').textContent =
        formatCurrency(data.monthly_income);
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(1) .casss-summary-change').innerHTML =
        isValidNumber(data.income_change)
            ? `<i class="fas fa-arrow-${data.income_change >= 0 ? 'up' : 'down'}"></i> ${Math.abs(data.income_change)}%`
            : '-';

    // Update total products
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(2) .casss-summary-value').textContent =
        data.total_products;
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(2) .casss-summary-change').innerHTML =
        isValidNumber(data.products_change)
            ? `<i class="fas fa-arrow-${data.products_change >= 0 ? 'up' : 'down'}"></i> ${Math.abs(data.products_change)}%`
            : '-';

    // Update low stock
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(3) .casss-summary-value').textContent =
        data.low_stock_items;

    // Update monthly profit
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(4) .casss-summary-value').textContent =
        formatCurrency(data.monthly_profit);
    document.querySelector('.casss-summary-cards .casss-summary-card:nth-child(4) .casss-summary-change').innerHTML =
        isValidNumber(data.profit_change)
            ? `<i class="fas fa-arrow-${data.profit_change >= 0 ? 'up' : 'down'}"></i> ${Math.abs(data.profit_change)}%`
            : '-';
}
function renderSalesChart(data) {
    const ctx = document.getElementById('casss-sales-chart').getContext('2d');
    
    // Destroy previous chart if exists
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Total Penjualan',
                data: data.values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Rp ' + context.raw.toLocaleString('id-ID');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                }
            }
        }
    });
}

function renderInventoryChart(data) {
    const ctx = document.getElementById('casss-inventory-chart').getContext('2d');
    
    // Destroy previous chart if exists
    if (window.inventoryChart) {
        window.inventoryChart.destroy();
    }
    
    window.inventoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} item (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function populateRecentTransactions(data) {
    const tbody = document.querySelector('.casss-data-tables .casss-table-container:nth-child(1) table tbody');
    tbody.innerHTML = '';
    
    data.forEach(transaction => {
        const row = document.createElement('tr');
        
        // Format status badge
        let statusClass = '';
        switch(transaction.status_pembayaran) {
            case 'lunas': statusClass = 'casss-badge-success'; break;
            case 'pending': statusClass = 'casss-badge-warning'; break;
            case 'cicilan': statusClass = 'casss-badge-info'; break;
        }
        
        row.innerHTML = `
            <td class="casss-table-data">${formatDate(transaction.tanggal_penjualan)}</td>
            <td class="casss-table-data">${transaction.no_invoice}</td>
            <td class="casss-table-data">${transaction.nama_pelanggan || 'Tanpa Nama'}</td>
            <td class="casss-table-data">${formatCurrency(transaction.total_bayar)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function populateLowStockItems(data) {
    const tbody = document.querySelector('.casss-data-tables .casss-table-container:nth-child(2) table tbody');
    tbody.innerHTML = '';
    
    data.forEach(product => {
        const row = document.createElement('tr');
        
        // Determine stock status class
        const stockPercentage = (product.stok / product.stok_minimal) * 100;
        let stockClass = '';
        if (stockPercentage <= 20) {
            stockClass = 'casss-text-danger';
        } else if (stockPercentage <= 50) {
            stockClass = 'casss-text-warning';
        }
        
        row.innerHTML = `
            <td class="casss-table-data">${product.kode_produk}</td>
            <td class="casss-table-data">${product.nama_produk}</td>
            <td class="casss-table-data ${stockClass}">${product.stok} (min: ${product.stok_minimal})</td>
            <td class="casss-table-data">
                <button class="casss-btn casss-btn-sm casss-btn-primary" onclick="openRestockModal(${product.id_produk})">
                    <i class="fas fa-plus"></i> Restock
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Helper functions
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function showErrorToast(message) {
    // Implement your toast notification here
    console.error('Error:', message);
}

// For restock functionality (to be implemented)
function openRestockModal(productId) {
    console.log('Restock product:', productId);
    // Implement modal opening and restock functionality
}





document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api/customers';

  const customerTableBody = document.getElementById('casss-customers-body');
  const addBtn = document.getElementById('casss-add-customer');
  const modal = document.getElementById('casss-customer-modal');
  const closeModal = modal.querySelector('.casss-close-modal');
  const cancelBtn = modal.querySelector('.casss-form-cancel');
  const form = document.getElementById('casss-customer-form');
  const searchInput = document.getElementById('casss-customer-search');

  let customers = [];
  let editingId = null;

  // Load all customers
  async function loadCustomers() {
    try {
      const res = await fetch(API_URL);
      customers = await res.json();
      renderCustomers(customers);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  }

  // Render customers to table
  function renderCustomers(data) {
    customerTableBody.innerHTML = '';
    data.forEach(c => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${c.nama_pelanggan}</td>
        <td>${c.telepon || '-'}</td>
        <td>${c.email || '-'}</td>
        <td>${new Date(c.tanggal_bergabung).toLocaleDateString()}</td>
        <td>
          <button onclick="editCustomer(${c.id_pelanggan})">Edit</button>
          <button onclick="deleteCustomer(${c.id_pelanggan})">Hapus</button>
        </td>
      `;
      customerTableBody.appendChild(row);
    });
  }

  // Show modal for new customer
  addBtn.addEventListener('click', () => {
    editingId = null;
    form.reset();
    modal.style.display = 'block';
  });

  closeModal.onclick = cancelBtn.onclick = () => {
    modal.style.display = 'none';
  };

  // Submit form
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      nama_pelanggan: form['casss-customer-name'].value,
      alamat: form['casss-customer-address'].value,
      telepon: form['casss-customer-phone'].value,
      email: form['casss-customer-email'].value,
      catatan: form['casss-customer-note'].value,
    };

    try {
      if (editingId) {
        await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      modal.style.display = 'none';
      loadCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
    }
  };

  // Search
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const filtered = customers.filter(c =>
      c.nama_pelanggan.toLowerCase().includes(term)
    );
    renderCustomers(filtered);
  });

  // Expose to window for global access
  window.editCustomer = async (id) => {
    const customer = customers.find(c => c.id_pelanggan === id);
    if (customer) {
      editingId = id;
      form['casss-customer-name'].value = customer.nama_pelanggan;
      form['casss-customer-address'].value = customer.alamat || '';
      form['casss-customer-phone'].value = customer.telepon || '';
      form['casss-customer-email'].value = customer.email || '';
      form['casss-customer-note'].value = customer.catatan || '';
      modal.style.display = 'block';
    }
  };

  window.deleteCustomer = async (id) => {
    if (confirm('Yakin ingin menghapus pelanggan ini?')) {
      try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
      }
    }
  };

  // Initial load
  loadCustomers();
});
