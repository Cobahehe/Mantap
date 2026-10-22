/**
 * Delivery Management & Surat Jalan Component
 */

import React, { useState } from 'react';
import { DeliveryNote, StoreSettings, Transaction } from '../../types';
import { StorageService } from '../../services/storage';
import { formatDate } from '../../utils/format';
import { SuratJalanModal } from '../common/SuratJalanModal';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  FileText,
  User,
  MapPin,
} from 'lucide-react';

interface DeliveryViewProps {
  deliveries: DeliveryNote[];
  transactions: Transaction[];
  settings: StoreSettings;
  onRefreshDeliveries: () => void;
  initialCreateFromTrx?: Transaction | null;
  onClearInitialTrx?: () => void;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  deliveries,
  transactions,
  settings,
  onRefreshDeliveries,
  initialCreateFromTrx,
  onClearInitialTrx,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Active Surat Jalan for Preview / Print
  const [activeSuratJalan, setActiveSuratJalan] = useState<DeliveryNote | null>(null);
  const [isSuratJalanModalOpen, setIsSuratJalanModalOpen] = useState(false);

  // Create Surat Jalan Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(initialCreateFromTrx));
  const [selectedTrxInvoice, setSelectedTrxInvoice] = useState(
    initialCreateFromTrx ? initialCreateFromTrx.invoiceNo : ''
  );
  const [driverName, setDriverName] = useState('Pak Wagiman');
  const [vehicleNumber, setVehicleNumber] = useState('B 9876 PKN (Gran Max Pick Up)');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Handle open create modal from outside or inside
  const handleOpenCreateModal = (trx?: Transaction) => {
    if (trx) {
      setSelectedTrxInvoice(trx.invoiceNo);
      setDestinationAddress(trx.customerName ? `Kandang / Lokasi ${trx.customerName}` : '');
    } else if (transactions.length > 0) {
      setSelectedTrxInvoice(transactions[0].invoiceNo);
    }
    setIsCreateModalOpen(true);
  };

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.customerName.toLowerCase().includes(q) ||
      d.suratJalanNo.toLowerCase().includes(q) ||
      d.transactionInvoice.toLowerCase().includes(q) ||
      d.driverName.toLowerCase().includes(q)
    );
  });

  // Handle Create Submit
  const handleCreateSuratJalan = (e: React.FormEvent) => {
    e.preventDefault();
    const trx = transactions.find((t) => t.invoiceNo === selectedTrxInvoice);
    if (!trx) {
      alert('Transaksi tidak ditemukan!');
      return;
    }

    const sjNo =
      'SJ-' +
      new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' +
      Math.floor(100 + Math.random() * 900);

    const newDelivery: DeliveryNote = {
      id: 'del-' + Date.now(),
      suratJalanNo: sjNo,
      transactionInvoice: trx.invoiceNo,
      customerName: trx.customerName || 'Pelanggan Toko',
      customerPhone: trx.customerPhone || '',
      destinationAddress: destinationAddress.trim() || 'Alamat Penerima',
      driverName: driverName.trim(),
      vehicleNumber: vehicleNumber.trim(),
      deliveryDate,
      status: 'dalam_pengiriman',
      items: trx.items.map((it) => ({
        productName: it.productName,
        unitName: it.unitName,
        quantity: it.quantity,
        notes: 'Baik & Utuh',
      })),
      notes: deliveryNotes,
      createdAt: new Date().toISOString(),
    };

    StorageService.createDelivery(newDelivery);
    onRefreshDeliveries();

    if (onClearInitialTrx) onClearInitialTrx();
    setIsCreateModalOpen(false);

    // Open Printable Surat Jalan
    setActiveSuratJalan(newDelivery);
    setIsSuratJalanModalOpen(true);
  };

  const handleUpdateStatus = (id: string, status: DeliveryNote['status']) => {
    const recipient = status === 'diterima' ? prompt('Nama orang yang menerima di tempat:') || undefined : undefined;
    StorageService.updateDeliveryStatus(id, status, recipient);
    onRefreshDeliveries();
    if (activeSuratJalan && activeSuratJalan.id === id) {
      setActiveSuratJalan({ ...activeSuratJalan, status, recipientName: recipient });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">Manajemen Pengiriman & Penerbitan Surat Jalan</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Terbitkan surat jalan resmi untuk armada toko pengangkut karung pakan ternak atau logistik nelayan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenCreateModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          + Terbitkan Surat Jalan Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama pelanggan, no SJ, atau sopir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            >
              <option value="all">Semua Status</option>
              <option value="persiapan">Persiapan Gudang</option>
              <option value="dalam_pengiriman">Dalam Perjalanan (Kirim)</option>
              <option value="diterima">Telah Diterima Pelanggan</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-400">Total: {filteredDeliveries.length} Dokumen</span>
      </div>

      {/* Deliveries Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeliveries.map((del) => {
          const isDone = del.status === 'diterima';

          return (
            <div
              key={del.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between hover:border-blue-500/50 transition-all shadow-xl"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs font-bold text-blue-400">{del.suratJalanNo}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {isDone ? 'Diterima' : 'Dalam Kirim'}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">{del.customerName}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{del.destinationAddress}</span>
                </p>

                {/* Items in Delivery */}
                <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                    Muatan Barang ({del.items.length} Macam):
                  </span>
                  {del.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span className="truncate max-w-[180px]">{it.productName}</span>
                      <span className="font-bold font-mono text-white">
                        {it.quantity} {it.unitName}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Driver Info */}
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>
                    Sopir: <strong className="text-slate-200">{del.driverName}</strong> ({del.vehicleNumber})
                  </div>
                  <div>Tgl Kirim: {formatDate(del.deliveryDate)}</div>
                  {del.recipientName && (
                    <div className="text-emerald-400">Penerima: {del.recipientName}</div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSuratJalan(del);
                    setIsSuratJalanModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Lihat & Cetak SJ
                </button>

                {!isDone && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(del.id, 'diterima')}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Sampai
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredDeliveries.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500">
            <Truck className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-white">Tidak ada data surat jalan</p>
          </div>
        )}
      </div>

      {/* CREATE SURAT JALAN MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Terbitkan Surat Jalan Pengiriman</h3>
                <p className="text-xs text-slate-400">Pilih faktur transaksi untuk diangkut</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSuratJalan} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Pilih Nomor Transaksi Kasir *
                </label>
                <select
                  required
                  value={selectedTrxInvoice}
                  onChange={(e) => {
                    setSelectedTrxInvoice(e.target.value);
                    const found = transactions.find((t) => t.invoiceNo === e.target.value);
                    if (found && found.customerName) {
                      setDestinationAddress(`Kandang/Lokasi ${found.customerName}`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                >
                  {transactions.map((trx) => (
                    <option key={trx.id} value={trx.invoiceNo}>
                      {trx.invoiceNo} - {trx.customerName} ({trx.items.length} barang)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Alamat Lengkap Tujuan Pengiriman *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Kp. Pasir Nangka RT 02/04, Kandang Ayam Broiler Sukamaju..."
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Sopir / Driver</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nomor Polisi / Kendaraan</label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tanggal Pengiriman</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan Khusus Pengiriman</label>
                <input
                  type="text"
                  placeholder="Contoh: Titip di teras gudang belakang jika pagar terkunci..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  Terbitkan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SURAT JALAN PRINT VIEW MODAL */}
      <SuratJalanModal
        delivery={activeSuratJalan}
        settings={settings}
        isOpen={isSuratJalanModalOpen}
        onClose={() => setIsSuratJalanModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
