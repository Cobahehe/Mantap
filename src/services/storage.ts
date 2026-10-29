/**
 * AgroFish ERP & POS - Storage Service (Local Persistence & Seed Data)
 */

import {
  Product,
  Transaction,
  CustomerCredit,
  DeliveryNote,
  StockOpname,
  StockCardRecord,
  RestockOrder,
  StoreSettings,
  HeldOrder,
  AuthCredentials,
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'agrofish_products_v1',
  TRANSACTIONS: 'agrofish_transactions_v1',
  CUSTOMERS: 'agrofish_customers_v1',
  DELIVERIES: 'agrofish_deliveries_v1',
  OPNAMES: 'agrofish_opnames_v1',
  STOCK_CARDS: 'agrofish_stock_cards_v1',
  RESTOCKS: 'agrofish_restocks_v1',
  SETTINGS: 'agrofish_settings_v1',
  HELD_ORDERS: 'agrofish_held_orders_v1',
  AUTH: 'agrofish_auth_v1',
  SESSION: 'agrofish_session_v1',
};

const DEFAULT_AUTH: AuthCredentials = {
  username: 'admin',
  password: 'admin',
};


// Initial Seed Products
const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'PKN-BR1-01',
    name: 'Pakan Ayam Broiler BR-1 Starter (Pokphand)',
    category: 'pakan',
    brand: 'Charoen Pokphand',
    description: 'Pakan butiran crumble untuk anak ayam pedaging umur 1-21 hari. Protein tinggi.',
    baseUnit: 'kg',
    stockInBaseUnit: 1450, // 29 Sak @ 50kg
    minStockAlert: 200,
    isFeed: true,
    location: 'Gudang Utama A-01',
    updatedAt: new Date().toISOString(),
    batches: [
      {
        id: 'batch-br1-01',
        batchNumber: 'CP-BR1-260901',
        expiryDate: '2026-12-15',
        quantity: 1000,
      },
      {
        id: 'batch-br1-02',
        batchNumber: 'CP-BR1-260810',
        expiryDate: '2026-11-05', // near expiration (< 30 days)
        quantity: 450,
      },
    ],
    units: [
      {
        id: 'u-br1-sak50',
        name: 'Sak / Karung 50 Kg',
        conversionRate: 50,
        sellPrice: 465000,
        costPrice: 425000,
        barcode: '899100100150',
        isDefault: true,
      },
      {
        id: 'u-br1-sak25',
        name: 'Sak 25 Kg',
        conversionRate: 25,
        sellPrice: 238000,
        costPrice: 215000,
        barcode: '899100100125',
      },
      {
        id: 'u-br1-ecer',
        name: 'Eceran (Per Kg)',
        conversionRate: 1,
        sellPrice: 10500,
        costPrice: 8500,
        barcode: '899100100101',
      },
    ],
  },
  {
    id: 'prod-002',
    sku: 'PKN-BR2-02',
    name: 'Pakan Ayam Broiler BR-2 Finisher (Pokphand)',
    category: 'pakan',
    brand: 'Charoen Pokphand',
    description: 'Pakan pellet untuk ayam broiler pembesaran hingga panen (umur 22 hari ke atas).',
    baseUnit: 'kg',
    stockInBaseUnit: 1800,
    minStockAlert: 250,
    isFeed: true,
    location: 'Gudang Utama A-02',
    updatedAt: new Date().toISOString(),
    batches: [
      {
        id: 'batch-br2-01',
        batchNumber: 'CP-BR2-260915',
        expiryDate: '2027-01-20',
        quantity: 1800,
      },
    ],
    units: [
      {
        id: 'u-br2-sak50',
        name: 'Sak / Karung 50 Kg',
        conversionRate: 50,
        sellPrice: 455000,
        costPrice: 418000,
        barcode: '899100200150',
        isDefault: true,
      },
      {
        id: 'u-br2-ecer',
        name: 'Eceran (Per Kg)',
        conversionRate: 1,
        sellPrice: 10000,
        costPrice: 8360,
        barcode: '899100200101',
      },
    ],
  },
  {
    id: 'prod-003',
    sku: 'PKN-781-01',
    name: 'Pelet Ikan Lele Hi-Pro-Vite 781-2 (Matahari Sakti)',
    category: 'pakan',
    brand: 'Matahari Sakti',
    description: 'Pakan apung lele protein 31-33%, mempercepat bobot panen ikan lele & patin.',
    baseUnit: 'kg',
    stockInBaseUnit: 900, // 30 Sak @ 30kg
    minStockAlert: 150,
    isFeed: true,
    location: 'Gudang Pakan Ikan B-01',
    updatedAt: new Date().toISOString(),
    batches: [
      {
        id: 'batch-781-01',
        batchNumber: 'MS-781-260902',
        expiryDate: '2027-02-28',
        quantity: 900,
      },
    ],
    units: [
      {
        id: 'u-781-sak30',
        name: 'Sak 30 Kg',
        conversionRate: 30,
        sellPrice: 385000,
        costPrice: 345000,
        barcode: '899100300130',
        isDefault: true,
      },
      {
        id: 'u-781-ecer',
        name: 'Eceran (Per Kg)',
        conversionRate: 1,
        sellPrice: 14000,
        costPrice: 11500,
        barcode: '899100300101',
      },
    ],
  },
  {
    id: 'prod-004',
    sku: 'PKN-DDK-01',
    name: 'Dedak Bekatul Padi Super Halus',
    category: 'pakan',
    brand: 'Lokal Sumber Pangan',
    description: 'Dedak murni tanpa sekam kasar, sumber energi dan karbohidrat ternak & campuran pakan.',
    baseUnit: 'kg',
    stockInBaseUnit: 1200,
    minStockAlert: 300,
    isFeed: true,
    location: 'Gudang Pakan Curah C-01',
    updatedAt: new Date().toISOString(),
    batches: [
      {
        id: 'batch-ddk-01',
        batchNumber: 'BKL-261001',
        expiryDate: '2026-11-20', // warning 30 days
        quantity: 1200,
      },
    ],
    units: [
      {
        id: 'u-ddk-sak50',
        name: 'Sak / Karung 50 Kg',
        conversionRate: 50,
        sellPrice: 210000,
        costPrice: 180000,
        barcode: '899100400150',
        isDefault: true,
      },
      {
        id: 'u-ddk-ecer',
        name: 'Eceran (Per Kg)',
        conversionRate: 1,
        sellPrice: 4800,
        costPrice: 3600,
        barcode: '899100400101',
      },
    ],
  },
  {
    id: 'prod-005',
    sku: 'PKN-JGG-01',
    name: 'Jagung Pipil Giling Halus Pakan Ternak',
    category: 'pakan',
    brand: 'Lokal Tani Makmur',
    description: 'Jagung kering kadar air rendah <14%, digiling halus cocok untuk unggas & puyuh.',
    baseUnit: 'kg',
    stockInBaseUnit: 850,
    minStockAlert: 200,
    isFeed: true,
    location: 'Gudang Pakan Curah C-02',
    updatedAt: new Date().toISOString(),
    batches: [
      {
        id: 'batch-jgg-01',
        batchNumber: 'JGG-260920',
        expiryDate: '2027-01-15',
        quantity: 850,
      },
    ],
    units: [
      {
        id: 'u-jgg-sak50',
        name: 'Sak 50 Kg',
        conversionRate: 50,
        sellPrice: 360000,
        costPrice: 315000,
        barcode: '899100500150',
        isDefault: true,
      },
      {
        id: 'u-jgg-ecer',
        name: 'Eceran (Per Kg)',
        conversionRate: 1,
        sellPrice: 8000,
        costPrice: 6300,
        barcode: '899100500101',
      },
    ],
  },
  {
    id: 'prod-006',
    sku: 'PKN-KL-36',
    name: 'Konsentrat Ayam Petelur KL-36 (Japfa Comfeed)',
    category: 'pakan',
    brand: 'Japfa Comfeed',
    description: 'Konsentrat petelur protein 36%, mengoptimalkan produksi telur dan kualitas cangkang tebal.',
    baseUnit: 'kg',
    stockInBaseUnit: 120, // Low stock warning (< 200)
    minStockAlert: 200,
    isFeed: true,
    location: 'Gudang Utama A-03',
    updatedAt: new Date().toISOString(),
    batches: [
      {
        id: 'batch-kl36-01',
        batchNumber: 'JPF-KL-260905',
        expiryDate: '2026-10-30', // Urgent: expires very soon!
        quantity: 120,
      },
    ],
    units: [
      {
        id: 'u-kl36-sak50',
        name: 'Sak 50 Kg',
        conversionRate: 50,
        sellPrice: 510000,
        costPrice: 470000,
        barcode: '899100600150',
        isDefault: true,
      },
      {
        id: 'u-kl36-ecer',
        name: 'Eceran (Per Kg)',
        conversionRate: 1,
        sellPrice: 11500,
        costPrice: 9400,
        barcode: '899100600101',
      },
    ],
  },
  // Alat Pancing & Perlengkapan Nelayan
  {
    id: 'prod-007',
    sku: 'PNC-SHM-SN25',
    name: 'Reel Pancing Shimano Sienna FG 2500',
    category: 'alat_pancing',
    brand: 'Shimano',
    description: 'Reel spinning entry-level legendaris, 3+1 Ball Bearing, smooth drag, tahan air asin.',
    baseUnit: 'pcs',
    stockInBaseUnit: 18,
    minStockAlert: 5,
    isFeed: false,
    location: 'Etalase Reel Kaca No. 01',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-shm-pcs',
        name: 'Unit / Pcs',
        conversionRate: 1,
        sellPrice: 495000,
        costPrice: 415000,
        barcode: '022255225010',
        isDefault: true,
      },
      {
        id: 'u-shm-box',
        name: 'Dus / Box (Isi 10 Pcs)',
        conversionRate: 10,
        sellPrice: 4750000,
        costPrice: 4050000,
        barcode: '022255225099',
      },
    ],
  },
  {
    id: 'prod-008',
    sku: 'PNC-SHM-STL',
    name: 'Reel Shimano Stella SW 6000HG Flagship',
    category: 'alat_pancing',
    brand: 'Shimano',
    description: 'Reel heavy-duty saltwater monster, Infinity Drive & X-Protect untuk mancing laut dalam.',
    baseUnit: 'pcs',
    stockInBaseUnit: 3,
    minStockAlert: 2,
    isFeed: false,
    location: 'Brankas Etalase VIP',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-stella-pcs',
        name: 'Unit / Pcs',
        conversionRate: 1,
        sellPrice: 12500000,
        costPrice: 10800000,
        barcode: '022255888001',
        isDefault: true,
      },
    ],
  },
  {
    id: 'prod-009',
    sku: 'PNC-ORG-TG45',
    name: 'Joran Tegek Oregon Siluman 450 Carbon Super Kaku',
    category: 'alat_pancing',
    brand: 'Oregon',
    description: 'Joran pole tegek bahan carbon kaku, panjang 4.5 meter, ringkas untuk kolam & rawa.',
    baseUnit: 'pcs',
    stockInBaseUnit: 14,
    minStockAlert: 4,
    isFeed: false,
    location: 'Rak Joran Gantung J-01',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-org-pcs',
        name: 'Batang / Pcs',
        conversionRate: 1,
        sellPrice: 185000,
        costPrice: 145000,
        barcode: '899300100450',
        isDefault: true,
      },
    ],
  },
  {
    id: 'prod-010',
    sku: 'PNC-RLX-SSK',
    name: 'Joran Spinning Relix Nusantara Sisik 602 UL 1-3 lbs',
    category: 'alat_pancing',
    brand: 'Relix Nusantara',
    description: 'Joran Ultra Light (UL) karya anak bangsa, Fuji Guides, sensitivitas luar biasa.',
    baseUnit: 'pcs',
    stockInBaseUnit: 8,
    minStockAlert: 3,
    isFeed: false,
    location: 'Rak Joran Gantung J-03',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-rlx-pcs',
        name: 'Batang / Pcs',
        conversionRate: 1,
        sellPrice: 420000,
        costPrice: 345000,
        barcode: '899300200602',
        isDefault: true,
      },
    ],
  },
  {
    id: 'prod-011',
    sku: 'PNC-SNR-JBR',
    name: 'Senar Braided PE Jabrik Relix 100m (PE 1.5)',
    category: 'alat_pancing',
    brand: 'Relix Nusantara',
    description: 'Senar PE 8 rajut halus, coating licin tahan gesekan karang, tidak menyerap air.',
    baseUnit: 'roll',
    stockInBaseUnit: 45,
    minStockAlert: 10,
    isFeed: false,
    location: 'Etalase Senar E-01',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-jbr-roll',
        name: 'Roll 100 Meter',
        conversionRate: 1,
        sellPrice: 85000,
        costPrice: 65000,
        barcode: '899400100100',
        isDefault: true,
      },
      {
        id: 'u-jbr-slop',
        name: 'Slop (10 Roll Menyambung)',
        conversionRate: 10,
        sellPrice: 800000,
        costPrice: 630000,
        barcode: '899400100999',
      },
    ],
  },
  {
    id: 'prod-012',
    sku: 'PNC-KLL-SSM',
    name: 'Kail Pancing Sasame Chinu Ringed F-714',
    category: 'alat_pancing',
    brand: 'Sasame Japan',
    description: 'Kail baja carbon Jepang berlubang, tajam awet tidak mudah patah saat sambaran ikan besar.',
    baseUnit: 'pcs',
    stockInBaseUnit: 1200, // 100 bungkus @ 12 kail
    minStockAlert: 150,
    isFeed: false,
    location: 'Laci Aksesoris K-02',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-ssm-bks',
        name: 'Bungkus (Isi 12 Kail)',
        conversionRate: 12,
        sellPrice: 28000,
        costPrice: 20000,
        barcode: '495545800714',
        isDefault: true,
      },
      {
        id: 'u-ssm-box',
        name: 'Kotak / Box (10 Bungkus)',
        conversionRate: 120,
        sellPrice: 260000,
        costPrice: 190000,
        barcode: '495545800799',
      },
      {
        id: 'u-ssm-pcs',
        name: 'Satuan Ecer (Per 1 Mata Kail)',
        conversionRate: 1,
        sellPrice: 3000,
        costPrice: 1700,
        barcode: '495545800701',
      },
    ],
  },
  {
    id: 'prod-013',
    sku: 'PNC-LUR-MNW',
    name: 'Umpan Minnow Rapala X-Rap Saltwater 10cm',
    category: 'alat_pancing',
    brand: 'Rapala',
    description: 'Umpan tiruan lure diving action realistis untuk casting dan trolling laut/muara.',
    baseUnit: 'pcs',
    stockInBaseUnit: 15,
    minStockAlert: 5,
    isFeed: false,
    location: 'Etalase Umpan Tiruan L-01',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-mnw-pcs',
        name: 'Pcs / Buah',
        conversionRate: 1,
        sellPrice: 175000,
        costPrice: 135000,
        barcode: '022677112233',
        isDefault: true,
      },
    ],
  },
  {
    id: 'prod-014',
    sku: 'PNC-ESS-KTL',
    name: 'Essen Oplosan Katilayu Premium Segala Ikan Air Tawar',
    category: 'alat_pancing',
    brand: 'Essen Juara',
    description: 'Aroma getah katilayu fermentasi pekat, pengumpul ikan mas, bawal, lele, patin galatama.',
    baseUnit: 'botol',
    stockInBaseUnit: 25,
    minStockAlert: 6,
    isFeed: false,
    location: 'Etalase Umpan Tiruan L-02',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-ess-btl',
        name: 'Botol 30ml',
        conversionRate: 1,
        sellPrice: 65000,
        costPrice: 40000,
        barcode: '899500100030',
        isDefault: true,
      },
    ],
  },
  {
    id: 'prod-015',
    sku: 'NLN-JRG-INS',
    name: 'Jaring Nelayan Insang (Gill Net) Monofilament 0.20mm',
    category: 'alat_pancing',
    brand: 'Marindo Nelayan',
    description: 'Jaring siap pasang tali ris atas bawah, lengkap pelampung dan timah, mata jaring 2 inchi.',
    baseUnit: 'set',
    stockInBaseUnit: 6,
    minStockAlert: 2,
    isFeed: false,
    location: 'Gudang Nelayan D-01',
    updatedAt: new Date().toISOString(),
    units: [
      {
        id: 'u-jrg-set',
        name: 'Set Panjang 50 Meter',
        conversionRate: 1,
        sellPrice: 320000,
        costPrice: 260000,
        barcode: '899600100050',
        isDefault: true,
      },
    ],
  },
];

