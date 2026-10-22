/**
 * Receipt & Invoice Modal - Thermal Printer (58mm/80mm) & Official Invoice A4
 */

import React, { useState } from 'react';
import { Transaction, StoreSettings } from '../../types';
import {
  formatRupiah,
  formatDate,
  formatDateTime,
  generateThermalReceiptText,
  createWhatsAppReceiptUrl,
  createWhatsAppInvoiceA4Url,
  angkaTerbilang,
  downloadFile,
} from '../../utils/format';
import {
  Printer,
  MessageSquare,
  Download,
  X,
  CheckCircle2,
  Copy,
  FileText,
  Receipt,
  Wheat,
  Fish,
  Building2,
  Truck,
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onOpenSuratJalan?: (trx: Transaction) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  isOpen,
  onClose,
  onOpenSuratJalan,
}) => {
  const [docType, setDocType] = useState<'thermal' | 'a4'>('a4'); // Default to A4 as requested
  const [paperSize, setPaperSize] = useState<'80mm' | '58mm'>(settings.paperSize || '80mm');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const receiptText = generateThermalReceiptText(transaction, settings, paperSize);
  const waReceiptUrl = createWhatsAppReceiptUrl(transaction, settings);
  const waInvoiceA4Url = createWhatsAppInvoiceA4Url(transaction, settings);

  const handlePrint = () => {
    // Check if running inside Electron desktop app
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.printReceipt) {
      // @ts-ignore
      window.electronAPI.printReceipt({ silent: false });
    } else {
      window.print();
    }
  };

  const handleDownloadTxt = () => {
    downloadFile(`Struk_${transaction.invoiceNo}.txt`, receiptText, 'text/plain;charset=utf-8');
  };

  const handleDownloadInvoiceHtml = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Faktur Invoice ${transaction.invoiceNo}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; }
    .store-name { font-size: 22px; font-weight: 800; text-transform: uppercase; }
    .invoice-title { font-size: 20px; font-weight: 800; color: #047857; text-align: right; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
    td { padding: 10px; border: 1px solid #cbd5e1; }
    .text-right { text-align: right; }
    .total-box { margin-top: 20px; text-align: right; font-size: 14px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #047857; }
    .terbilang { font-style: italic; background: #f8fafc; padding: 10px; border-left: 4px solid #047857; margin-top: 15px; font-size: 12px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; margin-top: 50px; text-align: center; font-size: 13px; }
    .sign-space { height: 70px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-name">${settings.storeName}</div>
      <div style="font-size: 12px; color: #64748b;">${settings.storeSlogan}</div>
      <div style="font-size: 12px; color: #475569;">${settings.address} | Telp: ${settings.phone}</div>
    </div>
    <div>
      <div class="invoice-title">FAKTUR PENJUALAN</div>
      <div style="font-size: 12px;"><strong>No:</strong> ${transaction.invoiceNo}</div>
      <div style="font-size: 12px;"><strong>Tanggal:</strong> ${formatDateTime(transaction.timestamp)}</div>
      <div style="font-size: 12px;"><strong>Kasir:</strong> ${transaction.cashierName}</div>
    </div>
  </div>

  <div class="grid">
    <div>
      <strong>Kepada Yth:</strong><br>
      ${transaction.customerName || 'Pelanggan Umum'}<br>
      Telp: ${transaction.customerPhone || '-'}<br>
      Status: ${transaction.isKasbon ? 'KASBON / TEMPO' : 'LUNAS'}
    </div>
    <div style="text-align: right;">
      <strong>Metode Pembayaran:</strong> ${transaction.paymentMethod.toUpperCase()}<br>
      ${transaction.isKasbon && transaction.kasbonDueDate ? `<strong>Jatuh Tempo Panen:</strong> ${formatDate(transaction.kasbonDueDate)}` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">No</th>
        <th>Nama Barang / Pakan / Alat Pancing</th>
        <th>Satuan</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Harga Satuan</th>
        <th class="text-right">Total Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${transaction.items
        .map(
          (it, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${it.productName}</strong></td>
          <td>${it.unitName}</td>
          <td class="text-right">${it.quantity}</td>
          <td class="text-right">${formatRupiah(it.sellPrice)}</td>
          <td class="text-right"><strong>${formatRupiah(it.subtotal)}</strong></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="total-box">
    <div>Subtotal: ${formatRupiah(transaction.subtotal)}</div>
    ${transaction.discount > 0 ? `<div style="color: #dc2626;">Diskon: -${formatRupiah(transaction.discount)}</div>` : ''}
    <div class="grand-total">TOTAL AKHIR: ${formatRupiah(transaction.total)}</div>
  </div>

  <div class="terbilang">
    <strong>Terbilang:</strong> ${angkaTerbilang(transaction.total)}
  </div>

  <div class="signatures">
    <div>
      Tanda Terima Pelanggan,
      <div class="sign-space"></div>
      ( ${transaction.customerName || 'Pelanggan'} )
    </div>
    <div>
      Hormat Kami / Kasir Toko,
      <div class="sign-space"></div>
      ( ${transaction.cashierName} )
    </div>
  </div>
</body>
</html>
    `;
    downloadFile(`Invoice_A4_${transaction.invoiceNo}.html`, htmlContent, 'text/html;charset=utf-8');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header with Format Switcher */}
        <div className="px-6 py-3.5 bg-slate-800 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bukti Transaksi Penjualan</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  {transaction.invoiceNo}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Pilih format cetak: Struk Kasir Termal atau Faktur Invoice Standar A4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDocType('a4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  docType === 'a4'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Invoice A4 (Resmi)</span>
              </button>

              <button
                type="button"
                onClick={() => setDocType('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  docType === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Struk Termal (POS)</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/70 flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Visual: Invoice A4 OR Thermal */}
          <div className="flex-1 w-full overflow-x-auto flex justify-center">
            {docType === 'a4' ? (
              /* =================== FORMAT INVOICE A4 RESMI =================== */
              <div
                id="invoice-a4-printable"
                className="bg-white text-zinc-900 p-8 rounded-lg shadow-2xl font-sans w-full max-w-[720px] border border-zinc-300 text-xs leading-normal select-text"
                style={{ minHeight: '840px' }}
              >
                {/* Header Invoice */}
                <div className="flex justify-between items-start border-b-2 border-emerald-800 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                        <Wheat className="w-4 h-4 -mr-1" />
                        <Fish className="w-4 h-4" />
                      </div>
                      <h2 className="text-xl font-black text-zinc-950 uppercase tracking-tight">
                        {settings.storeName}
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-600 italic font-medium">{settings.storeSlogan}</p>
                    <p className="text-[11px] text-zinc-600 max-w-sm">{settings.address}</p>
                    <p className="text-[11px] text-zinc-700 font-bold">Telp / WhatsApp: {settings.phone}</p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-emerald-800 text-white font-extrabold text-sm uppercase rounded tracking-wider shadow-xs">
                      FAKTUR PENJUALAN
                    </span>
                    <div className="text-xs font-mono font-bold text-zinc-900 pt-1">
                      No: {transaction.invoiceNo}
                    </div>
                    <div className="text-[11px] text-zinc-600">
                      Tanggal: <strong>{formatDateTime(transaction.timestamp)}</strong>
                    </div>
                    <div className="text-[11px] text-zinc-600">
                      Kasir: <strong>{transaction.cashierName}</strong>
                    </div>
                  </div>
                </div>

                {/* Customer & Payment Info Banner */}
                <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                  <div>
                    <span className="text-zinc-500 font-semibold block text-[10px] uppercase">
                      Diberikan Kepada (Pelanggan):
                    </span>
                    <span className="font-extrabold text-zinc-900 block text-sm mt-0.5">
                      {transaction.customerName || 'Pelanggan Umum'}
                    </span>
                    <span className="text-zinc-600 block text-[11px]">
                      Kontak: {transaction.customerPhone || '-'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-zinc-500 font-semibold block text-[10px] uppercase">
                      Syarat & Metode Bayar:
                    </span>
                    <span className="font-bold text-zinc-900 block uppercase mt-0.5">
                      {transaction.paymentMethod}
                    </span>
                    {transaction.isKasbon ? (
                      <div className="text-amber-800 font-bold text-[11px] mt-0.5">
                        Status: Kasbon / Tempo
                        {transaction.kasbonDueDate && (
                          <span className="block text-zinc-700 font-normal">
                            Jatuh Tempo Panen: {formatDate(transaction.kasbonDueDate)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[11px] block">
                        Status: LUNAS SELESAI
                      </span>
                    )}
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="my-4">
                  <table className="w-full text-xs text-left border-collapse border border-zinc-300">
                    <thead>
                      <tr className="bg-zinc-100 text-zinc-800 font-bold uppercase text-[10px] tracking-wider">
                        <th className="border border-zinc-300 px-3 py-2.5 text-center w-8">No</th>
                        <th className="border border-zinc-300 px-3 py-2.5">Deskripsi Produk</th>
                        <th className="border border-zinc-300 px-3 py-2.5 text-center w-24">Satuan</th>
                        <th className="border border-zinc-300 px-3 py-2.5 text-center w-16">Qty</th>
                        <th className="border border-zinc-300 px-3 py-2.5 text-right w-28">Harga Satuan</th>
                        <th className="border border-zinc-300 px-3 py-2.5 text-right w-32">Total Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {transaction.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="border border-zinc-300 px-3 py-2 text-center text-zinc-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="border border-zinc-300 px-3 py-2">
                            <span className="font-bold text-zinc-900 block">{item.productName}</span>
                            <span className="text-[10px] text-zinc-500">{item.brand}</span>
                          </td>
                          <td className="border border-zinc-300 px-3 py-2 text-center font-medium text-zinc-700">
                            {item.unitName}
                          </td>
                          <td className="border border-zinc-300 px-3 py-2 text-center font-bold font-mono text-zinc-900">
                            {item.quantity}
                          </td>
                          <td className="border border-zinc-300 px-3 py-2 text-right font-mono text-zinc-700">
                            {formatRupiah(item.sellPrice)}
                          </td>
                          <td className="border border-zinc-300 px-3 py-2 text-right font-mono font-bold text-zinc-950">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Terbilang */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                  {/* Terbilang & Bank info */}
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-50 border-l-4 border-emerald-600 rounded-r text-[11px]">
                      <span className="font-bold text-zinc-700 block">Terbilang:</span>
                      <span className="italic font-semibold text-emerald-950 block capitalize">
                        {angkaTerbilang(transaction.total)}
                      </span>
                    </div>

                    <div className="text-[10px] text-zinc-600 space-y-1 bg-zinc-50 p-2.5 rounded border border-zinc-200">
                      <span className="font-bold text-zinc-800 block">Rekening Pembayaran Toko:</span>
                      {settings.bankAccounts.map((b) => (
                        <div key={b.id} className="flex justify-between">
                          <span>{b.bankName}: {b.accountNumber}</span>
                          <span className="text-zinc-500">a.n {b.holderName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculations */}
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal Belanja:</span>
                      <span className="font-mono">{formatRupiah(transaction.subtotal)}</span>
                    </div>
                    {transaction.discount > 0 && (
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Potongan Diskon:</span>
                        <span className="font-mono">-{formatRupiah(transaction.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm text-zinc-950 pt-2 border-t border-zinc-300">
                      <span>TOTAL TAGIHAN:</span>
                      <span className="text-emerald-800 text-base">{formatRupiah(transaction.total)}</span>
                    </div>

                    {transaction.paymentMethod === 'cash' && (
                      <div className="pt-1 text-[11px] text-zinc-600 border-t border-dashed border-zinc-300 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Tunai Diterima:</span>
                          <span className="font-mono">{formatRupiah(transaction.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-zinc-800">
                          <span>Uang Kembalian:</span>
                          <span className="font-mono">{formatRupiah(transaction.changeAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 mt-12 pt-4 text-center text-xs text-zinc-700">
                  <div>
                    <p className="font-semibold text-zinc-600">Tanda Terima Pelanggan / Peternak,</p>
                    <div className="h-16 flex items-end justify-center font-bold text-zinc-900">
                      ( {transaction.customerName || 'Pelanggan'} )
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-zinc-600">Hormat Kami / Kasir Toko,</p>
                    <div className="h-16 flex items-end justify-center font-bold text-zinc-900">
                      ( {transaction.cashierName} )
                    </div>
                  </div>
                </div>

                {/* Invoice Footer */}
                <div className="mt-8 pt-3 border-t border-zinc-200 text-center text-[10px] text-zinc-500 font-sans">
                  {settings.receiptFooter || 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan tanpa perjanjian.'}
                </div>
              </div>
            ) : (
              /* =================== FORMAT STRUK TERMAL =================== */
              <div
                className={`bg-white text-zinc-900 font-mono text-xs p-5 rounded-sm shadow-xl border-t-8 border-t-emerald-500 transition-all ${
                  paperSize === '58mm' ? 'w-[290px]' : 'w-[360px]'
                }`}
                style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
              >
                <div className="text-center pb-2 border-b border-dashed border-zinc-400">
                  <div className="font-extrabold text-sm uppercase tracking-wide">{settings.storeName}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{settings.storeSlogan}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{settings.address}</div>
                  <div className="text-[10px] text-zinc-700 mt-0.5 font-semibold">Telp/WA: {settings.phone}</div>
                </div>

                <div className="py-2 border-b border-dashed border-zinc-400 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>No Faktur:</span>
                    <span className="font-bold">{transaction.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{formatDate(transaction.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>{transaction.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pelanggan:</span>
                    <span className="font-semibold">{transaction.customerName || 'Umum'}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-zinc-400 space-y-2">
                  {transaction.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="font-semibold leading-tight text-zinc-800">{item.productName}</div>
                      <div className="flex justify-between text-zinc-600 pl-2">
                        <span>
                          {item.quantity} {item.unitName} x {formatRupiah(item.sellPrice)}
                        </span>
                        <span className="font-bold text-zinc-900">{formatRupiah(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span>{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {transaction.discount > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Diskon:</span>
                      <span>-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-sm text-zinc-950 pt-1 border-t border-zinc-300">
                    <span>TOTAL:</span>
                    <span>{formatRupiah(transaction.total)}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-zinc-400 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold uppercase tracking-wider">{transaction.paymentMethod}</span>
                  </div>
                  {transaction.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between">
                        <span>Tunai Diterima:</span>
                        <span>{formatRupiah(transaction.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800">
                        <span>Kembalian:</span>
                        <span>{formatRupiah(transaction.changeAmount)}</span>
                      </div>
                    </>
                  )}
                  {transaction.isKasbon && (
                    <div className="p-1.5 bg-amber-50 border border-amber-300 rounded text-amber-900 text-[10px] mt-1">
                      <div className="font-bold">STATUS: KASBON / TEMPO PANEN</div>
                      {transaction.kasbonDueDate && (
                        <div>Jatuh Tempo: {formatDate(transaction.kasbonDueDate)}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center pt-3 text-[10px] text-zinc-600 space-y-1">
                  <div>{settings.receiptFooter}</div>
                  <div className="text-[9px] text-zinc-400 pt-1 font-mono">
                    *** Simpan struk ini sebagai bukti transaksi resmi ***
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-3">
            {/* Action Box */}
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {docType === 'a4' ? 'Aksi Faktur Invoice A4' : 'Aksi Struk Kasir'}
              </h4>

              {docType === 'thermal' && (
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700 text-xs font-medium mb-2">
                  <button
                    type="button"
                    onClick={() => setPaperSize('80mm')}
                    className={`flex-1 py-1 rounded transition-colors ${
                      paperSize === '80mm' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('58mm')}
                    className={`flex-1 py-1 rounded transition-colors ${
                      paperSize === '58mm' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    58mm
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${
                  docType === 'a4'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                }`}
              >
                <Printer className="w-4 h-4" />
                {docType === 'a4' ? 'Cetak Faktur A4' : 'Cetak Struk Termal'}
              </button>

              <a
                href={docType === 'a4' ? waInvoiceA4Url : waReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {docType === 'a4' ? 'Kirim Invoice A4 ke WA' : 'Kirim Struk ke WA'}
              </a>

              {docType === 'a4' ? (
                <button
                  type="button"
                  onClick={handleDownloadInvoiceHtml}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh File Invoice (.html)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh File Teks (.txt)
                </button>
              )}

              {docType === 'thermal' && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Teks Tersalin!' : 'Salin Teks Struk'}
                </button>
              )}
            </div>

            {/* Delivery Surat Jalan Prompt */}
            {onOpenSuratJalan && (
              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold">
                  <Truck className="w-4 h-4" />
                  <span>Kirim dengan Armada Toko?</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Terbitkan Surat Jalan pengiriman resmi untuk sopir/pick-up langsung dari faktur ini.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenSuratJalan(transaction)}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  + Terbitkan Surat Jalan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-800 border-t border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
