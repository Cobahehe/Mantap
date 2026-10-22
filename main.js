/**
 * Electron Main Process - AgroFish ERP & POS Desktop
 * Sistem ERP Toko Pakan Ternak, Pelet Ikan & Alat Pancing Nelayan
 */

import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// Handle uncaught exceptions to prevent silent crash
process.on('uncaughtException', (error) => {
  console.error('Main Process Error:', error);
});

function findPreloadScript() {
  const candidates = [
    path.join(__dirname, 'preload.cjs'),
    path.join(app.getAppPath(), 'preload.cjs'),
    path.join(__dirname, 'preload.js'),
    path.join(app.getAppPath(), 'preload.js'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, 'preload.cjs');
}

function findIndexHtml() {
  const candidates = [
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(app.getAppPath(), 'dist', 'index.html');
}

function findAppIcon() {
  const candidates = [
    path.join(__dirname, 'public', 'icon.ico'),
    path.join(__dirname, 'public', 'icon.png'),
    path.join(app.getAppPath(), 'public', 'icon.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function createWindow() {
  const icon = findAppIcon();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: 'AgroFish ERP & POS Desktop',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: findPreloadScript(),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Memastikan aset lokal file:// dapat dimuat tanpa terblokir di Windows
    },
    ...(icon ? { icon } : {}),
    show: false,
  });

  // Cek apakah mode dev atau aplikasi terinstal (.exe)
  const isDev = !app.isPackaged && (process.env.NODE_ENV === 'development' || Boolean(process.env.VITE_DEV_SERVER_URL));
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';

  if (isDev) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      const localFile = findIndexHtml();
      mainWindow.loadFile(localFile);
    });
  } else {
    // Mode Produksi / Terinstall .exe
    const localFile = findIndexHtml();
    mainWindow.loadFile(localFile).catch((err) => {
      console.error('Gagal memuat dist/index.html:', err);
      dialog.showErrorBox(
        'Gagal Membuka Halaman Aplikasi',
        `Berkas antarmuka tidak ditemukan pada:\n${localFile}\n\nPastikan Anda telah menjalankan "npm run build" sebelum membuat paket instalasi installer.`
      );
    });
  }

  // Tampilkan jendela saat sudah siap agar tidak ada white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Tangani kegagalan muat halaman
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`did-fail-load: ${errorCode} - ${errorDescription}`);
    if (isDev) {
      const localFile = findIndexHtml();
      if (fs.existsSync(localFile)) {
        mainWindow.loadFile(localFile);
      }
    }
  });

  // Buka link WhatsApp / website di browser default Windows, bukan di dalam Electron
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
  if (!mainWindow) return { success: false, failureReason: 'No window' };
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

// App Lifecycle
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