// Seed Settings
const SEED_SETTINGS: StoreSettings = {
  storeName: 'Toko Tani & Pancing AGROFISH SEJAHTERA',
  storeSlogan: 'Pusat Grosir & Ecer Pakan Ternak, Pelet Ikan & Alat Pancing Nelayan',
  address: 'Jl. Raya Agro Bahari No. 88, Sentra Tambak & Perikanan, Kab. Pesisir',
  phone: '0812-8889-7766',
  receiptFooter: 'Terima kasih atas kunjungan Anda! Pakan segar langsung dari pabrik, hasil panen melimpah.',
  activeCashier: 'Budi Santoso',
  cashiers: ['Budi Santoso', 'Siti Rahmawati', 'Ahmad Fadillah'],
  categories: ['pakan', 'alat_pancing', 'Obat & Vitamin Ternak', 'Aksesoris Kapal'],
  bankAccounts: [
    { id: 'bank-1', bankName: 'BCA', accountNumber: '8910-2345-67', holderName: 'AGROFISH SEJAHTERA' },
    { id: 'bank-2', bankName: 'BRI', accountNumber: '0021-01-098765-50-1', holderName: 'AGROFISH SEJAHTERA' },
    { id: 'bank-3', bankName: 'Bank Mandiri', accountNumber: '132-00-9876543-2', holderName: 'AGROFISH SEJAHTERA' },
  ],
  qrisPayload: '00020101021226680016ID.CO.QRIS.WWW01189360000201112233445502150000000000000005204581253033605802ID5920AGROFISH SEJAHTERA6007PESISIR6304ABCD',
  paperSize: '80mm',
  enableSound: true,
};

