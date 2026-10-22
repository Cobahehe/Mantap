/**
 * POS Kasir Penjualan Cepat Component
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  ProductUnit,
  CartItem,
  HeldOrder,
  PaymentMethod,
  Transaction,
  StoreSettings,
  CustomerCredit,
} from '../../types';
import { StorageService } from '../../services/storage';
import { formatRupiah, formatNumber } from '../../utils/format';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  CreditCard,
  QrCode,
  Banknote,
  BookOpen,
  User,
  ArrowRight,
  Package,
  Fish,
  Wheat,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  settings: StoreSettings;
  customers: CustomerCredit[];
  onTransactionComplete: (trx: Transaction) => void;
  onOpenSuratJalan?: (trx: Transaction) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  settings,
  customers,
  onTransactionComplete,
  onOpenSuratJalan,
}) => {
  // POS States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Modals & Panels
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [selectedUnitProduct, setSelectedUnitProduct] = useState<Product | null>(null);
  const [completedTrx, setCompletedTrx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [selectedBank, setSelectedBank] = useState<string>(settings.bankAccounts[0]?.bankName || 'BCA');
  const [kasbonDueDate, setKasbonDueDate] = useState<string>('');
  const [trxNotes, setTrxNotes] = useState<string>('');
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  // Input refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load held orders on mount
  useEffect(() => {
    setHeldOrders(StorageService.getHeldOrders());
  }, []);

  // Keyboard shortcut listener (F2 to search, F4 to pay)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          openPaymentModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Subtotal & Grand Total
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchCat =
      selectedCategory === 'all' ||
      (selectedCategory === 'pakan' && prod.category === 'pakan') ||
      (selectedCategory === 'alat_pancing' && prod.category === 'alat_pancing') ||
      prod.category.toLowerCase() === selectedCategory.toLowerCase();

    if (!matchCat) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchName = prod.name.toLowerCase().includes(query);
    const matchSku = prod.sku.toLowerCase().includes(query);
    const matchBrand = prod.brand.toLowerCase().includes(query);
    const matchBarcode = prod.units.some((u) => u.barcode.includes(query));

    return matchName || matchSku || matchBrand || matchBarcode;
  });

  // Handle Barcode Scanner Enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim();
    // Find product having this unit barcode or sku
    let foundProduct: Product | undefined;
    let foundUnit: ProductUnit | undefined;

    for (const prod of products) {
      const u = prod.units.find((unit) => unit.barcode === query);
      if (u) {
        foundProduct = prod;
        foundUnit = u;
        break;
      }
      if (prod.sku.toLowerCase() === query.toLowerCase()) {
        foundProduct = prod;
        foundUnit = prod.units.find((unit) => unit.isDefault) || prod.units[0];
        break;
      }
    }

    if (foundProduct && foundUnit) {
      addToCart(foundProduct, foundUnit, 1);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode/SKU "${query}" tidak ditemukan!`);
    }
  };

  // Add Item to Cart
  const addToCart = (product: Product, unit: ProductUnit, quantity: number = 1) => {
    // Check available stock in base units
    const requiredBaseUnits = quantity * unit.conversionRate;
    const existingInCart = cart.find(
      (it) => it.productId === product.id && it.unit.id === unit.id
    );
    const existingQty = existingInCart ? existingInCart.quantity : 0;
    const totalProposedBaseUnits = (existingQty + quantity) * unit.conversionRate;

    if (totalProposedBaseUnits > product.stockInBaseUnit) {
      alert(
        `Stok tidak mencukupi!\nSisa stok: ${product.stockInBaseUnit} ${product.baseUnit}.\nPermintaan: ${totalProposedBaseUnits} ${product.baseUnit}`
      );
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (it) => it.productId === product.id && it.unit.id === unit.id
      );
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].quantity + quantity;
        next[idx] = {
          ...next[idx],
          quantity: newQty,
          subtotal: newQty * next[idx].sellPrice,
          subtotalCost: newQty * next[idx].costPrice,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            category: product.category,
            brand: product.brand,
            unit,
            quantity,
            sellPrice: unit.sellPrice,
            costPrice: unit.costPrice,
            subtotal: quantity * unit.sellPrice,
            subtotalCost: quantity * unit.costPrice,
          },
        ];
      }
    });

    setSelectedUnitProduct(null);
  };

  // Update Cart Quantity
  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const item = prev[idx];
      const product = products.find((p) => p.id === item.productId);
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }

      if (product) {
        const neededBase = newQty * item.unit.conversionRate;
        if (neededBase > product.stockInBaseUnit) {
          alert(`Stok tidak mencukupi! Tersisa ${product.stockInBaseUnit} ${product.baseUnit}.`);
          return prev;
        }
      }

      const next = [...prev];
      next[idx] = {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.sellPrice,
        subtotalCost: newQty * item.costPrice,
      };
      return next;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
      setDiscountAmount(0);
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // Hold / Parkir Transaksi
  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const name = customerName.trim() || `Pelanggan Antrean #${heldOrders.length + 1}`;
    const newHold: HeldOrder = {
      id: 'hold-' + Date.now(),
      heldAt: new Date().toISOString(),
      customerName: name,
      items: [...cart],
      total: grandTotal,
      note: trxNotes,
    };

    StorageService.holdOrder(newHold);
    setHeldOrders(StorageService.getHeldOrders());
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setTrxNotes('');
    setDiscountAmount(0);
    alert(`Transaksi atas nama "${name}" berhasil diparkir/ditahan.`);
  };

  const handleRecallOrder = (order: HeldOrder) => {
    if (cart.length > 0 && !confirm('Gantikan keranjang saat ini dengan transaksi yang diparkir?')) {
      return;
    }
    setCart(order.items);
    setCustomerName(order.customerName);
    setTrxNotes(order.note || '');
    StorageService.removeHeldOrder(order.id);
    setHeldOrders(StorageService.getHeldOrders());
    setIsHeldModalOpen(false);
  };

  const handleDeleteHeldOrder = (orderId: string) => {
    StorageService.removeHeldOrder(orderId);
    setHeldOrders(StorageService.getHeldOrders());
  };

  // Open Payment Modal
  const openPaymentModal = () => {
    setPaymentMethod('cash');
    setCashGiven(grandTotal);
    setIsPaymentModalOpen(true);
  };

  // Process Checkout
  const handleProcessCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && cashGiven < grandTotal) {
      alert('Jumlah uang tunai kurang dari total belanja!');
      return;
    }

    if (paymentMethod === 'kasbon' && !customerName.trim()) {
      alert('Wajib mengisi atau memilih nama pelanggan untuk transaksi Kasbon/Piutang!');
      return;
    }

    const totalCost = cart.reduce((acc, it) => acc + it.subtotalCost, 0);
    const grossProfit = grandTotal - totalCost;
    const profitMargin = grandTotal > 0 ? (grossProfit / grandTotal) * 100 : 0;
    const change = paymentMethod === 'cash' ? cashGiven - grandTotal : 0;

    const invoiceNo = 'TRX-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const transaction: Transaction = {
      id: 'trx-' + Date.now(),
      invoiceNo,
      timestamp: new Date().toISOString(),
      cashierName: settings.activeCashier,
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerPhone: customerPhone.trim() || undefined,
      items: cart.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        category: it.category,
        brand: it.brand,
        unitName: it.unit.name,
        conversionRate: it.unit.conversionRate,
        quantity: it.quantity,
        sellPrice: it.sellPrice,
        costPrice: it.costPrice,
        subtotal: it.subtotal,
        subtotalCost: it.subtotalCost,
        profit: it.subtotal - it.subtotalCost,
      })),
      subtotal,
      discount: discountAmount,
      total: grandTotal,
      totalCost,
      grossProfit,
      profitMarginPercent: parseFloat(profitMargin.toFixed(2)),
      paymentMethod,
      amountPaid: paymentMethod === 'cash' ? cashGiven : grandTotal,
      changeAmount: change,
      bankName: paymentMethod === 'transfer' ? selectedBank : undefined,
      isKasbon: paymentMethod === 'kasbon',
      kasbonDueDate: paymentMethod === 'kasbon' ? kasbonDueDate : undefined,
      kasbonStatus: paymentMethod === 'kasbon' ? 'unpaid' : undefined,
      status: 'completed',
      notes: trxNotes,
    };

    StorageService.recordTransaction(transaction);
    onTransactionComplete(transaction);

    // Reset Cart & Close Modal
    setCart([]);
    setDiscountAmount(0);
    setCustomerName('');
    setCustomerPhone('');
    setTrxNotes('');
    setIsPaymentModalOpen(false);

    // Show Receipt Modal
    setCompletedTrx(transaction);
    setIsReceiptOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* LEFT / CENTER: Products Browser */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-800 overflow-hidden">
        {/* Top Control Bar: Search & Barcode */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari produk pakan / alat pancing (Tekan F2)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Barcode Scanner Box */}
          <form onSubmit={handleBarcodeSubmit} className="relative w-64">
            <Barcode className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-emerald-300 placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
          </form>

          {/* Parked Orders Indicator */}
          {heldOrders.length > 0 && (
            <button
              onClick={() => setIsHeldModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition-colors animate-pulse"
            >
              <PauseCircle className="w-4 h-4" />
              <span>{heldOrders.length} Pesanan Diparkir</span>
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Semua Produk ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('pakan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'pakan'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Wheat className="w-3.5 h-3.5" />
            Pakan Ternak & Pelet Ikan
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('alat_pancing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'alat_pancing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Fish className="w-3.5 h-3.5" />
            Alat Pancing & Nelayan
          </button>

          {/* User defined custom categories */}
          {settings.categories
            .filter((c) => c !== 'pakan' && c !== 'alat_pancing')
            .map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 auto-rows-max">
          {filteredProducts.map((prod) => {
            const defaultUnit = prod.units.find((u) => u.isDefault) || prod.units[0];
            const isOutOfStock = prod.stockInBaseUnit <= 0;
            const isLowStock = prod.stockInBaseUnit <= prod.minStockAlert;
            const isFeed = prod.category === 'pakan' || prod.isFeed;

            return (
              <div
                key={prod.id}
                className={`relative flex flex-col justify-between bg-slate-900 border rounded-2xl p-4 transition-all duration-200 hover:shadow-lg ${
                  isOutOfStock
                    ? 'border-red-900/40 opacity-60'
                    : isLowStock
                    ? 'border-amber-500/40 hover:border-amber-400'
                    : 'border-slate-800 hover:border-emerald-500/60'
                }`}
              >
                <div>
                  {/* Category & Brand Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isFeed
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {isFeed ? <Wheat className="w-2.5 h-2.5" /> : <Fish className="w-2.5 h-2.5" />}
                      {isFeed ? 'Pakan' : 'Pancing'}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">{prod.sku}</span>
                  </div>

                  {/* Title & Brand */}
                  <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">{prod.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{prod.brand}</p>

                  {/* Stock Status */}
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Stok Tersedia:</span>
                    <span
                      className={`font-semibold ${
                        isOutOfStock
                          ? 'text-red-400'
                          : isLowStock
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatNumber(prod.stockInBaseUnit)} {prod.baseUnit}
                      {/* Show Sak estimation if feed */}
                      {prod.baseUnit === 'kg' && defaultUnit.conversionRate > 1 && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          (~{Math.floor(prod.stockInBaseUnit / defaultUnit.conversionRate)} {defaultUnit.name.split(' ')[0]})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Pricing & Add to Cart Action */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-medium">Harga ({defaultUnit.name}):</span>
                    <span className="font-extrabold text-sm text-emerald-400">
                      {formatRupiah(defaultUnit.sellPrice)}
                    </span>
                  </div>

                  {/* Multi-unit choose button or Quick Add */}
                  {prod.units.length > 1 ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(prod, defaultUnit, 1)}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {defaultUnit.name.includes('Sak') ? 'Sak 50kg' : 'Default'}
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedUnitProduct(prod)}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        Pilih Satuan
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(prod, defaultUnit, 1)}
                      className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah ke Kasir
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS Cart Panel */}
      <div className="w-full lg:w-96 bg-slate-900 flex flex-col h-full border-t lg:border-t-0 lg:border-l border-slate-800">
        {/* Cart Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Keranjang Kasir</h3>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full">
              {cart.reduce((sum, it) => sum + it.quantity, 0)} item
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              title="Kosongkan Keranjang"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Customer Quick Selector */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              list="customer-suggestions"
              placeholder="Nama Pelanggan / Peternak..."
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                const found = customers.find(
                  (c) => c.customerName.toLowerCase() === e.target.value.toLowerCase()
                );
                if (found && found.phone) setCustomerPhone(found.phone);
              }}
              className="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <datalist id="customer-suggestions">
              {customers.map((c) => (
                <option key={c.id} value={c.customerName}>
                  {c.farmType} | Sisa Hutang: {formatRupiah(c.balance)}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item, idx) => (
            <div
              key={`${item.productId}-${item.unit.id}`}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-xs text-white truncate">{item.productName}</h5>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span className="px-1.5 py-0.2 bg-slate-800 text-emerald-400 rounded font-medium">
                      {item.unit.name}
                    </span>
                    <span>@ {formatRupiah(item.sellPrice)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(idx)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => updateCartQty(idx, -1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCartQty(idx, 1)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-xs text-white">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-20 text-center text-slate-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-500 mt-1">Pilih produk di sebelah kiri atau scan barcode.</p>
            </div>
          )}
        </div>

        {/* Cart Bottom Summary & Checkout */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Subtotal & Discount */}
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-white">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Diskon (Rp):</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total Bayar:</span>
              <span className="text-emerald-400 text-lg">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          {/* Action Buttons: Hold Order & Pay */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleHoldOrder}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex flex-col items-center justify-center gap-1"
            >
              <PauseCircle className="w-4 h-4" />
              Parkir (Tahan)
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={openPaymentModal}
              className="col-span-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
            >
              <span>Bayar (F4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* UNIT SELECTOR MODAL (Multi-Satuan) */}
      {selectedUnitProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-white text-base">{selectedUnitProduct.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih satuan penjualan (Tersedia: {selectedUnitProduct.stockInBaseUnit} {selectedUnitProduct.baseUnit})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUnitProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 my-4">
              {selectedUnitProduct.units.map((unit) => {
                const availableForThisUnit = Math.floor(
                  selectedUnitProduct.stockInBaseUnit / unit.conversionRate
                );
                const isOutOfStock = availableForThisUnit <= 0;

                return (
                  <div
                    key={unit.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addToCart(selectedUnitProduct, unit, 1);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isOutOfStock
                        ? 'border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed'
                        : 'border-slate-700 bg-slate-950 hover:border-emerald-500 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{unit.name}</span>
                        {unit.isDefault && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-semibold">
                            Utama
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Konversi: 1 {unit.name} = {unit.conversionRate} {selectedUnitProduct.baseUnit}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Maksimal tersedia: {availableForThisUnit} {unit.name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400 text-sm">
                        {formatRupiah(unit.sellPrice)}
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-[11px] font-semibold rounded-md transition-colors"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSelectedUnitProduct(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* HELD ORDERS MODAL (Parkir Transaksi) */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Antrean Transaksi Parkir</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {heldOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-bold text-sm text-white">{order.customerName}</h5>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{order.items.length} Barang</span>
                      <span>Total: <strong className="text-emerald-400">{formatRupiah(order.total)}</strong></span>
                      <span className="text-slate-500">
                        {new Date(order.heldAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRecallOrder(order)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Pulihkan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHeldOrder(order.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {heldOrders.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm font-semibold">Tidak ada transaksi yang sedang diparkir.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsHeldModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL (Metode Pembayaran Lengkap) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-extrabold text-white">Pembayaran Kasir</h3>
                <p className="text-xs text-slate-400">Total Tagihan: <span className="font-extrabold text-emerald-400 text-sm">{formatRupiah(grandTotal)}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setCashGiven(grandTotal);
                }}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-bold">Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs font-bold">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'transfer'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('kasbon')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'kasbon'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold">Kasbon/Tempo</span>
              </button>
            </div>

            {/* TUNAI FORM */}
            {paymentMethod === 'cash' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">
                  Uang Tunai Diterima (Rp):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={grandTotal}
                    step="1000"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Quick Nominal Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashGiven(grandTotal)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000, 200000, 500000, 1000000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setCashGiven(nom)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
                    >
                      {formatNumber(nom)}
                    </button>
                  ))}
                </div>

                {/* Change Calculation */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Uang Kembalian:</span>
                  <span
                    className={`font-mono font-extrabold text-base ${
                      cashGiven >= grandTotal ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {cashGiven >= grandTotal
                      ? formatRupiah(cashGiven - grandTotal)
                      : `Kurang ${formatRupiah(grandTotal - cashGiven)}`}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS FORM */}
            {paymentMethod === 'qris' && (
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-3">
                <div className="w-44 h-44 bg-white p-2.5 rounded-xl mx-auto shadow-md flex items-center justify-center">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AGROFISH-POS-QRIS-SIMULATION"
                    alt="QRIS Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">{settings.storeName}</h5>
                  <p className="text-xs text-slate-400">Scan QRIS menggunakan BCA Mobile, Mandiri Livin, BRImo, GoPay, OVO, atau DANA</p>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 font-medium">
                  Total Tagihan: {formatRupiah(grandTotal)}
                </div>
              </div>
            )}

            {/* TRANSFER BANK FORM */}
            {paymentMethod === 'transfer' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-semibold text-slate-300 block">Pilih Rekening Tujuan:</label>
                <div className="space-y-2">
                  {settings.bankAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedBank(acc.bankName)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedBank === acc.bankName
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{acc.bankName}</div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">{acc.accountNumber}</div>
                        <div className="text-[11px] text-slate-500">a.n. {acc.holderName}</div>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold">
                        {selectedBank === acc.bankName ? '✓ Dipilih' : 'Pilih'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KASBON / PIUTANG FORM */}
            {paymentMethod === 'kasbon' && (
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <BookOpen className="w-4 h-4" />
                  <span>Sistem Tempo / Kasbon (Khusus Peternak & Nelayan)</span>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Nama Pelanggan / Kelompok Tani *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: H. Rohman (Kandang Sukamaju)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Nomor WhatsApp / HP Pelanggan
                  </label>
                  <input
                    type="tel"
                    placeholder="0812-xxxx-xxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Estimasi Jatuh Tempo / Tanggal Panen
                  </label>
                  <input
                    type="date"
                    value={kasbonDueDate}
                    onChange={(e) => setKasbonDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* General Transaction Notes */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Catatan Tambahan Transaksi (Opsional):</label>
              <input
                type="text"
                placeholder="Misal: Ambil pakai pick-up sendiri, titip bayar..."
                value={trxNotes}
                onChange={(e) => setTrxNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleProcessCheckout}
                className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/40 transition-colors flex items-center justify-center gap-2"
              >
                <span>Selesaikan Transaksi ({formatRupiah(grandTotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      <ReceiptModal
        transaction={completedTrx}
        settings={settings}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onOpenSuratJalan={onOpenSuratJalan}
      />
    </div>
  );
};
