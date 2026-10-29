/**
 * Login Screen - AgroFish ERP & POS Desktop
 * Kredensial default: username 'admin', password 'admin'
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/storage';
import {
  Wheat,
  Fish,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Monitor,
  Zap,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear any legacy permanent local storage session when landing on login screen
  useEffect(() => {
    try {
      localStorage.removeItem('agrofish_session_v1');
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLogin = (userToSubmit: string, passToSubmit: string) => {
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const res = StorageService.login(userToSubmit, passToSubmit);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Username atau password tidak cocok!');
      }
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Harap masukkan username (default: admin)');
      return;
    }
    if (!password) {
      setErrorMsg('Harap masukkan password (default: admin)');
      return;
    }
    handleLogin(username, password);
  };

  const handleQuickLoginDefault = () => {
    const creds = StorageService.getAuthCredentials();
    const u = creds.username || 'admin';
    const p = creds.password || 'admin';
    setUsername(u);
    setPassword(p);
    handleLogin(u, p);
  };

  const handleFillDefaultInputs = () => {
    const creds = StorageService.getAuthCredentials();
    setUsername(creds.username || 'admin');
    setPassword(creds.password || 'admin');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/60 mb-3.5">
            <div className="flex items-center text-white">
              <Wheat className="w-7 h-7 -mr-1.5" />
              <Fish className="w-7 h-7" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>AGROFISH</span>
            <span className="text-emerald-400 font-extrabold">ERP & POS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sistem Kasir Toko Pakan Ternak, Pelet Ikan & Alat Nelayan
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-emerald-300 font-mono">
            <Monitor className="w-3 h-3" />
            Aplikasi Desktop Offline Mandiri (.EXE)
          </div>
        </div>

        {/* Default Credentials Information Card */}
        <div className="mb-5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Kredensial Default Masuk:
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded font-mono">
              Aktif
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300">
            <span>Username: <strong className="text-emerald-400">admin</strong></span>
            <span>Password: <strong className="text-emerald-400">admin</strong></span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Masukkan username (default: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Masukkan password (default: admin)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Action Helpers */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleFillDefaultInputs}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>Isi Form Otomatis</span>
            </button>

            <button
              type="button"
              onClick={handleQuickLoginDefault}
              className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-emerald-800/40 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Masuk 1-Klik</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Memverifikasi Akses...</span>
            ) : (
              <>
                <span>Masuk ke Sistem ERP POS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-1">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Akses terproteksi. Login diperlukan setiap membuka aplikasi.</span>
          </p>
          <p className="text-[10px] text-slate-500">
            Username dan password dapat diubah kapan saja di menu Pengaturan.
          </p>
        </div>
      </div>
    </div>
  );
};
