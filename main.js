/**
 * Electron Main Process - AgroFish ERP & POS Desktop
 * Sistem ERP Toko Pakan Ternak, Pelet Ikan & Alat Pancing Nelayan
 */

import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1080,
    minHeight: 700,
    title: 'AgroFish ERP & POS Desktop',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, 'public/icon.ico'),
    show: false, // will show when ready-to-show to prevent white flash
  });

  // Check development or production mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  if (isDev) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      // If dev server not yet ready, load from dist
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    });
    // Open DevTools in dev mode if needed
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Handle external links (like WhatsApp wa.me) securely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  setupAppMenu();
}

function setupAppMenu() {
  const template = [
    {
      label: 'Sistem POS',
      submenu: [
        {
          label: 'Fokus Kasir / POS (F2)',
          accelerator: 'F2',
          click: () => {
            mainWindow?.webContents.send('electron:navigate', 'pos');
          },
        },
        {
          label: 'Inventaris Stok (F3)',
          accelerator: 'F3',
          click: () => {
            mainWindow?.webContents.send('electron:navigate', 'inventory');
          },
        },
        {
          label: 'Laporan Penjualan (F4)',
          accelerator: 'F4',
          click: () => {
            mainWindow?.webContents.send('electron:navigate', 'reports');
          },
        },
        { type: 'separator' },
        {
          label: 'Cetak Dokumen / Struk',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.print({ silent: false, printBackground: true });
          },
        },
        { type: 'separator' },
        { label: 'Keluar', role: 'quit' },
      ],
    },
    {
      label: 'Tampilan',
      submenu: [
        { label: 'Muat Ulang (Reload)', role: 'reload', accelerator: 'F5' },
        { label: 'Paksa Muat Ulang', role: 'forceReload' },
        { label: 'Alat Pengembang (DevTools)', role: 'toggleDevTools', accelerator: 'Ctrl+Shift+I' },
        { type: 'separator' },
        { label: 'Layar Penuh (Fullscreen)', role: 'togglefullscreen', accelerator: 'F11' },
      ],
    },
    {
      label: 'Bantuan',
      submenu: [
        {
          label: 'Tentang AgroFish ERP',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tentang AgroFish ERP & POS',
              message: 'AgroFish ERP & POS Desktop v1.0.0',
              detail: 'Aplikasi Desktop Khusus Toko Pakan Ternak, Pelet Ikan & Alat Pancing Nelayan.\nDibangun dengan React, Vite, dan Electron.js.\nDatabase lokal mandiri dan aman.',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('app:print-receipt', async (event, options) => {
  if (!mainWindow) return false;
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options?.silent || false,
        printBackground: true,
        deviceName: options?.deviceName || '',
      },
      (success, failureReason) => {
        resolve({ success, failureReason });
      }
    );
  });
});

ipcMain.handle('app:open-external', async (event, url) => {
  return shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
