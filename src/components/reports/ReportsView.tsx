/**
 * Sales Reports & Automatic Profit/Loss (Laba Rugi) Component
 */

import React, { useState, useMemo } from 'react';
import { Transaction, StoreSettings } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatRupiah,
  formatNumber,
  formatDate,
  formatDateTime,
  exportToCsv,
} from '../../utils/format';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Calendar,
  RotateCcw,
  Search,
  PieChart,
  BarChart3,
  Award,
  Wheat,
  Fish,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  settings: StoreSettings;
  onRefreshData: () => void;
  onOpenSuratJalan?: (trx: Transaction) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  settings,
  onRefreshData,
  onOpenSuratJalan,
}) => {
  // Filter States
  const [dateFilter, setDateFilter] = useState<
    'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom'
  >('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchInvoice, setSearchInvoice] = useState('');

  // Selected Transaction for Reprint
  const [selectedReprintTrx, setSelectedReprintTrx] = useState<Transaction | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);

  // Filter transactions based on date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return transactions.filter((t) => {
      // Exclude cancelled if calculating valid sales
      const trxDateStr = t.timestamp.slice(0, 10);
      const trxDate = new Date(t.timestamp);

      if (dateFilter === 'today') {
        if (trxDateStr !== todayStr) return false;
      } else if (dateFilter === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        if (trxDateStr !== yest.toISOString().slice(0, 10)) return false;
      } else if (dateFilter === '7days') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        if (trxDate < cutoff) return false;
      } else if (dateFilter === '30days') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 30);
        if (trxDate < cutoff) return false;
      } else if (dateFilter === 'this_month') {
        if (
          trxDate.getMonth() !== now.getMonth() ||
          trxDate.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && trxDateStr < customStartDate) return false;
        if (customEndDate && trxDateStr > customEndDate) return false;
      }

      if (searchInvoice.trim()) {
        const q = searchInvoice.toLowerCase();
        const matchNo = t.invoiceNo.toLowerCase().includes(q);
        const matchCust = t.customerName.toLowerCase().includes(q);
        return matchNo || matchCust;
      }

      return true;
    });
  }, [transactions, dateFilter, customStartDate, customEndDate, searchInvoice]);

  // Active (Non-cancelled) transactions for financial KPIs
  const validTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.status === 'completed'),
    [filteredTransactions]
  );

  // Financial Metrics Calculation
  const totalOmset = validTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalHpp = validTransactions.reduce((acc, t) => acc + t.totalCost, 0);
  const totalLabaKotor = totalOmset - totalHpp;
  const overallMargin = totalOmset > 0 ? (totalLabaKotor / totalOmset) * 100 : 0;
  const avgOrderValue = validTransactions.length > 0 ? totalOmset / validTransactions.length : 0;

  // Breakdown Contribution: Pakan vs Alat Pancing
  const categoryContribution = useMemo(() => {
    let pakanOmset = 0;
    let pancingOmset = 0;
    let otherOmset = 0;

    validTransactions.forEach((trx) => {
      trx.items.forEach((item) => {
        if (item.category === 'pakan') {
          pakanOmset += item.subtotal;
        } else if (item.category === 'alat_pancing') {
          pancingOmset += item.subtotal;
        } else {
          otherOmset += item.subtotal;
        }
      });
    });

    const totalCat = pakanOmset + pancingOmset + otherOmset;
    const pakanPct = totalCat > 0 ? (pakanOmset / totalCat) * 100 : 50;
    const pancingPct = totalCat > 0 ? (pancingOmset / totalCat) * 100 : 50;

    return {
      pakanOmset,
      pancingOmset,
      otherOmset,
      pakanPct: parseFloat(pakanPct.toFixed(1)),
      pancingPct: parseFloat(pancingPct.toFixed(1)),
    };
  }, [validTransactions]);

  // Top Selling Items Ranking
  const topSellingItems = useMemo(() => {
    const map = new Map<
      string,
      { name: string; category: string; qty: number; revenue: number; profit: number }
    >();

    validTransactions.forEach((trx) => {
      trx.items.forEach((it) => {
        const existing = map.get(it.productName) || {
          name: it.productName,
          category: it.category,
          qty: 0,
          revenue: 0,
          profit: 0,
        };
        existing.qty += it.quantity;
        existing.revenue += it.subtotal;
        existing.profit += it.profit;
        map.set(it.productName, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [validTransactions]);

  // Daily Trend Chart Data (Last 7 days or current filter)
  const dailyTrend = useMemo(() => {
    const daysMap = new Map<string, { date: string; omset: number; laba: number }>();

    // Sort valid transactions chronologically
    const sorted = [...validTransactions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((trx) => {
      const d = trx.timestamp.slice(0, 10);
      const curr = daysMap.get(d) || { date: d, omset: 0, laba: 0 };
      curr.omset += trx.total;
      curr.laba += trx.grossProfit;
      daysMap.set(d, curr);
    });

    return Array.from(daysMap.values());
  }, [validTransactions]);

  // Max omset for chart scaling
  const maxDayOmset = Math.max(...dailyTrend.map((d) => d.omset), 1);

  // Handle Cancel / Void Transaction
  const handleCancelTransaction = (invoiceNo: string) => {
    const reason = prompt('Masukkan alasan pembatalan / retur transaksi ini (stok akan dikembalikan ke gudang):');
    if (!reason || !reason.trim()) return;

    const ok = StorageService.cancelTransaction(invoiceNo, reason.trim());
    if (ok) {
      alert(`Transaksi ${invoiceNo} berhasil dibatalkan dan seluruh stok otomatis dikembalikan!`);
      onRefreshData();
    }
  };

  // Export Sales Report to CSV / Excel
  const handleExportSalesReport = () => {
    const headers = [
      'No Faktur',
      'Tanggal & Waktu',
      'Kasir',
      'Nama Pelanggan',
      'Metode Bayar',
      'Total Belanja (Omset)',
      'Total Modal (HPP)',
      'Laba Kotor',
      'Margin %',
      'Status Transaksi',
    ];

    const rows = filteredTransactions.map((t) => [
      t.invoiceNo,
      t.timestamp,
      t.cashierName,
      t.customerName,
      t.paymentMethod.toUpperCase(),
      t.total,
      t.totalCost,
      t.grossProfit,
      `${t.profitMarginPercent}%`,
      t.status.toUpperCase(),
    ]);

    exportToCsv(`Laporan_Penjualan_LabaRugi_${dateFilter}_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Controls: Date Filters & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400 mr-1" />
          <span className="text-xs font-bold text-slate-300">Periode:</span>

          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: '7days', label: '7 Hari' },
            { id: '30days', label: '30 Hari' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'custom', label: 'Kustom' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setDateFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === btn.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
              <span className="text-xs text-slate-500">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportSalesReport}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Laporan ke Excel / CSV
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Omset Penjualan</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">{formatRupiah(totalOmset)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Dari <strong className="text-white">{validTransactions.length}</strong> transaksi berhasil
            </p>
          </div>
        </div>

        {/* Total HPP / Modal */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Modal (HPP)</span>
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-200">{formatRupiah(totalHpp)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Harga Pokok Pembelian barang terjual</p>
          </div>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="p-5 bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl flex flex-col justify-between bg-radial-[at_top_right] from-emerald-950/30 to-slate-900">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Laba Kotor (Gross Profit)</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-400">{formatRupiah(totalLabaKotor)}</h3>
            <p className="text-[11px] text-emerald-300/80 mt-1 font-semibold">
              Margin Bersih: {overallMargin.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Rata-rata Nilai Belanja (AOV) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Nilai Order</span>
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">{formatRupiah(avgOrderValue)}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Rata-rata per struk belanja</p>
          </div>
        </div>
      </div>

      {/* CHARTS & CONTRIBUTION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">Grafik Tren Penjualan Harian</h4>
            </div>
            <span className="text-xs text-slate-400">Nilai Omset (Rp)</span>
          </div>

          {dailyTrend.length > 0 ? (
            <div className="space-y-3 pt-2">
              {dailyTrend.map((d) => {
                const widthPct = Math.max(5, (d.omset / maxDayOmset) * 100);
                return (
                  <div key={d.date} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-mono text-slate-300">{formatDate(d.date)}</span>
                      <div className="space-x-3">
                        <span className="font-bold text-emerald-400">{formatRupiah(d.omset)}</span>
                        <span className="text-[11px] text-slate-400">
                          (Laba: {formatRupiah(d.laba)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500">
              <p className="text-xs">Tidak ada data transaksi pada rentang waktu yang dipilih.</p>
            </div>
          )}
        </div>

        {/* Category Contribution Gauge */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-400" />
              <h4 className="font-bold text-sm text-white">Kontribusi Omset Kategori</h4>
            </div>

            {/* Visual Bar Split */}
            <div className="w-full h-5 rounded-full bg-slate-950 overflow-hidden flex my-4">
              <div
                className="bg-amber-500 h-full transition-all duration-500"
                style={{ width: `${categoryContribution.pakanPct}%` }}
                title={`Pakan: ${categoryContribution.pakanPct}%`}
              />
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${categoryContribution.pancingPct}%` }}
                title={`Alat Pancing: ${categoryContribution.pancingPct}%`}
              />
            </div>

            {/* Breakdown Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <Wheat className="w-3 h-3 text-amber-400" />
                      Pakan Ternak & Pelet
                    </div>
                    <div className="text-[11px] text-slate-400">{categoryContribution.pakanPct}% dari total</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-amber-400 text-xs">
                  {formatRupiah(categoryContribution.pakanOmset)}
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <Fish className="w-3 h-3 text-blue-400" />
                      Alat Pancing & Nelayan
                    </div>
                    <div className="text-[11px] text-slate-400">{categoryContribution.pancingPct}% dari total</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-blue-400 text-xs">
                  {formatRupiah(categoryContribution.pancingOmset)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-slate-400 mt-4 border border-slate-800">
            Perbandingan omset antara pasokan pakan skala volume tinggi dengan margin alat pancing premium.
          </div>
        </div>
      </div>

      {/* TOP SELLING PRODUCTS RANKING */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h4 className="font-bold text-sm text-white">Produk Terlaris (Top Selling Items)</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {topSellingItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center mb-2">
                  #{idx + 1}
                </span>
                <h5 className="font-bold text-xs text-white line-clamp-2 leading-tight">
                  {item.name}
                </h5>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5">{item.category}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 space-y-0.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Terjual:</span>
                  <span className="font-bold text-white">{item.qty} Unit</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Omset:</span>
                  <span>{formatRupiah(item.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRANSACTION HISTORY TABLE WITH REPRINT & CANCEL */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-bold text-sm text-white">Riwayat Transaksi Penjualan Lengkap</h4>
            <p className="text-xs text-slate-400">
              Lihat faktur, cetak ulang struk kasir, atau batalkan transaksi dengan retur stok otomatis.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no faktur atau pelanggan..."
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">No. Faktur</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Metode Bayar</th>
                <th className="px-4 py-3 text-right">Total Transaksi</th>
                <th className="px-4 py-3 text-right">Laba Kotor</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono font-bold text-white">{trx.invoiceNo}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDateTime(trx.timestamp)}</td>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {trx.customerName || 'Umum'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                      {trx.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-white">
                    {formatRupiah(trx.total)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">
                    {formatRupiah(trx.grossProfit)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        trx.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {trx.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Cetak Ulang Struk"
                        onClick={() => {
                          setSelectedReprintTrx(trx);
                          setIsReprintModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {trx.status === 'completed' && (
                        <button
                          type="button"
                          title="Batalkan Transaksi (Retur Stok)"
                          onClick={() => handleCancelTransaction(trx.invoiceNo)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPRINT RECEIPT MODAL */}
      <ReceiptModal
        transaction={selectedReprintTrx}
        settings={settings}
        isOpen={isReprintModalOpen}
        onClose={() => setIsReprintModalOpen(false)}
        onOpenSuratJalan={onOpenSuratJalan}
      />
    </div>
  );
};
