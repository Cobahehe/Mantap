/**
 * Settings Component - Toko, Kasir, Rekening & Backup Sistem
 */

import React, { useState } from 'react';
import { StoreSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { downloadFile } from '../../utils/format';
import {
  Settings,
  Store,
  CreditCard,
  UserCheck,
  Download,
  Upload,
  RotateCcw,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Lock,
  KeyRound,
  Shield,
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [newCashierName, setNewCashierName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankNumber, setNewBankNumber] = useState('');
  const [newBankHolder, setNewBankHolder] = useState(settings.storeName);

  // Auth Credentials State
  const initialAuth = StorageService.getAuthCredentials();
  const [authUsername, setAuthUsername] = useState(initialAuth.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const handleUpdateAuthCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const savedAuth = StorageService.getAuthCredentials();

    if (currentPassword !== savedAuth.password) {
      setAuthError('Password saat ini salah! Harap periksa kembali.');
      return;
    }

    if (!authUsername.trim()) {
      setAuthError('Username tidak boleh kosong!');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setAuthError('Konfirmasi password baru tidak cocok!');
      return;
    }

    const finalPassword = newPassword.trim() ? newPassword.trim() : savedAuth.password;

    StorageService.saveAuthCredentials({
      username: authUsername.trim(),
      password: finalPassword,
      lastLogin: savedAuth.lastLogin,
    });

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAuthSuccess('Kredensial login (username & password) berhasil diperbarui!');
  };

  // Backup & Import
  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadFile(`Backup_AgroFish_ERP_${dateStr}.json`, jsonStr, 'application/json');
    alert('Cadangan basis data lokal berhasil diunduh dalam berkas .JSON!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = StorageService.importFullBackup(content);
      if (ok) {
        alert('Data berhasil dipulihkan dari cadangan! Sistem akan memuat ulang.');
        window.location.reload();
      } else {
        alert('Gagal memulihkan file cadangan. Format file JSON tidak sesuai.');
      }
    };
    reader.readAsText(file);
  };

  // Add Cashier
  const handleAddCashier = () => {
    if (!newCashierName.trim()) return;
    if (formData.cashiers.includes(newCashierName.trim())) {
      alert('Nama kasir sudah terdaftar!');
      return;
    }
    const updated = {
      ...formData,
      cashiers: [...formData.cashiers, newCashierName.trim()],
    };
    setFormData(updated);
    setNewCashierName('');
  };

  const handleRemoveCashier = (name: string) => {
    if (formData.cashiers.length <= 1) {
      alert('Minimal harus ada 1 kasir terdaftar!');
      return;
    }
    const updated = {
      ...formData,
      cashiers: formData.cashiers.filter((c) => c !== name),
      activeCashier: formData.activeCashier === name ? formData.cashiers[0] : formData.activeCashier,
    };
    setFormData(updated);
  };

  // Add Bank
  const handleAddBank = () => {
    if (!newBankName.trim() || !newBankNumber.trim()) return;
    const updated = {
      ...formData,
      bankAccounts: [
        ...formData.bankAccounts,
        {
          id: 'bank-' + Date.now(),
          bankName: newBankName.trim(),
          accountNumber: newBankNumber.trim(),
          holderName: newBankHolder.trim() || formData.storeName,
        },
      ],
    };
    setFormData(updated);
    setNewBankName('');
    setNewBankNumber('');
  };

  const handleRemoveBank = (id: string) => {
    if (formData.bankAccounts.length <= 1) {
      alert('Minimal harus ada 1 nomor rekening!');
      return;
    }
    setFormData({
      ...formData,
      bankAccounts: formData.bankAccounts.filter((b) => b.id !== id),
    });
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(formData);
    onUpdateSettings(formData);
    alert('Pengaturan toko berhasil diperbarui!');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Pengaturan Sistem & Toko</h3>
            <p className="text-xs text-slate-400">
              Konfigurasi profil toko, rekening pembayaran, kasir bertugas, dan pencadangan basis data.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-colors"
        >
          Simpan Perubahan
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* STORE PROFILE */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Store className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">Identitas & Profil Toko</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Toko *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Slogan Toko</label>
              <input
                type="text"
                value={formData.storeSlogan}
                onChange={(e) => setFormData({ ...formData, storeSlogan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Nomor Telepon / WhatsApp Resmi Toko
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ukuran Kertas Default Cetak Struk
              </label>
              <select
                value={formData.paperSize}
                onChange={(e) => setFormData({ ...formData, paperSize: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="80mm">Thermal 80mm (Lebar Standar Kasir Minimarket)</option>
                <option value="58mm">Thermal 58mm (Printer Kasir Mini Portabel)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Alamat Toko Lengkap</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Catatan Kaki Struk (Receipt Footer Note)
            </label>
            <input
              type="text"
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* CASHIER MANAGEMENT */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <UserCheck className="w-5 h-5 text-blue-400" />
            <h4 className="font-bold text-sm text-white">Kasir Bertugas & Daftar Kasir</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Kasir Aktif Sekarang:</label>
              <select
                value={formData.activeCashier}
                onChange={(e) => setFormData({ ...formData, activeCashier: e.target.value })}
                className="w-full bg-slate-950 border border-emerald-500 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold"
              >
                {formData.cashiers.map((c) => (
                  <option key={c} value={c}>
                    {c} (Sedang Bertugas)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Tambah Kasir Baru:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama kasir baru..."
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCashier}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block mb-2">Kasir Terdaftar di Sistem:</span>
            <div className="flex flex-wrap gap-2">
              {formData.cashiers.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                >
                  <span className="text-white font-medium">{c}</span>
                  {c === formData.activeCashier ? (
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold">
                      Aktif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveCashier(c)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BANK ACCOUNTS */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h4 className="font-bold text-sm text-white">Nomor Rekening Pembayaran Transfer</h4>
          </div>

          <div className="space-y-3">
            {formData.bankAccounts.map((b) => (
              <div
                key={b.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-white">{b.bankName}</div>
                  <div className="font-mono text-xs text-emerald-400">{b.accountNumber}</div>
                  <div className="text-[11px] text-slate-400">a.n. {b.holderName}</div>
                </div>

                {formData.bankAccounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBank(b.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Bank Form */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Nama Bank:</label>
              <input
                type="text"
                placeholder="BCA / BRI / Mandiri"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Nomor Rekening:</label>
              <input
                type="text"
                placeholder="123-456-7890"
                value={newBankNumber}
                onChange={(e) => setNewBankNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Atas Nama:</label>
              <input
                type="text"
                placeholder="AGROFISH SEJAHTERA"
                value={newBankHolder}
                onChange={(e) => setNewBankHolder(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleAddBank}
              className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
            >
              + Tambah Rekening
            </button>
          </div>
        </div>

        {/* LOGIN CREDENTIALS MANAGEMENT (Username & Password) */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-bold text-sm text-white">Keamanan & Kredensial Login Aplikasi</h4>
                <p className="text-xs text-slate-400">Ubah username dan password untuk masuk ke aplikasi (Default: admin / admin)</p>
              </div>
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Username Baru / Saat Ini *
              </label>
              <input
                type="text"
                required
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Password Saat Ini (Konfirmasi Keamanan) *
              </label>
              <input
                type="password"
                placeholder="Ketik password lama..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Password Baru (Opsional jika hanya ganti username)
              </label>
              <input
                type="password"
                placeholder="Ketik password baru..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ulangi Password Baru
              </label>
              <input
                type="password"
                placeholder="Konfirmasi password baru..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleUpdateAuthCredentials}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Perbarui Kredensial Login
            </button>
          </div>
        </div>

        {/* BACKUP & RESTORE DATA */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Download className="w-5 h-5 text-emerald-400" />
            <h4 className="font-bold text-sm text-white">Cadangan (Backup) & Pemulihan Sistem Mandiri</h4>
          </div>

          <p className="text-xs text-slate-400">
            Seluruh data master stok barang, riwayat transaksi kasir, buku piutang kasbon, surat jalan, dan kartu stok disimpan secara aman di komputer lokal Anda.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-center group"
            >
              <Download className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-xs text-white">Ekspor Backup JSON</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Unduh seluruh database</div>
              </div>
            </button>

            {/* Import JSON */}
            <label className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-center cursor-pointer group">
              <Upload className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-xs text-white">Impor / Pulihkan JSON</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Muat berkas cadangan</div>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            {/* Reset to Seed */}
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'PERINGATAN: Semua data akan direset kembali ke data bawaan pabrik/sampel! Pastikan Anda sudah membuat cadangan terlebih dahulu. Lanjutkan?'
                  )
                ) {
                  onResetAllData();
                }
              }}
              className="p-4 bg-slate-950 hover:bg-red-950/30 border border-red-900/40 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-center group"
            >
              <RotateCcw className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-xs text-red-300">Reset ke Data Sampel</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Kembalikan produk awal</div>
              </div>
            </button>
          </div>
        </div>

        {/* WINDOWS DESKTOP PACKAGING INSTRUCTIONS */}
        <div className="p-6 bg-slate-900 border border-blue-900/40 rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Monitor className="w-5 h-5 text-blue-400" />
            <h4 className="font-bold text-sm text-white">Panduan Pembuatan Installer Windows Desktop (.exe)</h4>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Aplikasi ini telah dikonfigurasi penuh dengan <strong>Electron.js</strong> dan <strong>electron-builder</strong>. Anda dapat mengemasnya menjadi installer desktop Windows offline yang mandiri:
          </p>

          <div className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400 border border-slate-800 space-y-1">
            <div className="text-slate-400"># 1. Jalankan development desktop:</div>
            <div>npm run dev</div>
            <div className="text-slate-400 pt-1"># 2. Kemas menjadi installer Windows (.exe) ke folder /release:</div>
            <div>npm run package</div>
          </div>

          <p className="text-[11px] text-slate-400">
            Hasil berkas installer akan berada di folder <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">release/AgroFish ERP POS Setup 1.0.0.exe</code> lengkap dengan shortcut desktop, menu bar native, dan dukungan printer thermal kasir.
          </p>
        </div>
      </form>
    </div>
  );
};
