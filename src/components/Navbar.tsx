/**
 * Top Navbar & Application Header
 */

import React, { useState, useEffect } from 'react';
import { StoreSettings, Product } from '../types';
import { checkExpiryStatus } from '../utils/format';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  BookOpen,
  Truck,
  PackagePlus,
  Settings,
  AlertTriangle,
  Calendar,
  User,
  Clock,
  Wheat,
  Fish,
  Sparkles,
  Monitor,
  LogOut,
  Shield,
} from 'lucide-react';

export type MainNavPage =
  | 'pos'
  | 'inventory'
  | 'reports'
  | 'kasbon'
  | 'delivery'
  | 'restock'
  | 'settings';

interface NavbarProps {
  currentPage: MainNavPage;
  onNavigate: (page: MainNavPage) => void;
  settings: StoreSettings;
  products: Product[];
  onCashierChange: (cashierName: string) => void;
  onLogout: () => void;
  currentUser?: string;
}


export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  settings,
  products,
  onCashierChange,
  onLogout,
  currentUser = 'admin',
}) => {
  const [timeStr, setTimeStr] = useState('');

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute Alerts
  const lowStockCount = products.filter((p) => p.stockInBaseUnit <= p.minStockAlert).length;
  const expiredCount = products
    .filter((p) => p.isFeed && p.batches)
    .flatMap((p) => p.batches || [])
    .filter((b) => checkExpiryStatus(b.expiryDate).status === 'warning' || checkExpiryStatus(b.expiryDate).status === 'expired').length;

  const navItems: { id: MainNavPage; label: string; icon: React.FC<{ className?: string }>; badge?: number; shortcut?: string }[] = [
    { id: 'pos', label: 'Kasir POS', icon: ShoppingCart, shortcut: 'F2' },
    { id: 'inventory', label: 'Master Stok', icon: Package, badge: lowStockCount },
    { id: 'reports', label: 'Laporan Laba', icon: TrendingUp },
    { id: 'kasbon', label: 'Buku Kasbon', icon: BookOpen },
    { id: 'delivery', label: 'Pengiriman & SJ', icon: Truck },
    { id: 'restock', label: 'Restock In-Out', icon: PackagePlus },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 shrink-0 select-none sticky top-0 z-40">
      {/* Top Bar: Brand, Time, Cashier, Alerts */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/50">
            <div className="flex items-center text-white">
              <Wheat className="w-4 h-4 -mr-1" />
              <Fish className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>AGROFISH</span>
                <span className="text-emerald-400 font-black">ERP & POS</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-300 rounded-full">
                <Monitor className="w-2.5 h-2.5" /> Desktop .EXE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden md:block">
              Pakan Ternak, Pelet Ikan & Perlengkapan Nelayan
            </p>
          </div>
        </div>

        {/* Right Info: Alert Badges, Cashier, Clock */}
        <div className="flex items-center gap-3">
          {/* Low Stock Indicator */}
          {lowStockCount > 0 && (
            <button
              onClick={() => onNavigate('inventory')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/25 transition-colors"
              title={`${lowStockCount} barang stok menipis`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockCount} Stok Kritis</span>
            </button>
          )}

          {/* Expired Feed Indicator */}
          {expiredCount > 0 && (
            <button
              onClick={() => onNavigate('inventory')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg hover:bg-amber-500/25 transition-colors"
              title={`${expiredCount} batch pakan mendekati kadaluarsa`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{expiredCount} Pakan Expired</span>
            </button>
          )}

          {/* Active Cashier Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={settings.activeCashier}
              onChange={(e) => onCashierChange(e.target.value)}
              className="bg-transparent border-0 text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {settings.cashiers.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  Kasir: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr}</span>
          </div>

          {/* User Badge & Logout Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              title="Kelola Akun & Ubah Password Login"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{currentUser}</span>
              <span className="text-[10px] text-slate-400 font-normal ml-0.5">(Atur Password)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin keluar (logout) dari aplikasi?')) {
                  onLogout();
                }
              }}
              title="Keluar / Logout Aplikasi"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="px-4 flex items-center gap-1 overflow-x-auto py-1.5 bg-slate-950/70">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>

              {item.shortcut && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.shortcut}
                </span>
              )}

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