// Seed Customers with Kasbon
const SEED_CUSTOMERS: CustomerCredit[] = [
  {
    id: 'cust-001',
    customerName: 'H. Rohman (Kandang Ayam Sukamaju)',
    phone: '0813-1122-3344',
    address: 'Kp. Pasir Nangka RT 02/04, Desa Mekar Tani (Kandang Ayam 6.000 Ekor)',
    farmType: 'Peternak Ayam Broiler Kemitraan',
    totalCredit: 14250000,
    totalPaid: 4500000,
    balance: 9750000,
    creditLimit: 25000000,
    dueDate: '2026-11-10', // Panen ayam diperkirakan 10 Nov 2026
    status: 'belum_lunas',
    transactions: ['TRX-20261015-0012', 'TRX-20261019-0045'],
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: new Date().toISOString(),
    paymentHistory: [
      {
        id: 'pay-001',
        date: '2026-10-18T10:15:00Z',
        amount: 4500000,
        paymentMethod: 'transfer',
        bankName: 'BRI',
        receiver: 'Budi Santoso',
        notes: 'Cicilan DP panen tahap 1 kandang timur',
        referenceInvoice: 'TRX-20261015-0012',
      },
    ],
  },
  {
    id: 'cust-002',
    customerName: 'Mas Joko (Tambak Lele Mandiri)',
    phone: '0857-4455-6677',
    address: 'Jl. Rawa Lindung No. 12, Kelompok Tambak Barokah (8 Kolam Beton)',
    farmType: 'Pembudidaya Ikan Lele & Nila',
    totalCredit: 4620000,
    totalPaid: 4620000,
    balance: 0,
    creditLimit: 10000000,
    dueDate: '2026-10-20',
    status: 'lunas',
    transactions: ['TRX-20261010-0004'],
    createdAt: '2026-09-10T09:30:00Z',
    updatedAt: new Date().toISOString(),
    paymentHistory: [
      {
        id: 'pay-002',
        date: '2026-10-20T14:30:00Z',
        amount: 4620000,
        paymentMethod: 'cash',
        receiver: 'Budi Santoso',
        notes: 'Pelunasan pakan lele pasca panen raya kolam 1-4',
        referenceInvoice: 'TRX-20261010-0004',
      },
    ],
  },
  {
    id: 'cust-003',
    customerName: 'Pak Bahar (Kelompok Nelayan Karang Jaya)',
    phone: '0821-7788-9900',
    address: 'Dermaga TPI Muara Baru Blok C No. 5',
    farmType: 'Nelayan Bagan Apung & Pancing Rawai',
    totalCredit: 2560000,
    totalPaid: 1000000,
    balance: 1560000,
    creditLimit: 5000000,
    dueDate: '2026-10-28',
    status: 'belum_lunas',
    transactions: ['TRX-20261017-0028'],
    createdAt: '2026-09-25T11:00:00Z',
    updatedAt: new Date().toISOString(),
    paymentHistory: [
      {
        id: 'pay-003',
        date: '2026-10-19T16:00:00Z',
        amount: 1000000,
        paymentMethod: 'cash',
        receiver: 'Siti Rahmawati',
        notes: 'Titip hasil lelang cumi pelabuhan',
        referenceInvoice: 'TRX-20261017-0028',
      },
    ],
  },
];

