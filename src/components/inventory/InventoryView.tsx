/**
 * Inventory & Stock Management Component
 */

import React, { useState } from 'react';
import {
  Product,
  ProductUnit,
  StockOpname,
  StockCardRecord,
  StoreSettings,
  OpnameReason,
} from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatRupiah,
  formatNumber,
  formatDate,
  formatDateTime,
  checkExpiryStatus,
  exportToCsv,
} from '../../utils/format';
import {
  Package,
  Plus,
  AlertTriangle,
  Calendar,
  Layers,
  FileSpreadsheet,
  Trash2,
  Edit,
  ClipboardList,
  Search,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Filter,
  Wheat,
  Fish,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  settings: StoreSettings;
  onRefreshProducts: () => void;
  onUpdateSettings: (settings: StoreSettings) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  settings,
  onRefreshProducts,
  onUpdateSettings,
}) => {
  // Navigation Tabs within Inventory
  const [activeTab, setActiveTab] = useState<
    'products' | 'add_product' | 'expiry' | 'low_stock' | 'opname' | 'stock_cards'
  >('products');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Opname Modal
  const [opnameProduct, setOpnameProduct] = useState<Product | null>(null);
  const [opnamePhysicalStock, setOpnamePhysicalStock] = useState<number>(0);
  const [opnameReason, setOpnameReason] = useState<OpnameReason>('susut_pakan');
  const [opnameNotes, setOpnameNotes] = useState('');

  // Stock Cards Filter
  const [selectedStockCardProductId, setSelectedStockCardProductId] = useState<string>('all');
  const [stockCards, setStockCards] = useState<StockCardRecord[]>(StorageService.getStockCards());

  // Edit / Add Product State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<{
    id?: string;
    sku: string;
    name: string;
    category: string;
    newCategoryName: string;
    brand: string;
    description: string;
    baseUnit: string;
    stockInBaseUnit: number;
    minStockAlert: number;
    isFeed: boolean;
    location: string;
    units: ProductUnit[];
    batchNumber: string;
    expiryDate: string;
  }>({
    sku: '',
    name: '',
    category: 'pakan',
    newCategoryName: '',
    brand: '',
    description: '',
    baseUnit: 'kg',
    stockInBaseUnit: 100,
    minStockAlert: 20,
    isFeed: true,
    location: 'Gudang Utama',
    units: [
      {
        id: 'u-1',
        name: 'Sak 50 Kg',
        conversionRate: 50,
        sellPrice: 450000,
        costPrice: 400000,
        barcode: '',
        isDefault: true,
      },
      {
        id: 'u-2',
        name: 'Eceran (Kg)',
        conversionRate: 1,
        sellPrice: 10000,
        costPrice: 8000,
        barcode: '',
      },
    ],
    batchNumber: '',
    expiryDate: '',
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    if (!matchCat) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  });

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stockInBaseUnit <= p.minStockAlert);

  // Feeds with batches for Expiry Tracking
  const feedBatches = products
    .filter((p) => p.isFeed && p.batches && p.batches.length > 0)
    .flatMap((p) =>
      (p.batches || []).map((b) => ({
        product: p,
        batch: b,
        expiryInfo: checkExpiryStatus(b.expiryDate),
      }))
    )
    .sort((a, b) => new Date(a.batch.expiryDate).getTime() - new Date(b.batch.expiryDate).getTime());

  // Handle Export CSV
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Nama Produk',
      'Kategori',
      'Merk',
      'Stok Dasar',
      'Satuan Dasar',
      'Satuan Utama',
      'Harga Jual Utama',
      'HPP Modal Utama',
      'Lokasi Gudang',
    ];

    const rows = products.map((p) => {
      const defaultUnit = p.units.find((u) => u.isDefault) || p.units[0];
      return [
        p.sku,
        p.name,
        p.category,
        p.brand,
        p.stockInBaseUnit,
        p.baseUnit,
        defaultUnit ? defaultUnit.name : '-',
        defaultUnit ? defaultUnit.sellPrice : 0,
        defaultUnit ? defaultUnit.costPrice : 0,
        p.location || '-',
      ];
    });

    exportToCsv(`Data_Stok_Barang_AgroFish_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Open Edit Form
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    const firstBatch = p.batches && p.batches[0];
    setFormData({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      newCategoryName: '',
      brand: p.brand,
      description: p.description || '',
      baseUnit: p.baseUnit,
      stockInBaseUnit: p.stockInBaseUnit,
      minStockAlert: p.minStockAlert,
      isFeed: p.isFeed,
      location: p.location || '',
      units: [...p.units],
      batchNumber: firstBatch ? firstBatch.batchNumber : '',
      expiryDate: firstBatch ? firstBatch.expiryDate : '',
    });
    setActiveTab('add_product');
  };

  // Handle Unit Row in Form
  const handleAddUnitRow = () => {
    setFormData((prev) => ({
      ...prev,
      units: [
        ...prev.units,
        {
          id: 'u-' + Date.now(),
          name: '',
          conversionRate: 1,
          sellPrice: 0,
          costPrice: 0,
          barcode: '',
          isDefault: false,
        },
      ],
    }));
  };

  const handleRemoveUnitRow = (index: number) => {
    if (formData.units.length <= 1) {
      alert('Minimal harus memiliki 1 satuan!');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index),
    }));
  };

  const handleUnitChange = (index: number, field: keyof ProductUnit, value: any) => {
    setFormData((prev) => {
      const nextUnits = [...prev.units];
      nextUnits[index] = { ...nextUnits[index], [field]: value };
      if (field === 'isDefault' && value === true) {
        nextUnits.forEach((u, i) => {
          if (i !== index) u.isDefault = false;
        });
      }
      return { ...prev, units: nextUnits };
    });
  };

  // Save Product Submit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('Nama produk dan SKU wajib diisi!');
      return;
    }

    let finalCategory = formData.category;
    if (formData.category === '__custom__' && formData.newCategoryName.trim()) {
      finalCategory = formData.newCategoryName.trim();
      if (!settings.categories.includes(finalCategory)) {
        const nextCats = [...settings.categories, finalCategory];
        const nextSettings = { ...settings, categories: nextCats };
        StorageService.saveSettings(nextSettings);
        onUpdateSettings(nextSettings);
      }
    }

    const prodId = formData.id || 'prod-' + Date.now();
    const batches = formData.isFeed && formData.batchNumber && formData.expiryDate
      ? [
          {
            id: 'b-' + Date.now(),
            batchNumber: formData.batchNumber,
            expiryDate: formData.expiryDate,
            quantity: formData.stockInBaseUnit,
          },
        ]
      : editingProduct?.batches || [];

    const newProduct: Product = {
      id: prodId,
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: finalCategory,
      brand: formData.brand.trim() || 'Umum',
      description: formData.description.trim(),
      baseUnit: formData.baseUnit.trim().toLowerCase(),
      stockInBaseUnit: Number(formData.stockInBaseUnit),
      minStockAlert: Number(formData.minStockAlert),
      units: formData.units.map((u, i) => ({
        ...u,
        name: u.name || `Satuan #${i + 1}`,
        conversionRate: Number(u.conversionRate) || 1,
        sellPrice: Number(u.sellPrice) || 0,
        costPrice: Number(u.costPrice) || 0,
        barcode: u.barcode ? u.barcode.trim() : `${formData.sku}-${i + 1}`,
      })),
      isFeed: formData.isFeed,
      batches,
      location: formData.location.trim() || 'Gudang Utama',
      updatedAt: new Date().toISOString(),
    };

    StorageService.upsertProduct(newProduct);
    onRefreshProducts();
    alert('Data produk berhasil disimpan!');
    setEditingProduct(null);
    setActiveTab('products');
  };

  // Submit Stock Opname
  const handleSaveOpname = () => {
    if (!opnameProduct) return;

    const diff = opnamePhysicalStock - opnameProduct.stockInBaseUnit;
    const opname: StockOpname = {
      id: 'opn-' + Date.now(),
      date: new Date().toISOString(),
      productId: opnameProduct.id,
      productName: opnameProduct.name,
      systemStock: opnameProduct.stockInBaseUnit,
      physicalStock: opnamePhysicalStock,
      difference: diff,
      baseUnit: opnameProduct.baseUnit,
      reason: opnameReason,
      notes: opnameNotes || 'Penyesuaian fisik opname rutin',
      operator: settings.activeCashier,
    };

    StorageService.recordOpname(opname);
    onRefreshProducts();
    setStockCards(StorageService.getStockCards());
    setOpnameProduct(null);
    setOpnameNotes('');
    alert(
      `Stock Opname berhasil disimpan!\nStok ${opnameProduct.name} disesuaikan menjadi ${opnamePhysicalStock} ${opnameProduct.baseUnit} (Selisih: ${diff > 0 ? '+' : ''}${diff} ${opnameProduct.baseUnit}).`
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Inventory Navigation Sub-Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setEditingProduct(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Master Data ({products.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('add_product');
              setEditingProduct(null);
              setFormData({
                sku: `AGR-${Date.now().toString().slice(-4)}`,
                name: '',
                category: 'pakan',
                newCategoryName: '',
                brand: '',
                description: '',
                baseUnit: 'kg',
                stockInBaseUnit: 50,
                minStockAlert: 10,
                isFeed: true,
                location: 'Gudang Utama',
                units: [
                  {
                    id: 'u-1',
                    name: 'Sak 50 Kg',
                    conversionRate: 50,
                    sellPrice: 450000,
                    costPrice: 400000,
                    barcode: '',
                    isDefault: true,
                  },
                  {
                    id: 'u-2',
                    name: 'Eceran (Kg)',
                    conversionRate: 1,
                    sellPrice: 10000,
                    costPrice: 8000,
                    barcode: '',
                  },
                ],
                batchNumber: '',
                expiryDate: '',
              });
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'add_product'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expiry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'expiry'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Pelacakan Expired & Batch ({feedBatches.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('low_stock')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'low_stock'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Stok Menipis ({lowStockProducts.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('stock_cards');
              setStockCards(StorageService.getStockCards());
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stock_cards'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Kartu Stok & Mutasi
          </button>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Excel / CSV
        </button>
      </div>

      {/* TAB 1: MASTER DATA PRODUCTS TABLE */}
      {activeTab === 'products' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, SKU, atau merk produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="pakan">Pakan Ternak & Pelet Ikan</option>
                <option value="alat_pancing">Alat Pancing & Nelayan</option>
                {settings.categories
                  .filter((c) => c !== 'pakan' && c !== 'alat_pancing')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Produk & Merk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Satuan & Konversi</th>
                  <th className="px-4 py-3 text-right">Harga Jual Utama</th>
                  <th className="px-4 py-3 text-right">HPP Modal</th>
                  <th className="px-4 py-3 text-center">Stok Fisik</th>
                  <th className="px-4 py-3">Lokasi Rak</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((p) => {
                  const defaultUnit = p.units.find((u) => u.isDefault) || p.units[0];
                  const isLow = p.stockInBaseUnit <= p.minStockAlert;
                  const isZero = p.stockInBaseUnit <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs">{p.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-400">{p.sku}</span>
                          <span>•</span>
                          <span>{p.brand}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.category === 'pakan'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {p.category === 'pakan' ? <Wheat className="w-3 h-3" /> : <Fish className="w-3 h-3" />}
                          {p.category === 'pakan'
                            ? 'Pakan Ternak'
                            : p.category === 'alat_pancing'
                            ? 'Alat Pancing'
                            : p.category}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {p.units.map((u) => (
                            <div key={u.id} className="text-[11px] text-slate-300">
                              <span className="font-semibold text-white">{u.name}</span>
                              <span className="text-slate-500 ml-1">
                                (1 {u.name} = {u.conversionRate} {p.baseUnit})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-extrabold text-emerald-400">
                        {defaultUnit ? formatRupiah(defaultUnit.sellPrice) : '-'}
                      </td>

                      <td className="px-4 py-3 text-right text-slate-400 font-mono">
                        {defaultUnit ? formatRupiah(defaultUnit.costPrice) : '-'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                            isZero
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {formatNumber(p.stockInBaseUnit)} {p.baseUnit}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {p.location || 'Gudang Utama'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock Opname Button */}
                          <button
                            type="button"
                            title="Penyesuaian Fisik (Stock Opname)"
                            onClick={() => {
                              setOpnameProduct(p);
                              setOpnamePhysicalStock(p.stockInBaseUnit);
                              setOpnameReason('susut_pakan');
                              setOpnameNotes('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            title="Edit Produk"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            title="Hapus Produk"
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                                StorageService.deleteProduct(p.id);
                                onRefreshProducts();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TAMBAH / EDIT PRODUK BARU WITH MULTI-SATUAN BUILDER */}
      {activeTab === 'add_product' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lengkapi informasi master produk, kategori, dan struktur sistem multi-satuan (Sak, Box, Pak, Pcs, Kg).
              </p>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nama Produk Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pakan Ayam Broiler BR-1 Starter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kode SKU / Barcode Induk *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PKN-BR1-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kategori Barang *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pakan">Pakan Ternak & Pelet Ikan</option>
                    <option value="alat_pancing">Alat Pancing & Nelayan</option>
                    {settings.categories
                      .filter((c) => c !== 'pakan' && c !== 'alat_pancing')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    <option value="__custom__">+ Tambah Kategori Manual Baru...</option>
                  </select>

                  {formData.category === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Ketik nama kategori baru..."
                      value={formData.newCategoryName}
                      onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                      className="mt-2 w-full bg-slate-950 border border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Merk / Pabrikan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Charoen Pokphand / Shimano / Relix"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Satuan Dasar Terkecil (Base Unit) *
                  </label>
                  <select
                    value={formData.baseUnit}
                    onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="kg">Kilogram (kg) - untuk pakan curah/sak</option>
                    <option value="pcs">Pieces (pcs) - untuk reel, joran, umpan</option>
                    <option value="bungkus">Bungkus - untuk kail, essen, suplemen</option>
                    <option value="roll">Roll - untuk senar pancing & tali</option>
                    <option value="meter">Meter - untuk jaring/tali tambang</option>
                    <option value="botol">Botol - untuk essen & vitamin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Stok Awal Fisik (dalam Satuan Dasar) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockInBaseUnit}
                    onChange={(e) => setFormData({ ...formData, stockInBaseUnit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Batas Peringatan Stok Menipis (Alert)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Lokasi Rak / Gudang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Gudang Pakan A-01 / Etalase Reel"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* SECTION: SISTEM MULTI-SATUAN & ECERAN */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Konfigurasi Sistem Multi-Satuan (Sak, Box, Pak, Pcs, Eceran)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tentukan berbagai satuan jual untuk produk ini. Misal: 1 Karung = 50 kg; atau 1 Box = 12 Pak; atau 1 Bungkus = 12 Pcs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddUnitRow}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Satuan Lain
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.units.map((unit, idx) => (
                    <div
                      key={unit.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
                    >
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Nama Satuan:</label>
                        <input
                          type="text"
                          required
                          placeholder="Misal: Sak 50 Kg / Box 12 Pak"
                          value={unit.name}
                          onChange={(e) => handleUnitChange(idx, 'name', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">
                          Isi ({formData.baseUnit}):
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={unit.conversionRate}
                          onChange={(e) => handleUnitChange(idx, 'conversionRate', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Harga Jual (Rp):</label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          required
                          value={unit.sellPrice}
                          onChange={(e) => handleUnitChange(idx, 'sellPrice', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Modal / HPP (Rp):</label>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={unit.costPrice}
                          onChange={(e) => handleUnitChange(idx, 'costPrice', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 sm:pt-0">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="radio"
                            name="defaultUnit"
                            checked={unit.isDefault || false}
                            onChange={() => handleUnitChange(idx, 'isDefault', true)}
                            className="accent-emerald-500"
                          />
                          <span>Utama</span>
                        </label>

                        {formData.units.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitRow(idx)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BATCH & EXPIRED DATE SECTION */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">
                    Pelacakan Batch & Tanggal Kadaluarsa (Khusus Pakan Ternak)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Nomor Batch Pabrik:</label>
                    <input
                      type="text"
                      placeholder="Contoh: BATCH-CP-202610-09"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Tanggal Kadaluarsa (Expired Date):</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-colors"
                >
                  Simpan Data Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: PELACAKAN EXPIRED DATE & BATCH */}
      {activeTab === 'expiry' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3">
            <Calendar className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Monitoring Masa Kadaluarsa Pakan & Pelet Ikan</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Pakan ternak yang disimpan lebih dari masa simpan akan mengalami penurunan kadar protein dan risiko jamur aflatoksin. Utamakan metode FIFO (First-In, First-Out).
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Pakan Ternak</th>
                  <th className="px-4 py-3">No. Batch Pabrik</th>
                  <th className="px-4 py-3">Tanggal Expired</th>
                  <th className="px-4 py-3 text-center">Sisa Hari</th>
                  <th className="px-4 py-3 text-center">Status Keamanan</th>
                  <th className="px-4 py-3 text-right">Kuantitas Batch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {feedBatches.map(({ product, batch, expiryInfo }, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{product.name}</div>
                      <div className="text-[11px] text-slate-400">{product.brand}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{batch.batchNumber}</td>
                    <td className="px-4 py-3 font-medium text-white">{formatDate(batch.expiryDate)}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      {expiryInfo.daysLeft < 0 ? (
                        <span className="text-red-400">{Math.abs(expiryInfo.daysLeft)} hari lalu</span>
                      ) : (
                        <span className={expiryInfo.daysLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                          {expiryInfo.daysLeft} hari lagi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          expiryInfo.status === 'expired'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : expiryInfo.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {expiryInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      {formatNumber(batch.quantity)} {product.baseUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PERINGATAN STOK MENIPIS (LOW STOCK ALERT) */}
      {activeTab === 'low_stock' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Peringatan Stok Menipis & Habis</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Segera lakukan pemesanan restock ke distributor pabrik agar pasokan pelanggan peternak dan nelayan tidak terputus.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((p) => {
              const defaultUnit = p.units.find((u) => u.isDefault) || p.units[0];
              const isZero = p.stockInBaseUnit <= 0;

              return (
                <div
                  key={p.id}
                  className="p-4 bg-slate-900 border border-red-900/40 rounded-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isZero ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {isZero ? 'HABIS' : 'MENIPIS'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mt-2">{p.name}</h4>
                    <p className="text-xs text-slate-400">{p.brand} • {p.location}</p>

                    <div className="mt-3 p-3 bg-slate-950 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sisa Stok:</span>
                        <span className="font-bold text-red-400 font-mono">
                          {p.stockInBaseUnit} {p.baseUnit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Batas Minimal:</span>
                        <span className="font-mono text-slate-300">{p.minStockAlert} {p.baseUnit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-emerald-400 font-bold">
                      {defaultUnit ? formatRupiah(defaultUnit.sellPrice) : '-'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOpnameProduct(p);
                        setOpnamePhysicalStock(p.stockInBaseUnit);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                    >
                      Opname Fisik
                    </button>
                  </div>
                </div>
              );
            })}

            {lowStockProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500/40" />
                <p className="text-base font-semibold text-white">Semua Stok Barang Terkendali</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada produk yang berada di bawah ambang batas minimal.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: KARTU STOK & RIWAYAT MUTASI */}
      {activeTab === 'stock_cards' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs text-slate-400">Filter Produk:</span>
            <select
              value={selectedStockCardProductId}
              onChange={(e) => setSelectedStockCardProductId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="all">Semua Produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Waktu & Tanggal</th>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3">Jenis Mutasi</th>
                  <th className="px-4 py-3">No. Referensi</th>
                  <th className="px-4 py-3 text-center text-emerald-400">Masuk (+)</th>
                  <th className="px-4 py-3 text-center text-red-400">Keluar (-)</th>
                  <th className="px-4 py-3 text-center font-bold">Stok Akhir</th>
                  <th className="px-4 py-3">Keterangan / Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stockCards
                  .filter((sc) =>
                    selectedStockCardProductId === 'all'
                      ? true
                      : sc.productId === selectedStockCardProductId
                  )
                  .map((sc) => (
                    <tr key={sc.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {formatDateTime(sc.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{sc.productName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sc.type === 'penjualan'
                              ? 'bg-blue-500/20 text-blue-300'
                              : sc.type === 'restock'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : sc.type === 'retur'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {sc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{sc.referenceNo}</td>
                      <td className="px-4 py-3 text-center font-mono text-emerald-400 font-bold">
                        {sc.qtyIn > 0 ? `+${sc.qtyIn} ${sc.baseUnit}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-red-400 font-bold">
                        {sc.qtyOut > 0 ? `-${sc.qtyOut} ${sc.baseUnit}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-extrabold text-white">
                        {sc.finalStock} {sc.baseUnit}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        <div>{sc.notes}</div>
                        <div className="text-[10px] text-slate-500">Oleh: {sc.operator}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK OPNAME MODAL */}
      {opnameProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Stock Opname (Penyesuaian Fisik Gudang)</h3>
                <p className="text-xs text-slate-400">{opnameProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpnameProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Stok Tercatat Sistem:</span>
                <span className="font-mono text-base font-bold text-white">
                  {opnameProduct.stockInBaseUnit} {opnameProduct.baseUnit}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Selisih Penyesuaian:</span>
                <span
                  className={`font-mono text-base font-bold ${
                    opnamePhysicalStock - opnameProduct.stockInBaseUnit >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400'
                  }`}
                >
                  {opnamePhysicalStock - opnameProduct.stockInBaseUnit > 0 ? '+' : ''}
                  {opnamePhysicalStock - opnameProduct.stockInBaseUnit} {opnameProduct.baseUnit}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Jumlah Riil Hasil Hitung Fisik ({opnameProduct.baseUnit}) *
              </label>
              <input
                type="number"
                min="0"
                value={opnamePhysicalStock}
                onChange={(e) => setOpnamePhysicalStock(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Alasan Selisih Fisik *
              </label>
              <select
                value={opnameReason}
                onChange={(e) => setOpnameReason(e.target.value as OpnameReason)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="karung_sobek">Karung Sobek / Bocor Dimakan Tikus</option>
                <option value="susut_pakan">Susut Kadar Air / Penguapan Pakan</option>
                <option value="bonus_supplier">Bonus Tambahan dari Supplier/Pabrik</option>
                <option value="selisih_hitung">Koreksi Salah Hitung Kasir Sebelumnya</option>
                <option value="barang_rusak">Barang Rusak / Patah / Cacat Pabrik</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Catatan Rinci Rekonsiliasi:
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Ditemukan 1 karung bocor di sudut gudang pakan C..."
                value={opnameNotes}
                onChange={(e) => setOpnameNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOpnameProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveOpname}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Simpan & Update Stok Fisik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
