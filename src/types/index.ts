/**
 * AgroFish ERP & POS - Type Definitions
 */

export type ProductCategory = 'pakan' | 'alat_pancing' | string;

export interface ProductUnit {
  id: string;
  name: string;          // e.g. "Sak 50kg", "Kg (Eceran)", "Box (12 Pak)", "Pcs"
  conversionRate: number;// how many base units in this unit (e.g. 50 for Sak 50kg where base is kg)
  sellPrice: number;     // Harga jual
  costPrice: number;     // Harga modal / HPP
  barcode: string;       // Custom SKU or barcode for this specific unit
  isDefault?: boolean;
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;    // YYYY-MM-DD
  quantity: number;      // Quantity in base unit
  manufactureDate?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description?: string;
  baseUnit: string;        // "kg", "pcs", "meter", "bungkus", "sak"
  stockInBaseUnit: number; // Current stock balance in base unit
  minStockAlert: number;   // Trigger threshold for low stock
  units: ProductUnit[];    // Multi-unit tiers (e.g. Sak 50kg, Eceran kg)
  isFeed: boolean;         // True for animal feed / fish pellet
  batches?: ProductBatch[];// Expiration & batch tracking for feeds
  location?: string;       // Rak / Gudang
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  brand: string;
  unit: ProductUnit;
  quantity: number;        // Quantity in this selected unit
  sellPrice: number;       // Price per unit (can be overridden with discount)
  costPrice: number;       // HPP per unit
  subtotal: number;
  subtotalCost: number;
}

export interface HeldOrder {
  id: string;
  heldAt: string;
  customerName: string;
  note?: string;
  items: CartItem[];
  total: number;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'kasbon';

export interface TransactionItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  brand: string;
  unitName: string;
  conversionRate: number;
  quantity: number;
  sellPrice: number;
  costPrice: number;
  subtotal: number;
  subtotalCost: number;
  profit: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  grossProfit: number;
  profitMarginPercent: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  bankName?: string;
  isKasbon: boolean;
  kasbonDueDate?: string;
  kasbonStatus?: 'unpaid' | 'partial' | 'paid';
  status: 'completed' | 'cancelled';
  notes?: string;
  deliveryId?: string;
}

export interface KasbonPaymentRecord {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'qris';
  bankName?: string;
  receiver: string;
  notes?: string;
  referenceInvoice?: string;
}

export interface CustomerCredit {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  farmType: string;       // e.g. "Peternak Broiler 5.000 Ekor", "Tambak Patin", "Nelayan Pancing Tonda"
  totalCredit: number;    // Total piutang yang pernah diambil
  totalPaid: number;      // Total cicilan yang sudah dibayarkan
  balance: number;        // Sisa piutang (totalCredit - totalPaid)
  creditLimit: number;    // Batas kredit maksimal
  dueDate?: string;       // Estimasi panen / tanggal pelunasan
  status: 'belum_lunas' | 'lunas';
  transactions: string[]; // List of transaction invoice numbers
  paymentHistory: KasbonPaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 'persiapan' | 'dalam_pengiriman' | 'diterima' | 'dibatalkan';

export interface DeliveryNote {
  id: string;
  suratJalanNo: string;
  transactionInvoice: string;
  customerName: string;
  customerPhone: string;
  destinationAddress: string;
  driverName: string;
  vehicleNumber: string;
  deliveryDate: string;
  status: DeliveryStatus;
  items: {
    productName: string;
    unitName: string;
    quantity: number;
    notes?: string;
  }[];
  receivedDate?: string;
  recipientName?: string;
  notes?: string;
  createdAt: string;
}

export type OpnameReason = 
  | 'karung_sobek' 
  | 'susut_pakan' 
  | 'bonus_supplier' 
  | 'selisih_hitung' 
  | 'barang_rusak' 
  | 'lainnya';

export interface StockOpname {
  id: string;
  date: string;
  productId: string;
  productName: string;
  systemStock: number;      // in base unit
  physicalStock: number;    // in base unit
  difference: number;       // physical - system
  baseUnit: string;
  reason: OpnameReason;
  notes: string;
  operator: string;
}

export type MutationType = 
  | 'penjualan' 
  | 'restock' 
  | 'opname' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'retur';

export interface StockCardRecord {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  type: MutationType;
  referenceNo: string;
  qtyIn: number;
  qtyOut: number;
  finalStock: number;
  baseUnit: string;
  notes: string;
  operator: string;
}

export interface RestockOrder {
  id: string;
  type: 'restock_supplier' | 'branch_in' | 'branch_out';
  invoiceNo: string;
  date: string;
  supplierOrBranch: string;
  items: {
    productId: string;
    productName: string;
    unitName: string;
    conversionRate: number;
    quantity: number;
    costPrice: number;
    subtotal: number;
    batchNumber?: string;
    expiryDate?: string;
  }[];
  totalAmount: number;
  operator: string;
  notes: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
  lastLogin?: string;
}

export interface StoreSettings {
  storeName: string;
  storeSlogan: string;
  address: string;
  phone: string;
  receiptFooter: string;
  activeCashier: string;
  cashiers: string[];
  categories: string[];
  bankAccounts: BankAccount[];
  qrisPayload: string;
  paperSize: '80mm' | '58mm';
  enableSound: boolean;
  auth?: AuthCredentials;
}
