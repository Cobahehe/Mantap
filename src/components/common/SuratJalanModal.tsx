/**
 * Surat Jalan (Delivery Note) Modal & Print View
 */

import React from 'react';
import { DeliveryNote, StoreSettings } from '../../types';
import { formatDate, downloadFile } from '../../utils/format';
import { Printer, Download, X, Truck, CheckCircle, Clock } from 'lucide-react';

interface SuratJalanModalProps {
  delivery: DeliveryNote | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: DeliveryNote['status']) => void;
}

export const SuratJalanModal: React.FC<SuratJalanModalProps> = ({
  delivery,
  settings,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  if (!isOpen || !delivery) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    let content = `SURAT JALAN PENGIRIMAN BARANG\n`;
    content += `${settings.storeName}\n${settings.address}\nTelp: ${settings.phone}\n`;
    content += `==============================================\n`;
    content += `No Surat Jalan : ${delivery.suratJalanNo}\n`;
    content += `No Transaksi   : ${delivery.transactionInvoice}\n`;
    content += `Tanggal Kirim  : ${formatDate(delivery.deliveryDate)}\n`;
    content += `Penerima       : ${delivery.customerName}\n`;
    content += `No Telp        : ${delivery.customerPhone}\n`;
    content += `Tujuan         : ${delivery.destinationAddress}\n`;
    content += `Sopir/Kurir    : ${delivery.driverName} (${delivery.vehicleNumber})\n`;
    content += `----------------------------------------------\n`;
    content += `DAFTAR BARANG YANG DIKIRIM:\n`;
    delivery.items.forEach((it, idx) => {
      content += `${idx + 1}. ${it.productName} - ${it.quantity} ${it.unitName} (${it.notes || '-'})\n`;
    });
    content += `----------------------------------------------\n`;
    content += `Catatan: ${delivery.notes || '-'}\n\n`;
    content += `Tanda Tangan Pengirim: (          )   Tanda Tangan Penerima: (          )\n`;

    downloadFile(`SuratJalan_${delivery.suratJalanNo}.txt`, content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Surat Jalan Pengiriman Barang</h3>
              <p className="text-xs text-slate-400">No: {delivery.suratJalanNo} | Transaksi: {delivery.transactionInvoice}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/70">
          {/* Printable Sheet */}
          <div className="bg-white text-zinc-900 p-8 rounded-lg shadow-xl font-sans max-w-2xl mx-auto border border-zinc-200">
            {/* Header Surat Jalan */}
            <div className="flex justify-between items-start border-b-2 border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-zinc-950 uppercase tracking-tight">{settings.storeName}</h2>
                <p className="text-xs text-zinc-600 max-w-sm mt-0.5">{settings.address}</p>
                <p className="text-xs text-zinc-700 font-semibold mt-0.5">Telp/WA: {settings.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-zinc-900 text-white font-extrabold text-sm uppercase rounded tracking-wider">
                  SURAT JALAN
                </span>
                <p className="text-xs font-mono font-bold mt-2 text-zinc-800">{delivery.suratJalanNo}</p>
                <p className="text-xs text-zinc-500">Ref: {delivery.transactionInvoice}</p>
              </div>
            </div>

            {/* Delivery Metadata */}
            <div className="grid grid-cols-2 gap-4 my-4 py-3 bg-zinc-50 p-3 rounded border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 block">Tujuan Pengiriman / Penerima:</span>
                <span className="font-bold text-zinc-900 block text-sm">{delivery.customerName}</span>
                <span className="text-zinc-700 block">{delivery.destinationAddress}</span>
                <span className="text-zinc-700 block font-medium">Telp: {delivery.customerPhone || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Informasi Armada / Kurir:</span>
                <span className="font-bold text-zinc-900 block">Sopir: {delivery.driverName || 'Armada Toko'}</span>
                <span className="text-zinc-700 block">Kendaraan: {delivery.vehicleNumber || 'Pick-up'}</span>
                <span className="text-zinc-700 block">Tanggal Kirim: {formatDate(delivery.deliveryDate)}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-4">
              <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px]">
                    <th className="border border-zinc-300 px-3 py-2 text-center w-10">No</th>
                    <th className="border border-zinc-300 px-3 py-2">Nama Barang / Produk</th>
                    <th className="border border-zinc-300 px-3 py-2 text-center w-28">Kuantitas</th>
                    <th className="border border-zinc-300 px-3 py-2 w-44">Keterangan / Kondisi</th>
                  </tr>
                </thead>
                <tbody>
                  {delivery.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="border border-zinc-300 px-3 py-2 text-center font-medium">{idx + 1}</td>
                      <td className="border border-zinc-300 px-3 py-2 font-semibold text-zinc-900">{it.productName}</td>
                      <td className="border border-zinc-300 px-3 py-2 text-center font-bold text-zinc-950">
                        {it.quantity} {it.unitName}
                      </td>
                      <td className="border border-zinc-300 px-3 py-2 text-zinc-600">{it.notes || 'Baik & Segel'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {delivery.notes && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded">
                <span className="font-bold">Catatan Khusus:</span> {delivery.notes}
              </div>
            )}

            {/* Signature columns */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-4 text-center text-xs text-zinc-700">
              <div>
                <p className="font-medium text-zinc-500">Dibuat Oleh (Admin):</p>
                <div className="h-16 flex items-end justify-center font-bold text-zinc-900">
                  ( {settings.activeCashier} )
                </div>
              </div>
              <div>
                <p className="font-medium text-zinc-500">Pengemudi / Supir:</p>
                <div className="h-16 flex items-end justify-center font-bold text-zinc-900">
                  ( {delivery.driverName || 'Supir'} )
                </div>
              </div>
              <div>
                <p className="font-medium text-zinc-500">Diterima dengan Baik Oleh:</p>
                <div className="h-16 flex items-end justify-center font-bold text-zinc-900">
                  ( {delivery.recipientName || delivery.customerName.split(' ')[0]} )
                </div>
              </div>
            </div>

            <div className="mt-6 text-[10px] text-zinc-400 text-center border-t border-zinc-200 pt-2 font-mono">
              Harap periksa kelengkapan barang sebelum menandatangani surat jalan ini.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status Kirim:</span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                delivery.status === 'diterima'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : delivery.status === 'dalam_pengiriman'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {delivery.status === 'diterima'
                ? 'Diterima'
                : delivery.status === 'dalam_pengiriman'
                ? 'Dalam Pengiriman'
                : 'Persiapan'}
            </span>

            {onUpdateStatus && delivery.status !== 'diterima' && (
              <button
                type="button"
                onClick={() => onUpdateStatus(delivery.id, 'diterima')}
                className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Tandai Sampai / Diterima
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak Surat Jalan
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> Unduh Dokumen
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
