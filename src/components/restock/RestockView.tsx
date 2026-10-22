/**
 * Restock & In-Out (Pembelian Distributor & Mutasi Cabang) Component
 */

import React, { useState } from 'react';
import { Product, RestockOrder, StoreSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { formatRupiah, formatNumber, formatDate, formatDateTime } from '../../utils/format';
import {
  PackagePlus,
  ArrowDownLeft,
  ArrowUpRight,
  Factory,
  Building2,
  Calendar,
  Layers,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';

interface RestockViewProps {
  products: Product[];
  settings: StoreSettings;
  onRefreshData: () => void;
}

export const RestockView: React.FC<RestockViewProps> = ({
  products,
  settings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Form State
  const [restockType, setRestockType] = useState<'restock_supplier' | 'branch_in' | 'branch_out'>('restock_supplier');
  const [supplierOrBranch, setSupplierOrBranch] = useState('PT Charoen Pokphand Indonesia Tbk');
  const [invoiceNo, setInvoiceNo] = useState(`PO-PABRIK-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');

  // Items to Restock
  const [items, setItems] = useState<
    {
      productId: string;
      productName: string;
      unitName: string;
      conversionRate: number;
      quantity: number;
      costPrice: number;
      subtotal: number;
      batchNumber?: string;
      expiryDate?: string;
    }[]
  >([]);

  // Current item selector
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedUnitName, setSelectedUnitName] = useState<string>('');
  const [inputQty, setInputQty] = useState<number>(10);
  const [inputCostPrice, setInputCostPrice] = useState<number>(0);
  const [inputBatch, setInputBatch] = useState<string>('');
  const [inputExpiry, setInputExpiry] = useState<string>('');

  const restockHistory = StorageService.getRestocks();

  // Set default unit when product selection changes
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Add Item to table
  const handleAddItem = () => {
    if (!selectedProduct) return;
    const unit =
      selectedProduct.units.find((u) => u.name === selectedUnitName) ||
      selectedProduct.units.find((u) => u.isDefault) ||
      selectedProduct.units[0];

    const cost = inputCostPrice > 0 ? inputCostPrice : unit.costPrice;
    const subtotal = inputQty * cost;

    setItems((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        unitName: unit.name,
        conversionRate: unit.conversionRate,
        quantity: inputQty,
        costPrice: cost,
        subtotal,
        batchNumber: inputBatch.trim() || undefined,
        expiryDate: inputExpiry || undefined,
      },
    ]);

    // Reset input fields
    setInputQty(10);
    setInputBatch('');
    setInputExpiry('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, it) => acc + it.subtotal, 0);

  // Submit Restock / In-Out
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Tambahkan minimal 1 item barang yang masuk / keluar!');
      return;
    }

    const order: RestockOrder = {
      id: 'rst-' + Date.now(),
      type: restockType,
      invoiceNo: invoiceNo.trim(),
      date: new Date().toISOString().slice(0, 10),
      supplierOrBranch: supplierOrBranch.trim(),
      items: [...items],
      totalAmount,
      operator: settings.activeCashier,
      notes,
      createdAt: new Date().toISOString(),
    };

    StorageService.recordRestock(order);
    onRefreshData();

    alert(
      `Faktur ${order.type === 'restock_supplier' ? 'Restock Pabrik' : 'Mutasi Cabang'} berhasil disimpan! Stok gudang telah diperbarui.`
    );

    // Reset form
    setItems([]);
    setNotes('');
    setInvoiceNo(`PO-${Date.now().toString().slice(-6)}`);
    setActiveTab('history');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'form'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            Input Faktur Barang Masuk / Keluar
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Riwayat Pembelian & Mutasi ({restockHistory.length})
          </button>
        </div>

        <span className="text-xs text-slate-400">
          Operator Kasir/Gudang: <strong className="text-white">{settings.activeCashier}</strong>
        </span>
      </div>

      {/* FORM INPUT RESTOCK */}
      {activeTab === 'form' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-4xl mx-auto">
          <div>
            <h3 className="text-base font-bold text-white">Input Faktur Restock & Mutasi Stok</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input barang masuk dari pabrik supplier pakan atau mutasi transfer dari/ke cabang toko.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRestockType('restock_supplier');
                  setSupplierOrBranch('PT Charoen Pokphand Indonesia Tbk');
                }}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                  restockType === 'restock_supplier'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Factory className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">Restock dari Pabrik</div>
                  <div className="text-[10px] text-slate-400">Pakan Pokphand, Japfa, dsb</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestockType('branch_in');
                  setSupplierOrBranch('Cabang Toko Pesisir Barat');
                }}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                  restockType === 'branch_in'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5 shrink-0 text-blue-400" />
                <div className="text-left">
                  <div className="text-xs font-bold">Transfer Masuk (Cabang)</div>
                  <div className="text-[10px] text-slate-400">Tambahan stok dari cabang</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestockType('branch_out');
                  setSupplierOrBranch('Cabang Toko Muara Sentra');
                }}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                  restockType === 'branch_out'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-5 h-5 shrink-0 text-amber-400" />
                <div className="text-left">
                  <div className="text-xs font-bold">Transfer Keluar (Cabang)</div>
                  <div className="text-[10px] text-slate-400">Kirim stok ke cabang lain</div>
                </div>
              </button>
            </div>

            {/* Invoice & Supplier Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Distributor Pabrik / Nama Cabang *
                </label>
                <input
                  type="text"
                  required
                  value={supplierOrBranch}
                  onChange={(e) => setSupplierOrBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nomor Surat Jalan / Faktur PO *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* ITEM SELECTOR ROW */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                Tambah Item Barang:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 block mb-1">Pilih Produk:</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const p = products.find((prod) => prod.id === e.target.value);
                      if (p) {
                        const def = p.units.find((u) => u.isDefault) || p.units[0];
                        setSelectedUnitName(def.name);
                        setInputCostPrice(def.costPrice);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Satuan Restock:</label>
                  <select
                    value={selectedUnitName}
                    onChange={(e) => {
                      setSelectedUnitName(e.target.value);
                      if (selectedProduct) {
                        const u = selectedProduct.units.find((unit) => unit.name === e.target.value);
                        if (u) setInputCostPrice(u.costPrice);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {selectedProduct?.units.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} (1={u.conversionRate} {selectedProduct.baseUnit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Kuantitas Masuk:</label>
                  <input
                    type="number"
                    min="1"
                    value={inputQty}
                    onChange={(e) => setInputQty(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Cost & Batch Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">HPP / Harga Beli Modal (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={inputCostPrice}
                    onChange={(e) => setInputCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">No. Batch Pabrik (Opsional):</label>
                  <input
                    type="text"
                    placeholder="Contoh: BATCH-2610-01"
                    value={inputBatch}
                    onChange={(e) => setInputBatch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tanggal Expired (Khusus Pakan):</label>
                  <input
                    type="date"
                    value={inputExpiry}
                    onChange={(e) => setInputExpiry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambahkan ke Daftar Faktur
                </button>
              </div>
            </div>

            {/* Added Items List */}
            {items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Daftar Barang Faktur Ini ({items.length} item):
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Produk</th>
                        <th className="px-3 py-2">Satuan</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">HPP Satuan</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                        <th className="px-3 py-2 text-center">Batch / Exp</th>
                        <th className="px-3 py-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="px-3 py-2 font-semibold text-white">{it.productName}</td>
                          <td className="px-3 py-2 text-slate-300">{it.unitName}</td>
                          <td className="px-3 py-2 text-center font-bold font-mono text-white">
                            {it.quantity}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-300">
                            {formatRupiah(it.costPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                            {formatRupiah(it.subtotal)}
                          </td>
                          <td className="px-3 py-2 text-center text-[10px] text-slate-400">
                            {it.batchNumber ? `${it.batchNumber} (${formatDate(it.expiryDate || '')})` : '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
                  <span>TOTAL FAKTUR RESTOCK:</span>
                  <span className="text-emerald-400 font-mono text-base">{formatRupiah(totalAmount)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan Tambahan:</label>
              <input
                type="text"
                placeholder="Catatan kondisi muatan truk atau perjanjian pembayaran..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="submit"
                disabled={items.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-colors"
              >
                Proses Simpan Faktur & Perbarui Stok
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESTOCK HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tanggal & Faktur</th>
                <th className="px-4 py-3">Jenis Mutasi</th>
                <th className="px-4 py-3">Supplier / Cabang Asal</th>
                <th className="px-4 py-3">Rincian Barang</th>
                <th className="px-4 py-3 text-right">Total Nilai</th>
                <th className="px-4 py-3 text-center">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {restockHistory.map((rst) => (
                <tr key={rst.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-white">{rst.invoiceNo}</div>
                    <div className="text-[11px] text-slate-400">{formatDate(rst.date)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rst.type === 'restock_supplier'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : rst.type === 'branch_in'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {rst.type === 'restock_supplier'
                        ? 'Pabrik'
                        : rst.type === 'branch_in'
                        ? 'Cabang In'
                        : 'Cabang Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">{rst.supplierOrBranch}</td>
                  <td className="px-4 py-3 space-y-0.5">
                    {rst.items.map((it, idx) => (
                      <div key={idx} className="text-[11px] text-slate-300">
                        {it.productName} ({it.quantity} {it.unitName})
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                    {formatRupiah(rst.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-400">{rst.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
