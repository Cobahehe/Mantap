/**
 * Login Screen - AgroFish ERP & POS Desktop
 * Kredensial default: username 'admin', password 'admin'
 */

import React, { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const res = StorageService.login(username, password);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(res.message || 'Username atau password tidak cocok!');
      }
    }, 300);
  };

  const handleFillDefault = () => {
    setUsername('admin');
    setPassword('admin');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/60 mb-4">
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
            Sistem Kasir Toko Pakan Ternak, Pelet Ikan & Alat Pancing
          </p>
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-emerald-300 font-mono">
            <Monitor className="w-3 h-3" />
            Aplikasi Desktop Offline Mandiri
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Default Fill button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleFillDefault}
              className="w-full py-1.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700/80 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gunakan Akun Default (admin / admin)</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk ke Sistem ERP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kredensial login dapat diubah kapan saja di menu Pengaturan.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