// Seed Historical Transactions
const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-001',
    invoiceNo: 'TRX-20261021-0001',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    cashierName: 'Budi Santoso',
    customerName: 'Pak Kardi (Peternak Bebek)',
    customerPhone: '0819-2233-4455',
    items: [
      {
        productId: 'prod-004',
        productName: 'Dedak Bekatul Padi Super Halus',
        category: 'pakan',
        brand: 'Lokal Sumber Pangan',
        unitName: 'Sak / Karung 50 Kg',
        conversionRate: 50,
        quantity: 2,
        sellPrice: 210000,
        costPrice: 180000,
        subtotal: 420000,
        subtotalCost: 360000,
        profit: 60000,
      },
      {
        productId: 'prod-005',
        productName: 'Jagung Pipil Giling Halus Pakan Ternak',
        category: 'pakan',
        brand: 'Lokal Tani Makmur',
        unitName: 'Sak 50 Kg',
        conversionRate: 50,
        quantity: 1,
        sellPrice: 360000,
        costPrice: 315000,
        subtotal: 360000,
        subtotalCost: 315000,
        profit: 45000,
      },
    ],
    subtotal: 780000,
    discount: 0,
    total: 780000,
    totalCost: 675000,
    grossProfit: 105000,
    profitMarginPercent: 13.46,
    paymentMethod: 'cash',
    amountPaid: 800000,
    changeAmount: 20000,
    isKasbon: false,
    status: 'completed',
    notes: 'Beli tunai langsung bawa pick-up',
    deliveryId: 'del-001',
  },
  {
    id: 'trx-002',
    invoiceNo: 'TRX-20261021-0002',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    cashierName: 'Budi Santoso',
    customerName: 'Doni (Pemancing Galatama)',
    customerPhone: '0852-3344-5566',
    items: [
      {
        productId: 'prod-007',
        productName: 'Reel Pancing Shimano Sienna FG 2500',
        category: 'alat_pancing',
        brand: 'Shimano',
        unitName: 'Unit / Pcs',
        conversionRate: 1,
        quantity: 1,
        sellPrice: 495000,
        costPrice: 415000,
        subtotal: 495000,
        subtotalCost: 415000,
        profit: 80000,
      },
      {
        productId: 'prod-011',
        productName: 'Senar Braided PE Jabrik Relix 100m (PE 1.5)',
        category: 'alat_pancing',
        brand: 'Relix Nusantara',
        unitName: 'Roll 100 Meter',
        conversionRate: 1,
        quantity: 2,
        sellPrice: 85000,
        costPrice: 65000,
        subtotal: 170000,
        subtotalCost: 130000,
        profit: 40000,
      },
      {
        productId: 'prod-014',
        productName: 'Essen Oplosan Katilayu Premium Segala Ikan Air Tawar',
        category: 'alat_pancing',
        brand: 'Essen Juara',
        unitName: 'Botol 30ml',
        conversionRate: 1,
        quantity: 1,
        sellPrice: 65000,
        costPrice: 40000,
        subtotal: 65000,
        subtotalCost: 40000,
        profit: 25000,
      },
    ],
    subtotal: 730000,
    discount: 10000,
    total: 720000,
    totalCost: 585000,
    grossProfit: 135000,
    profitMarginPercent: 18.75,
    paymentMethod: 'qris',
    amountPaid: 720000,
    changeAmount: 0,
    isKasbon: false,
    status: 'completed',
    notes: 'Diskon langganan Rp 10.000',
  },
  {
    id: 'trx-003',
    invoiceNo: 'TRX-20261020-0033',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    cashierName: 'Siti Rahmawati',
    customerName: 'H. Rohman (Kandang Ayam Sukamaju)',
    customerPhone: '0813-1122-3344',
    items: [
      {
        productId: 'prod-001',
        productName: 'Pakan Ayam Broiler BR-1 Starter (Pokphand)',
        category: 'pakan',
        brand: 'Charoen Pokphand',
        unitName: 'Sak / Karung 50 Kg',
        conversionRate: 50,
        quantity: 10,
        sellPrice: 465000,
        costPrice: 425000,
        subtotal: 4650000,
        subtotalCost: 4250000,
        profit: 400000,
      },
    ],
    subtotal: 4650000,
    discount: 0,
    total: 4650000,
    totalCost: 4250000,
    grossProfit: 400000,
    profitMarginPercent: 8.6,
    paymentMethod: 'kasbon',
    amountPaid: 0,
    changeAmount: 0,
    isKasbon: true,
    kasbonDueDate: '2026-11-10',
    kasbonStatus: 'unpaid',
    status: 'completed',
    notes: 'Ambil pakan kandang 2 tempo panen broiler',
  },
];

