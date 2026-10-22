/**
 * Electron Preload Script - AgroFish ERP & POS
 */

import { contextBridge, ipcRenderer } from 'electron';

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    getVersion: () => ipcRenderer.invoke('app:version'),
    printReceipt: (options) => ipcRenderer.invoke('app:print-receipt', options),
    openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
    onNavigate: (callback) => {
      ipcRenderer.on('electron:navigate', (event, page) => callback(page));
    },
  });
} catch (e) {
  console.warn('Preload bridge initialization:', e);
}
