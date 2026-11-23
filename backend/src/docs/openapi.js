export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: "Meuble Le'Koyo REST API (v1)",
    version: '1.0.0',
    description:
      "Dokumentasi API interaktif untuk aplikasi Full-Stack Meuble Le'Koyo (UMKM Furnitur Kayu Jati Jambi — Capstone A26-CS019). Mencakup manajemen Katalog, Karya Pernah Dicustom, Pesanan, Penjualan, FAQ, Testimoni, Proxy Layanan Gen AI (Koyo), dan Ringkasan Analitik Data Science.",
  },
  servers: [
    { url: '/api/v1', description: 'Server Aktif (Relatif)' },
    { url: 'http://localhost:4000/api/v1', description: 'Pengembangan Lokal' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Dapatkan token dari POST /auth/login lalu masukkan di tombol Authorize.',
      },
    },
    schemas: {
      PhotoItem: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', example: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80' },
          label: { type: 'string', example: 'Tampak Depan' },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['name', 'category', 'price', 'description', 'images'],
        properties: {
          name: { type: 'string', example: 'Meja Makan Jati Minimalis' },
          category: { type: 'string', example: 'Meja' },
          price: { type: 'integer', example: 4500000 },
          description: { type: 'string', example: 'Meja makan kayu jati solid finishing natural.' },
          material: { type: 'string', example: 'Kayu Jati Solid' },
          productionTime: { type: 'string', example: '2 bulan' },
          stockStatus: { type: 'string', enum: ['Tersedia', 'Terjual'], example: 'Tersedia' },
          featured: { type: 'boolean', example: true },
          images: { type: 'array', items: { $ref: '#/components/schemas/PhotoItem' } },
        },
      },
      CustomPortfolioInput: {
        type: 'object',
        required: ['name', 'category', 'size', 'finish', 'city', 'description', 'images'],
        properties: {
          name: { type: 'string', example: 'Kitchen Set Jati Huruf L + Minibar' },
          typeKey: { type: 'string', example: 'kitchen' },
          category: { type: 'string', example: 'Kitchen Set' },
          size: { type: 'string', example: 'P 320 × T 235 × D 62 cm' },
          finish: { type: 'string', example: 'Natural Jati (Doff)' },
          city: { type: 'string', example: 'Telanaipura, Kota Jambi' },
          year: { type: 'string', example: '2026' },
          description: { type: 'string', example: 'Full kayu jati solid tahan lembap.' },
          images: { type: 'array', items: { $ref: '#/components/schemas/PhotoItem' } },
        },
      },
      OrderInput: {
        type: 'object',
        required: ['name', 'phone', 'address', 'product', 'quantity', 'payment'],
        properties: {
          name: { type: 'string', example: 'Budi Santoso' },
          phone: { type: 'string', example: '081234567890' },
          address: { type: 'string', example: 'Jl. Sudirman No. 12, Palembang' },
          product: { type: 'string', example: 'Meja Makan Jati Minimalis' },
          productId: { type: 'integer', nullable: true, example: 1 },
          quantity: { type: 'integer', example: 1 },
          payment: { type: 'string', enum: ['Tunai', 'Tabung', 'Tunai / M-Banking', 'Sistem Tabung'], example: 'Tabung' },
          total: { type: 'integer', example: 4500000 },
          agreedToTerms: { type: 'boolean', example: true },
        },
      },
      ChatInput: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: 'Cari meja makan di bawah 5 juta dan bisa sistem tabung?' },
          activeProductId: { type: 'integer', nullable: true, example: 1 },
          sessionId: { type: 'string', example: 'sess-001' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Cek status server, mode database, dan koneksi layanan AI/DS',
        responses: { 200: { description: 'Server sehat' } },
      },
    },
    '/bootstrap': {
      get: {
        tags: ['System'],
        summary: 'Ambil seluruh data awal publik (produk, pernah dicustom, FAQ, testimoni, metrik)',
        responses: { 200: { description: 'Data awal berhasil diambil' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login Portal Owner untuk mendapatkan Bearer Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: { password: { type: 'string', example: 'lekoyo2026' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Berhasil login, mengembalikan token' },
          401: { description: 'Password salah' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Daftar semua produk katalog',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter kategori (Meja, Kursi, Lemari, dll.)' },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Kata kunci pencarian' },
        ],
        responses: { 200: { description: 'Daftar produk' } },
      },
      post: {
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        summary: 'Tambah produk baru (Owner)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } },
        },
        responses: { 201: { description: 'Produk dibuat' }, 400: { description: 'Validasi Joi gagal' }, 401: { description: 'Belum login' } },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Detail satu produk',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detail produk' }, 404: { description: 'Tidak ditemukan' } },
      },
      put: {
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        summary: 'Ubah data produk (Owner)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductInput' } } },
        },
        responses: { 200: { description: 'Produk diperbarui' } },
      },
      delete: {
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        summary: 'Hapus produk (Owner)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Produk dihapus' } },
      },
    },
    '/products/{id}/stock': {
      patch: {
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        summary: 'Ubah status stok (Tersedia / Terjual)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['stockStatus'],
                properties: { stockStatus: { type: 'string', enum: ['Tersedia', 'Terjual'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status stok diperbarui' } },
      },
    },
    '/custom-portfolio': {
      get: {
        tags: ['Custom Portfolio'],
        summary: 'Daftar karya yang pernah dicustom pelanggan',
        responses: { 200: { description: 'Daftar karya custom' } },
      },
      post: {
        tags: ['Custom Portfolio'],
        security: [{ BearerAuth: [] }],
        summary: 'Tambah karya pernah dicustom (Owner)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomPortfolioInput' } } },
        },
        responses: { 201: { description: 'Karya custom ditambahkan' } },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        summary: 'Daftar semua pesanan masuk (Owner)',
        responses: { 200: { description: 'Daftar pesanan' } },
      },
      post: {
        tags: ['Orders'],
        summary: 'Buat pesanan baru (katalog maupun custom)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OrderInput' } } },
        },
        responses: { 201: { description: 'Pesanan tersimpan (status Menunggu Konfirmasi WA)' }, 400: { description: 'Validasi Joi gagal' }, 429: { description: 'Batas anti-spam tercapai (maks. 3 pesanan / 15 menit)' } },
      },
    },
    '/orders/{id}': {
      patch: {
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        summary: 'Perbarui status atau catatan pesanan (Owner)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['Menunggu Konfirmasi WA', 'Diproses', 'Selesai', 'Dibatalkan'] },
                  madeBefore: { type: 'boolean' },
                  madeNote: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Pesanan diperbarui' } },
      },
      delete: {
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        summary: 'Hapus pesanan (Owner)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Pesanan dihapus' } },
      },
    },
    '/sales': {
      get: { tags: ['Sales'], security: [{ BearerAuth: [] }], summary: 'Riwayat penjualan offline/toko', responses: { 200: { description: 'Daftar penjualan' } } },
      post: { tags: ['Sales'], security: [{ BearerAuth: [] }], summary: 'Catat penjualan di toko/WA', responses: { 201: { description: 'Penjualan tercatat' } } },
    },
    '/faqs': {
      get: { tags: ['Content'], summary: 'Daftar FAQ toko', responses: { 200: { description: 'Daftar FAQ' } } },
      post: { tags: ['Content'], security: [{ BearerAuth: [] }], summary: 'Tambah FAQ (Owner)', responses: { 201: { description: 'FAQ ditambahkan' } } },
    },
    '/testimonials': {
      get: { tags: ['Content'], summary: 'Daftar testimoni pelanggan', responses: { 200: { description: 'Daftar testimoni' } } },
      post: { tags: ['Content'], security: [{ BearerAuth: [] }], summary: 'Tambah testimoni (Owner)', responses: { 201: { description: 'Testimoni ditambahkan' } } },
    },
    '/chats': {
      get: {
        tags: ['Gen AI (Koyo)'],
        security: [{ BearerAuth: [] }],
        summary: 'Riwayat percakapan Koyo & deteksi intent dari database (Owner)',
        responses: { 200: { description: 'Daftar log chat' } },
      },
      post: {
        tags: ['Gen AI (Koyo)'],
        summary: 'Kirim pesan ke Koyo melalui Backend (terhubung ke FastAPI Gen AI + simpan ke DB)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatInput' } } },
        },
        responses: { 201: { description: 'Balasan Koyo beserta intent dan status sumber AI' }, 400: { description: 'Pesan tidak valid' } },
      },
      delete: {
        tags: ['Gen AI (Koyo)'],
        security: [{ BearerAuth: [] }],
        summary: 'Kosongkan riwayat chat (Owner)',
        responses: { 200: { description: 'Riwayat chat dihapus' } },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Data Science & Analytics'],
        security: [{ BearerAuth: [] }],
        summary: 'Ringkasan KPI bisnis, preferensi pembayaran, intent chat, dan status integrasi Streamlit/DS (Owner)',
        responses: { 200: { description: 'Ringkasan analitik bisnis' } },
      },
    },
  },
};