// Seed Deliveries & Surat Jalan
const SEED_DELIVERIES: DeliveryNote[] = [
  {
    id: 'del-001',
    suratJalanNo: 'SJ-20261021-001',
    transactionInvoice: 'TRX-20261021-0001',
    customerName: 'Pak Kardi (Peternak Bebek)',
    customerPhone: '0819-2233-4455',
    destinationAddress: 'Jl. Rawa Bebek No. 44 RT 03/01, Desa Sukarasa',
    driverName: 'Fajar Nugraha',
    vehicleNumber: 'B 9482 FTR (Gran Max Pick Up)',
    deliveryDate: new Date().toISOString().split('T')[0],
    status: 'dalam_pengiriman',
    items: [
      { productName: 'Dedak Bekatul Padi Super Halus', unitName: 'Sak / Karung 50 Kg', quantity: 2, notes: 'Kondisi kering segel rapi' },
      { productName: 'Jagung Pipil Giling Halus Pakan Ternak', unitName: 'Sak 50 Kg', quantity: 1, notes: 'Giling halus' },
    ],
    createdAt: new Date().toISOString(),
    notes: 'Kirim sebelum jam 4 sore, taruh di gudang pakan belakang rumah',
  },
];

// Seed Stock Opname Records
const SEED_OPNAMES: StockOpname[] = [
  {
    id: 'opn-001',
    date: '2026-10-19T17:00:00Z',
    productId: 'prod-001',
    productName: 'Pakan Ayam Broiler BR-1 Starter (Pokphand)',
    systemStock: 1500,
    physicalStock: 1450,
    difference: -50, // Kurang 1 karung
    baseUnit: 'kg',
    reason: 'karung_sobek',
    notes: 'Karung robek saat pemindahan fork lift, pakan tercecer susut 50kg',
    operator: 'Budi Santoso',
  },
  {
    id: 'opn-002',
    date: '2026-10-18T16:30:00Z',
    productId: 'prod-012',
    productName: 'Kail Pancing Sasame Chinu Ringed F-714',
    systemStock: 1180,
    physicalStock: 1200,
    difference: 20,
    baseUnit: 'pcs',
    reason: 'bonus_supplier',
    notes: 'Bonus sampel kail dari sales Sasame masuk inventaris',
    operator: 'Siti Rahmawati',
  },
];

