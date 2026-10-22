/**
 * Kasbon & Piutang Pelanggan (Peternak & Nelayan) Component
 */

import React, { useState } from 'react';
import { CustomerCredit, StoreSettings, KasbonPaymentRecord } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatRupiah,
  formatDate,
  formatDateTime,
  createWhatsAppKasbonReminderUrl,
  downloadFile,
  exportToCsv,
} from '../../utils/format';
import {
  BookOpen,
  User,
  Plus,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface KasbonViewProps {
  customers: CustomerCredit[];
  settings: StoreSettings;
  onRefreshCustomers: () => void;
}

export const KasbonView: React.FC<KasbonViewProps> = ({
  customers,
  settings,
  onRefreshCustomers,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'belum_lunas' | 'lunas'>('belum_lunas');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Installment Modal
  const [selectedCustForPay, setSelectedCustForPay] = useState<CustomerCredit | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedBank, setSelectedBank] = useState(settings.bankAccounts[0]?.bankName || 'BCA');

  // Detail / Payment History Modal
  const [selectedCustDetail, setSelectedCustDetail] = useState<CustomerCredit | null>(null);

  // New Customer Modal
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustFarmType, setNewCustFarmType] = useState('Peternak Broiler');
  const [newCustLimit, setNewCustLimit] = useState<number>(15000000);

  // Filtered List
  const filteredCustomers = customers.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.farmType.toLowerCase().includes(q)
    );
  });

  // Aggregate stats
  const totalOutstandingPiutang = customers
    .filter((c) => c.status === 'belum_lunas')
    .reduce((acc, c) => acc + c.balance, 0);

  const totalPaidPiutang = customers.reduce((acc, c) => acc + c.totalPaid, 0);
  const activeUnpaidCount = customers.filter((c) => c.status === 'belum_lunas').length;

  // Handle Pay Kasbon Submit
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPay) return;

    if (paymentAmount <= 0) {
      alert('Nominal cicilan harus lebih besar dari 0!');
      return;
    }

    if (paymentAmount > selectedCustForPay.balance) {
      if (!confirm('Nominal melebihi sisa hutang. Lanjutkan pembayaran?')) {
        return;
      }
    }

    StorageService.payKasbon(
      selectedCustForPay.id,
      paymentAmount,
      paymentMethod,
      paymentNotes,
      paymentMethod === 'transfer' ? selectedBank : undefined
    );

    onRefreshCustomers();
    alert(`Pembayaran cicilan senilai ${formatRupiah(paymentAmount)} berhasil dicatat!`);
    setSelectedCustForPay(null);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  // Handle Create Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: CustomerCredit = {
      id: 'cust-' + Date.now(),
      customerName: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || 'Desa Sekitar',
      farmType: newCustFarmType,
      totalCredit: 0,
      totalPaid: 0,
      balance: 0,
      creditLimit: newCustLimit,
      status: 'lunas',
      transactions: [],
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = StorageService.getCustomers();
    list.unshift(newCust);
    StorageService.saveCustomers(list);
    onRefreshCustomers();

    setIsNewCustModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Export Kasbon to CSV
  const handleExportCsv = () => {
    const headers = [
      'Nama Pelanggan',
      'No. Telepon / WA',
      'Usaha / Tambak / Kandang',
      'Limit Kredit',
      'Total Piutang Diambil',
      'Total Telah Dicicil',
      'Sisa Hutang (Saldo)',
      'Status',
      'Jatuh Tempo Panen',
    ];

    const rows = customers.map((c) => [
      c.customerName,
      c.phone,
      c.farmType,
      c.creditLimit,
      c.totalCredit,
      c.totalPaid,
      c.balance,
      c.status === 'lunas' ? 'LUNAS' : 'BELUM LUNAS',
      c.dueDate ? formatDate(c.dueDate) : '-',
    ]);

    exportToCsv(`Buku_Kasbon_Piutang_AgroFish_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Print Payment Receipt
  const handlePrintCustomerSlip = (c: CustomerCredit) => {
    let out = `BUKTI REKAPITULASI PIUTANG & KASBON\n${settings.storeName}\n${settings.address}\nTelp: ${settings.phone}\n`;
    out += `==============================================\n`;
    out += `Pelanggan   : ${c.customerName}\n`;
    out += `Usaha/Ternak: ${c.farmType}\n`;
    out += `Kontak      : ${c.phone}\n`;
    out += `Total Piutang Diambil : ${formatRupiah(c.totalCredit)}\n`;
    out += `Total Cicilan Dibayar : ${formatRupiah(c.totalPaid)}\n`;
    out += `SISA HUTANG / SALDO   : ${formatRupiah(c.balance)}\n`;
    out += `Status                : ${c.status === 'lunas' ? 'LUNAS SELESAI' : 'BELUM LUNAS'}\n`;
    out += `----------------------------------------------\n`;
    out += `RIWAYAT CICILAN PEMBAYARAN:\n`;
    c.paymentHistory.forEach((p, idx) => {
      out += `${idx + 1}. ${formatDate(p.date)} - ${formatRupiah(p.amount)} (${p.paymentMethod.toUpperCase()}) - ${p.notes || '-'}\n`;
    });
    out += `==============================================\n`;
    out += `Dicetak oleh kasir: ${settings.activeCashier} pada ${new Date().toLocaleString('id-ID')}\n`;

    downloadFile(`Rekap_Kasbon_${c.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, out);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              Total Piutang Belum Lunas
            </span>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              {formatRupiah(totalOutstandingPiutang)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{activeUnpaidCount} peternak/nelayan tempo</p>
          </div>
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
              Total Piutang Terbayar
            </span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {formatRupiah(totalPaidPiutang)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi cicilan masuk kasir</p>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Pelanggan Terdaftar
            </span>
            <h3 className="text-2xl font-black text-white mt-1">{customers.length} Orang</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Kelompok tani, tambak & nelayan</p>
          </div>
          <div className="p-3 bg-slate-800 text-slate-300 rounded-2xl">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterStatus('belum_lunas')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === 'belum_lunas'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Belum Lunas ({customers.filter((c) => c.status === 'belum_lunas').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('lunas')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === 'lunas'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sudah Lunas ({customers.filter((c) => c.status === 'lunas').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua ({customers.length})
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, WA, atau jenis ternak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Ekspor Excel
          </button>

          <button
            type="button"
            onClick={() => setIsNewCustModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Tambah Pelanggan
          </button>
        </div>
      </div>

      {/* CUSTOMERS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const isLunas = cust.status === 'lunas';
          const waUrl = createWhatsAppKasbonReminderUrl(cust, settings);

          return (
            <div
              key={cust.id}
              className={`p-5 bg-slate-900 border rounded-2xl flex flex-col justify-between transition-all ${
                isLunas
                  ? 'border-slate-800 hover:border-emerald-500/50'
                  : 'border-amber-500/40 hover:border-amber-400 shadow-lg'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base text-white">{cust.customerName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{cust.farmType}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Telp/WA: {cust.phone || '-'}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isLunas
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {isLunas ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>

                {/* Piutang Box */}
                <div className="mt-4 p-3.5 bg-slate-950 rounded-xl space-y-2 border border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Piutang:</span>
                    <span className="font-mono text-slate-200">{formatRupiah(cust.totalCredit)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Telah Dicicil:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {formatRupiah(cust.totalPaid)}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-800">
                    <span className="text-slate-300">Sisa Tagihan:</span>
                    <span className={isLunas ? 'text-emerald-400' : 'text-amber-400 font-extrabold'}>
                      {formatRupiah(cust.balance)}
                    </span>
                  </div>

                  {cust.dueDate && !isLunas && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 pt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Estimasi Panen: {formatDate(cust.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                {!isLunas && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustForPay(cust);
                        setPaymentAmount(cust.balance);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Catat Cicilan
                    </button>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Kirim Pengingat Tagihan via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Tagih WA
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCustDetail(cust)}
                  className={`py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors ${
                    isLunas ? 'w-full' : ''
                  }`}
                >
                  Detail & Bukti
                </button>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-white">Tidak ada data pelanggan kasbon</p>
          </div>
        )}
      </div>

      {/* CATAT CICILAN MODAL */}
      {selectedCustForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Catat Pembayaran Cicilan Piutang</h3>
                <p className="text-xs text-slate-400">{selectedCustForPay.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustForPay(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Total Sisa Tagihan:</span>
              <span className="font-bold text-amber-400 text-sm font-mono">
                {formatRupiah(selectedCustForPay.balance)}
              </span>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nominal Cicilan Dibayar (Rp) *
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Metode Pembayaran:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'transfer', 'qris'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-colors ${
                        paymentMethod === m
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Catatan / Keterangan Pembayaran:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Panen ayam tahap 1 kandang barat..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCustForPay(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Cicilan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL & RIWAYAT CICILAN MODAL */}
      {selectedCustDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Detail & Riwayat Cicilan Kasbon</h3>
                <p className="text-xs text-slate-400">{selectedCustDetail.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Total Pernah Diambil:</span>
                  <div className="font-bold text-white text-sm font-mono">{formatRupiah(selectedCustDetail.totalCredit)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Total Telah Dibayar:</span>
                  <div className="font-bold text-emerald-400 text-sm font-mono">{formatRupiah(selectedCustDetail.totalPaid)}</div>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-xs text-white uppercase tracking-wider mb-2">
                  Riwayat Pembayaran Cicilan:
                </h5>

                {selectedCustDetail.paymentHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustDetail.paymentHistory.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono">{formatRupiah(rec.amount)}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateTime(rec.date)} • Met: <span className="uppercase">{rec.paymentMethod}</span>
                          </div>
                          {rec.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">{rec.notes}</div>}
                        </div>
                        <span className="text-[10px] text-slate-500">Penerima: {rec.receiver}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">Belum ada catatan cicilan pembayaran.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handlePrintCustomerSlip(selectedCustDetail)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" /> Cetak / Unduh Rekap
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Registrasi Pelanggan Baru</h3>
              <button
                type="button"
                onClick={() => setIsNewCustModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Nama Lengkap / Pemilik Ternak *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. H. Mulyono"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  placeholder="0812-xxxx-xxxx"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Jenis Usaha / Kandang</label>
                <input
                  type="text"
                  placeholder="Contoh: Kandang Ayam Broiler 4.000 / Tambak Lele 5 Kolam"
                  value={newCustFarmType}
                  onChange={(e) => setNewCustFarmType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Alamat Domisili / Lokasi Tambak</label>
                <input
                  type="text"
                  placeholder="Contoh: Dusun Karang Turi RT 01/03"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Batas Maksimal Kasbon (Credit Limit)</label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                >
                  Daftarkan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
