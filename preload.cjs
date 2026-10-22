/**
 * Electron Preload Script - CommonJS (.cjs)
 * Diperlukan ekstensi .cjs karena package.json menggunakan "type": "module"
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getVersion: () => ipcRenderer.invoke('app:version'),
  printReceipt: (options) => ipcRenderer.invoke('app:print-receipt', options),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),
  onNavigate: (callback) => {
    ipcRenderer.on('electron:navigate', (event, page) => callback(page));
  },
});