// Seed Restock & In-Out
const SEED_RESTOCKS: RestockOrder[] = [
  {
    id: 'rst-001',
    type: 'restock_supplier',
    invoiceNo: 'PO-CP-20261015-09',
    date: '2026-10-15',
    supplierOrBranch: 'PT Charoen Pokphand Indonesia Tbk',
    items: [
      {
        productId: 'prod-001',
        productName: 'Pakan Ayam Broiler BR-1 Starter (Pokphand)',
        unitName: 'Sak / Karung 50 Kg',
        conversionRate: 50,
        quantity: 30,
        costPrice: 420000,
        subtotal: 12600000,
        batchNumber: 'CP-BR1-260901',
        expiryDate: '2026-12-15',
      },
    ],
    totalAmount: 12600000,
    operator: 'Budi Santoso',
    notes: 'Faktur pabrik lunas tempo 14 hari',
    createdAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'rst-002',
    type: 'branch_in',
    invoiceNo: 'MUT-IN-20261018-01',
    date: '2026-10-18',
    supplierOrBranch: 'Cabang Toko Agro Pesisir Barat',
    items: [
      {
        productId: 'prod-007',
        productName: 'Reel Pancing Shimano Sienna FG 2500',
        unitName: 'Unit / Pcs',
        conversionRate: 1,
        quantity: 5,
        costPrice: 415000,
        subtotal: 2075000,
      },
    ],
    totalAmount: 2075000,
    operator: 'Siti Rahmawati',
    notes: 'Mutasi stok cabang karena lonjakan pemancing akhir pekan',
    createdAt: '2026-10-18T13:00:00Z',
  },
];

