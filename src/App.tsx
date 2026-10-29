/**
 * AgroFish ERP & POS Desktop Application
 * Toko Pakan Ternak, Pelet Ikan & Alat Pancing Nelayan
 */

import React, { useState, useEffect } from 'react';
import { Product, Transaction, CustomerCredit, DeliveryNote, StoreSettings } from './types';
import { StorageService } from './services/storage';
import { Navbar, MainNavPage } from './components/Navbar';
import { PosView } from './components/pos/PosView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsView } from './components/reports/ReportsView';
import { KasbonView } from './components/kasbon/KasbonView';
import { DeliveryView } from './components/delivery/DeliveryView';
import { RestockView } from './components/restock/RestockView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(StorageService.isLoggedIn());
  const [currentUser, setCurrentUser] = useState<string>(() => StorageService.getAuthCredentials().username);
  const [currentPage, setCurrentPage] = useState<MainNavPage>('pos');

  // Core App Data
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<CustomerCredit[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryNote[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(StorageService.getSettings());

  // Inter-tab transition helper (e.g. from POS Receipt to Delivery)
  const [deliveryTrxTarget, setDeliveryTrxTarget] = useState<Transaction | null>(null);

  // Initial Data Load
  const loadData = () => {
    setProducts(StorageService.getProducts());
    setTransactions(StorageService.getTransactions());
    setCustomers(StorageService.getCustomers());
    setDeliveries(StorageService.getDeliveries());
    setSettings(StorageService.getSettings());
    setCurrentUser(StorageService.getAuthCredentials().username);
  };

  useEffect(() => {
    loadData();

    // Check if running in Electron and setup IPC navigation listener
    // @ts-ignore
    if (window.electronAPI && window.electronAPI.onNavigate) {
      // @ts-ignore
      window.electronAPI.onNavigate((page: MainNavPage) => {
        setCurrentPage(page);
      });
    }
  }, []);

  // Handlers
  const handleCashierChange = (newCashier: string) => {
    const updated = { ...settings, activeCashier: newCashier };
    StorageService.saveSettings(updated);
    setSettings(updated);
  };

  const handleTransactionComplete = (trx: Transaction) => {
    loadData();
  };

  const handleOpenSuratJalanFromPOS = (trx: Transaction) => {
    setDeliveryTrxTarget(trx);
    setCurrentPage('delivery');
  };

  const handleResetAllData = () => {
    StorageService.resetToDefault();
    loadData();
    alert('Seluruh data berhasil direset ke data sampel awal bawaan toko!');
  };

  const handleLogout = () => {
    StorageService.logout();
    setIsAuthenticated(false);
    setCurrentPage('pos');
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased select-none">
      {/* Top Main Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        settings={settings}
        products={products}
        onCashierChange={handleCashierChange}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentPage === 'pos' && (
          <PosView
            products={products}
            settings={settings}
            customers={customers}
            onTransactionComplete={handleTransactionComplete}
            onOpenSuratJalan={handleOpenSuratJalanFromPOS}
          />
        )}

        {currentPage === 'inventory' && (
          <InventoryView
            products={products}
            settings={settings}
            onRefreshProducts={loadData}
            onUpdateSettings={setSettings}
          />
        )}

        {currentPage === 'reports' && (
          <ReportsView
            transactions={transactions}
            settings={settings}
            onRefreshData={loadData}
            onOpenSuratJalan={handleOpenSuratJalanFromPOS}
          />
        )}

        {currentPage === 'kasbon' && (
          <KasbonView
            customers={customers}
            settings={settings}
            onRefreshCustomers={loadData}
          />
        )}

        {currentPage === 'delivery' && (
          <DeliveryView
            deliveries={deliveries}
            transactions={transactions}
            settings={settings}
            onRefreshDeliveries={loadData}
            initialCreateFromTrx={deliveryTrxTarget}
            onClearInitialTrx={() => setDeliveryTrxTarget(null)}
          />
        )}

        {currentPage === 'restock' && (
          <RestockView
            products={products}
            settings={settings}
            onRefreshData={loadData}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetAllData={handleResetAllData}
            onAuthUpdated={(newU) => setCurrentUser(newU)}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  );
}