// Helper to safely read and write JSON to LocalStorage
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const StorageService = {
  // PRODUCTS
  getProducts(): Product[] {
    const items = getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    if (items.length === 0) {
      this.saveProducts(SEED_PRODUCTS);
      return SEED_PRODUCTS;
    }
    return items;
  },

  saveProducts(products: Product[]): void {
    setToStorage(STORAGE_KEYS.PRODUCTS, products);
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  },

  upsertProduct(product: Product): void {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = { ...product, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...product, updatedAt: new Date().toISOString() });
    }
    this.saveProducts(list);
  },

  deleteProduct(productId: string): void {
    const list = this.getProducts().filter((p) => p.id !== productId);
    this.saveProducts(list);
  },

  adjustStock(productId: string, deltaBaseUnit: number, reason: string): Product | null {
    const list = this.getProducts();
    const product = list.find((p) => p.id === productId);
    if (!product) return null;

    product.stockInBaseUnit = Math.max(0, product.stockInBaseUnit + deltaBaseUnit);
    product.updatedAt = new Date().toISOString();
    this.saveProducts(list);

    // Record stock mutation
    this.recordStockCard({
      id: 'stk-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      type: deltaBaseUnit >= 0 ? 'restock' : 'penjualan',
      referenceNo: reason,
      qtyIn: deltaBaseUnit > 0 ? deltaBaseUnit : 0,
      qtyOut: deltaBaseUnit < 0 ? Math.abs(deltaBaseUnit) : 0,
      finalStock: product.stockInBaseUnit,
      baseUnit: product.baseUnit,
      notes: reason,
      operator: this.getSettings().activeCashier || 'Kasir',
    });

    return product;
  },

  // TRANSACTIONS
  getTransactions(): Transaction[] {
    const items = getFromStorage<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    if (items.length === 0) {
      this.saveTransactions(SEED_TRANSACTIONS);
      return SEED_TRANSACTIONS;
    }
    return items;
  },

  saveTransactions(transactions: Transaction[]): void {
    setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  recordTransaction(trx: Transaction): void {
    const list = this.getTransactions();
    list.unshift(trx);
    this.saveTransactions(list);

    // Deduct stock for each sold item
    const products = this.getProducts();
    trx.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const totalBaseUnitsToDeduct = item.quantity * item.conversionRate;
        prod.stockInBaseUnit = Math.max(0, prod.stockInBaseUnit - totalBaseUnitsToDeduct);
        prod.updatedAt = new Date().toISOString();

        // Stock Card Record
        this.recordStockCard({
          id: 'sc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          timestamp: trx.timestamp,
          productId: prod.id,
          productName: prod.name,
          type: 'penjualan',
          referenceNo: trx.invoiceNo,
          qtyIn: 0,
          qtyOut: totalBaseUnitsToDeduct,
          finalStock: prod.stockInBaseUnit,
          baseUnit: prod.baseUnit,
          notes: `Penjualan kasir (${item.quantity} ${item.unitName}) ke ${trx.customerName}`,
          operator: trx.cashierName,
        });
      }
    });
    this.saveProducts(products);

    // If Kasbon, record or update Customer Credit
    if (trx.isKasbon && trx.customerName) {
      this.addCustomerKasbon(trx);
    }
  },

  cancelTransaction(invoiceNo: string, reason: string): boolean {
    const list = this.getTransactions();
    const trx = list.find((t) => t.invoiceNo === invoiceNo);
    if (!trx || trx.status === 'cancelled') return false;

    trx.status = 'cancelled';
    trx.notes = (trx.notes ? trx.notes + ' | ' : '') + `Dibatalkan: ${reason}`;
    this.saveTransactions(list);

    // Return stock
    const products = this.getProducts();
    trx.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const totalBaseUnitsToReturn = item.quantity * item.conversionRate;
        prod.stockInBaseUnit += totalBaseUnitsToReturn;
        prod.updatedAt = new Date().toISOString();

        this.recordStockCard({
          id: 'sc-ret-' + Date.now(),
          timestamp: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          type: 'retur',
          referenceNo: `RETUR-${trx.invoiceNo}`,
          qtyIn: totalBaseUnitsToReturn,
          qtyOut: 0,
          finalStock: prod.stockInBaseUnit,
          baseUnit: prod.baseUnit,
          notes: `Retur pembatalan transaksi: ${reason}`,
          operator: this.getSettings().activeCashier,
        });
      }
    });
    this.saveProducts(products);

    // If was Kasbon, adjust customer balance
    if (trx.isKasbon) {
      const customers = this.getCustomers();
      const cust = customers.find((c) => c.customerName.toLowerCase() === trx.customerName.toLowerCase());
      if (cust) {
        cust.totalCredit = Math.max(0, cust.totalCredit - trx.total);
        cust.balance = Math.max(0, cust.totalCredit - cust.totalPaid);
        if (cust.balance <= 0) cust.status = 'lunas';
        cust.updatedAt = new Date().toISOString();
        this.saveCustomers(customers);
      }
    }

    return true;
  },

  // HELD ORDERS (Parkir Transaksi)
  getHeldOrders(): HeldOrder[] {
    return getFromStorage<HeldOrder[]>(STORAGE_KEYS.HELD_ORDERS, []);
  },

  saveHeldOrders(orders: HeldOrder[]): void {
    setToStorage(STORAGE_KEYS.HELD_ORDERS, orders);
  },

  holdOrder(order: HeldOrder): void {
    const list = this.getHeldOrders();
    list.unshift(order);
    this.saveHeldOrders(list);
  },

  removeHeldOrder(orderId: string): void {
    const list = this.getHeldOrders().filter((o) => o.id !== orderId);
    this.saveHeldOrders(list);
  },

  // CUSTOMERS & KASBON
  getCustomers(): CustomerCredit[] {
    const list = getFromStorage<CustomerCredit[]>(STORAGE_KEYS.CUSTOMERS, []);
    if (list.length === 0) {
      this.saveCustomers(SEED_CUSTOMERS);
      return SEED_CUSTOMERS;
    }
    return list;
  },

  saveCustomers(customers: CustomerCredit[]): void {
    setToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  addCustomerKasbon(trx: Transaction): void {
    const customers = this.getCustomers();
    let cust = customers.find(
      (c) => c.customerName.trim().toLowerCase() === trx.customerName.trim().toLowerCase()
    );

    if (!cust) {
      cust = {
        id: 'cust-' + Date.now(),
        customerName: trx.customerName,
        phone: trx.customerPhone || '',
        address: 'Alamat belum diatur',
        farmType: 'Peternak / Nelayan',
        totalCredit: trx.total,
        totalPaid: 0,
        balance: trx.total,
        creditLimit: 15000000,
        dueDate: trx.kasbonDueDate || '',
        status: 'belum_lunas',
        transactions: [trx.invoiceNo],
        paymentHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      customers.push(cust);
    } else {
      cust.totalCredit += trx.total;
      cust.balance = cust.totalCredit - cust.totalPaid;
      cust.status = cust.balance <= 0 ? 'lunas' : 'belum_lunas';
      if (trx.kasbonDueDate) cust.dueDate = trx.kasbonDueDate;
      if (trx.customerPhone && !cust.phone) cust.phone = trx.customerPhone;
      if (!cust.transactions.includes(trx.invoiceNo)) {
        cust.transactions.push(trx.invoiceNo);
      }
      cust.updatedAt = new Date().toISOString();
    }

    this.saveCustomers(customers);
  },

  payKasbon(customerId: string, amount: number, method: 'cash' | 'transfer' | 'qris', notes?: string, bankName?: string): CustomerCredit | null {
    const customers = this.getCustomers();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return null;

    cust.totalPaid += amount;
    cust.balance = Math.max(0, cust.totalCredit - cust.totalPaid);
    cust.status = cust.balance <= 0 ? 'lunas' : 'belum_lunas';
    cust.updatedAt = new Date().toISOString();

    const paymentRecord = {
      id: 'pay-' + Date.now(),
      date: new Date().toISOString(),
      amount,
      paymentMethod: method,
      bankName,
      receiver: this.getSettings().activeCashier,
      notes: notes || 'Pembayaran cicilan piutang',
    };

    cust.paymentHistory.unshift(paymentRecord);
    this.saveCustomers(customers);
    return cust;
  },

  // DELIVERIES & SURAT JALAN
  getDeliveries(): DeliveryNote[] {
    const list = getFromStorage<DeliveryNote[]>(STORAGE_KEYS.DELIVERIES, []);
    if (list.length === 0) {
      this.saveDeliveries(SEED_DELIVERIES);
      return SEED_DELIVERIES;
    }
    return list;
  },

  saveDeliveries(deliveries: DeliveryNote[]): void {
    setToStorage(STORAGE_KEYS.DELIVERIES, deliveries);
  },

  createDelivery(delivery: DeliveryNote): void {
    const list = this.getDeliveries();
    list.unshift(delivery);
    this.saveDeliveries(list);
  },

  updateDeliveryStatus(id: string, status: DeliveryNote['status'], recipientName?: string): void {
    const list = this.getDeliveries();
    const item = list.find((d) => d.id === id);
    if (item) {
      item.status = status;
      if (status === 'diterima') {
        item.receivedDate = new Date().toISOString();
        if (recipientName) item.recipientName = recipientName;
      }
      this.saveDeliveries(list);
    }
  },

  // STOCK OPNAMES
  getOpnames(): StockOpname[] {
    const list = getFromStorage<StockOpname[]>(STORAGE_KEYS.OPNAMES, []);
    if (list.length === 0) {
      this.saveOpnames(SEED_OPNAMES);
      return SEED_OPNAMES;
    }
    return list;
  },

  saveOpnames(opnames: StockOpname[]): void {
    setToStorage(STORAGE_KEYS.OPNAMES, opnames);
  },

  recordOpname(opname: StockOpname): void {
    const list = this.getOpnames();
    list.unshift(opname);
    this.saveOpnames(list);

    // Adjust the product's actual stock in base unit
    const products = this.getProducts();
    const prod = products.find((p) => p.id === opname.productId);
    if (prod) {
      prod.stockInBaseUnit = opname.physicalStock;
      prod.updatedAt = new Date().toISOString();
      this.saveProducts(products);

      // Record in stock card
      this.recordStockCard({
        id: 'sc-opn-' + Date.now(),
        timestamp: opname.date,
        productId: prod.id,
        productName: prod.name,
        type: 'opname',
        referenceNo: 'OPNAME-' + opname.date.slice(0, 10),
        qtyIn: opname.difference > 0 ? opname.difference : 0,
        qtyOut: opname.difference < 0 ? Math.abs(opname.difference) : 0,
        finalStock: prod.stockInBaseUnit,
        baseUnit: prod.baseUnit,
        notes: `Penyesuaian Fisik (${opname.reason}): ${opname.notes}`,
        operator: opname.operator,
      });
    }
  },

  // STOCK CARD (KARTU STOK)
  getStockCards(): StockCardRecord[] {
    return getFromStorage<StockCardRecord[]>(STORAGE_KEYS.STOCK_CARDS, []);
  },

  saveStockCards(cards: StockCardRecord[]): void {
    setToStorage(STORAGE_KEYS.STOCK_CARDS, cards);
  },

  recordStockCard(record: StockCardRecord): void {
    const list = this.getStockCards();
    list.unshift(record);
    // Keep last 1500 records to prevent memory bloat
    if (list.length > 1500) list.length = 1500;
    this.saveStockCards(list);
  },

  // RESTOCKS & IN-OUT
  getRestocks(): RestockOrder[] {
    const list = getFromStorage<RestockOrder[]>(STORAGE_KEYS.RESTOCKS, []);
    if (list.length === 0) {
      this.saveRestocks(SEED_RESTOCKS);
      return SEED_RESTOCKS;
    }
    return list;
  },

  saveRestocks(restocks: RestockOrder[]): void {
    setToStorage(STORAGE_KEYS.RESTOCKS, restocks);
  },

  recordRestock(order: RestockOrder): void {
    const list = this.getRestocks();
    list.unshift(order);
    this.saveRestocks(list);

    // Apply to product stocks
    const products = this.getProducts();
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const totalBaseUnits = item.quantity * item.conversionRate;
        const isAddition = order.type === 'restock_supplier' || order.type === 'branch_in';

        if (isAddition) {
          prod.stockInBaseUnit += totalBaseUnits;
          // Update unit cost price if supplier restock
          const unit = prod.units.find((u) => u.name === item.unitName);
          if (unit && item.costPrice > 0) {
            unit.costPrice = item.costPrice;
          }
          // Batch tracking if feed
          if (item.batchNumber && item.expiryDate) {
            if (!prod.batches) prod.batches = [];
            prod.batches.push({
              id: 'b-' + Date.now(),
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantity: totalBaseUnits,
            });
          }
        } else {
          // branch_out
          prod.stockInBaseUnit = Math.max(0, prod.stockInBaseUnit - totalBaseUnits);
        }

        prod.updatedAt = new Date().toISOString();

        // Record stock card
        this.recordStockCard({
          id: 'sc-rst-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          timestamp: new Date().toISOString(),
          productId: prod.id,
          productName: prod.name,
          type: order.type === 'restock_supplier' ? 'restock' : order.type === 'branch_in' ? 'transfer_in' : 'transfer_out',
          referenceNo: order.invoiceNo,
          qtyIn: isAddition ? totalBaseUnits : 0,
          qtyOut: !isAddition ? totalBaseUnits : 0,
          finalStock: prod.stockInBaseUnit,
          baseUnit: prod.baseUnit,
          notes: `${order.type === 'restock_supplier' ? 'Restock Pabrik' : order.type === 'branch_in' ? 'Masuk dr Cabang' : 'Keluar ke Cabang'}: ${order.supplierOrBranch}`,
          operator: order.operator,
        });
      }
    });

    this.saveProducts(products);
  },

  // STORE SETTINGS
  getSettings(): StoreSettings {
    return getFromStorage<StoreSettings>(STORAGE_KEYS.SETTINGS, SEED_SETTINGS);
  },

  saveSettings(settings: StoreSettings): void {
    setToStorage(STORAGE_KEYS.SETTINGS, settings);
  },

  // BACKUP & RESTORE
  exportFullBackup(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      products: this.getProducts(),
      transactions: this.getTransactions(),
      customers: this.getCustomers(),
      deliveries: this.getDeliveries(),
      opnames: this.getOpnames(),
      stockCards: this.getStockCards(),
      restocks: this.getRestocks(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.products) this.saveProducts(data.products);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.deliveries) this.saveDeliveries(data.deliveries);
      if (data.opnames) this.saveOpnames(data.opnames);
      if (data.stockCards) this.saveStockCards(data.stockCards);
      if (data.restocks) this.saveRestocks(data.restocks);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  },

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
    localStorage.removeItem(STORAGE_KEYS.OPNAMES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_CARDS);
    localStorage.removeItem(STORAGE_KEYS.RESTOCKS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.HELD_ORDERS);
  },

  // AUTHENTICATION (Login & Logout)
  getAuthCredentials(): AuthCredentials {
    const creds = getFromStorage<AuthCredentials>(STORAGE_KEYS.AUTH, DEFAULT_AUTH);
    if (!creds || !creds.username || !creds.password) {
      return DEFAULT_AUTH;
    }
    return creds;
  },

  saveAuthCredentials(creds: AuthCredentials): void {
    setToStorage(STORAGE_KEYS.AUTH, creds);
  },

  isLoggedIn(): boolean {
    try {
      // User must login when opening the application (session-based)
      return sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'true';
    } catch (e) {
      return false;
    }
  },

  login(username: string, password: string): { success: boolean; message?: string } {
    const creds = this.getAuthCredentials();
    const cleanUser = (username || '').trim().toLowerCase();
    const validUser = (creds.username || 'admin').trim().toLowerCase();
    const cleanPass = (password || '').trim();
    const validPass = (creds.password || 'admin').trim();

    if (cleanUser === validUser && cleanPass === validPass) {
      try {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, 'true');
        // Clear any old permanent localStorage session so it doesn't linger
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      } catch (e) {
        console.error('Session storage error:', e);
      }
      const updatedCreds = { ...creds, lastLogin: new Date().toISOString() };
      this.saveAuthCredentials(updatedCreds);
      return { success: true };
    }
    return {
      success: false,
      message: `Username atau password salah! Default sistem: username "${creds.username || 'admin'}" dan password "${creds.password || 'admin'}"`,
    };
  },

  logout(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  resetAuthCredentials(): void {
    this.saveAuthCredentials(DEFAULT_AUTH);
  },
};

