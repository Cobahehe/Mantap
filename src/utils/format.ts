/**
 * Formatters and Utilities for AgroFish ERP & POS
 */

import { Transaction, StoreSettings, CustomerCredit, DeliveryNote } from '../types';

export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp 0';
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return value.toLocaleString('id-ID');
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// Check expiration status
export function checkExpiryStatus(expiryDate?: string): {
  status: 'expired' | 'warning' | 'safe' | 'none';
  daysLeft: number;
  label: string;
} {
  if (!expiryDate) return { status: 'none', daysLeft: 999, label: 'Tanpa Kadaluarsa' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  
  const diffTime = exp.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { status: 'expired', daysLeft, label: `KADALUARSA (${Math.abs(daysLeft)} hr lalu)` };
  } else if (daysLeft <= 30) {
    return { status: 'warning', daysLeft, label: `Mendekati Kadaluarsa (${daysLeft} hari)` };
  }
  return { status: 'safe', daysLeft, label: `Aman (${daysLeft} hari)` };
}

// Download file helper
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export CSV with UTF-8 BOM for Excel
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const processCell = (cell: string | number) => {
    let str = cell === null || cell === undefined ? '' : String(cell);
    if (str.search(/("|,|\n)/g) >= 0) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows = [
    headers.map(processCell).join(','),
    ...rows.map(row => row.map(processCell).join(','))
  ];

  // \uFEFF is UTF-8 Byte Order Mark for Microsoft Excel compatibility
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  downloadFile(`${filename}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

// Generate Monospace Thermal Receipt Text
export function generateThermalReceiptText(trx: Transaction, settings: StoreSettings, paperWidth: '80mm' | '58mm' = '80mm'): string {
  const width = paperWidth === '58mm' ? 32 : 44;
  const padCenter = (str: string) => {
    if (str.length >= width) return str.slice(0, width);
    const totalPad = width - str.length;
    const leftPad = Math.floor(totalPad / 2);
    return ' '.repeat(leftPad) + str + ' '.repeat(totalPad - leftPad);
  };

  const line = '-'.repeat(width);
  const dline = '='.repeat(width);

  const padBetween = (left: string, right: string) => {
    const spaceCount = width - (left.length + right.length);
    if (spaceCount <= 0) return `${left} ${right}`;
    return left + ' '.repeat(spaceCount) + right;
  };

  let out = '';
  out += padCenter(settings.storeName) + '\n';
  out += padCenter(settings.storeSlogan) + '\n';
  out += padCenter(settings.address) + '\n';
  out += padCenter(`Telp/WA: ${settings.phone}`) + '\n';
  out += dline + '\n';

  out += padBetween(`No: ${trx.invoiceNo}`, formatDate(trx.timestamp)) + '\n';
  out += padBetween(`Kasir: ${trx.cashierName}`, `Pelanggan: ${trx.customerName || 'Umum'}`) + '\n';
  out += line + '\n';

  trx.items.forEach(item => {
    out += `${item.productName.slice(0, width)}\n`;
    const leftDetail = `  ${item.quantity} ${item.unitName} @ ${formatRupiah(item.sellPrice)}`;
    const rightSubtotal = formatRupiah(item.subtotal);
    out += padBetween(leftDetail, rightSubtotal) + '\n';
  });

  out += line + '\n';
  out += padBetween('Subtotal:', formatRupiah(trx.subtotal)) + '\n';
  if (trx.discount > 0) {
    out += padBetween('Diskon:', `-${formatRupiah(trx.discount)}`) + '\n';
  }
  out += padBetween('TOTAL AKHIR:', formatRupiah(trx.total)) + '\n';
  out += dline + '\n';

  out += padBetween('Metode Bayar:', trx.paymentMethod.toUpperCase()) + '\n';
  if (trx.paymentMethod === 'cash') {
    out += padBetween('Tunai Diterima:', formatRupiah(trx.amountPaid)) + '\n';
    out += padBetween('Kembalian:', formatRupiah(trx.changeAmount)) + '\n';
  } else if (trx.isKasbon) {
    out += padBetween('Status Piutang:', 'KASBON / TEMPO') + '\n';
    if (trx.kasbonDueDate) {
      out += padBetween('Jatuh Tempo/Panen:', formatDate(trx.kasbonDueDate)) + '\n';
    }
  }

  out += line + '\n';
  out += padCenter(settings.receiptFooter || 'Terima kasih atas kunjungan Anda!') + '\n';
  out += padCenter('*** SIMPAN STRUK INI SEBAGAI BUKTI ***') + '\n';

  return out;
}

// WhatsApp Message Builders
export function createWhatsAppReceiptUrl(trx: Transaction, settings: StoreSettings): string {
  const phone = trx.customerPhone ? trx.customerPhone.replace(/[^0-9]/g, '') : '';
  let formattedPhone = phone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.slice(1);
  }

  let text = `*STRUK PEMBELIAN - ${settings.storeName}*\n`;
  text += `--------------------------------------\n`;
  text += `No Faktur : ${trx.invoiceNo}\n`;
  text += `Tanggal   : ${formatDateTime(trx.timestamp)}\n`;
  text += `Kasir     : ${trx.cashierName}\n`;
  text += `Pelanggan : ${trx.customerName || 'Pelanggan Umum'}\n`;
  text += `--------------------------------------\n`;
  text += `*Rincian Barang:*\n`;

  trx.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.productName}\n`;
    text += `   ${item.quantity} ${item.unitName} x ${formatRupiah(item.sellPrice)} = *${formatRupiah(item.subtotal)}*\n`;
  });

  text += `--------------------------------------\n`;
  text += `*Subtotal:* ${formatRupiah(trx.subtotal)}\n`;
  if (trx.discount > 0) {
    text += `*Diskon:* -${formatRupiah(trx.discount)}\n`;
  }
  text += `*TOTAL BAYAR: ${formatRupiah(trx.total)}*\n`;
  text += `Metode: *${trx.paymentMethod.toUpperCase()}*\n`;

  if (trx.paymentMethod === 'cash') {
    text += `Tunai: ${formatRupiah(trx.amountPaid)}\n`;
    text += `Kembalian: ${formatRupiah(trx.changeAmount)}\n`;
  } else if (trx.isKasbon) {
    text += `*Status: KASBON / TEMPO*\n`;
    if (trx.kasbonDueDate) {
      text += `Estimasi Jatuh Tempo: ${formatDate(trx.kasbonDueDate)}\n`;
    }
  }

  text += `\n_${settings.receiptFooter}_\n`;
  text += `Hubungi kami: ${settings.phone}`;

  const encoded = encodeURIComponent(text);
  return formattedPhone ? `https://wa.me/${formattedPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function createWhatsAppKasbonReminderUrl(cust: CustomerCredit, settings: StoreSettings): string {
  let phone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
  if (phone.startsWith('0')) {
    phone = '62' + phone.slice(1);
  }

  let text = `*PENGINGAT TAGIHAN KASBON - ${settings.storeName}*\n\n`;
  text += `Halo Bpk/Ibu *${cust.customerName}*,\n`;
  text += `Semoga usaha ${cust.farmType || 'ternak/tambak'} Anda selalu lancar dan panen melimpah.\n\n`;
  text += `Berikut kami sampaikan rincian catatan kasbon / tempo pakan & perlengkapan Anda:\n`;
  text += `• Total Piutang: ${formatRupiah(cust.totalCredit)}\n`;
  text += `• Total Sudah Dicicil: ${formatRupiah(cust.totalPaid)}\n`;
  text += `• *SISA TAGIHAN:* *${formatRupiah(cust.balance)}*\n`;
  if (cust.dueDate) {
    text += `• Estimasi Jatuh Tempo/Panen: *${formatDate(cust.dueDate)}*\n`;
  }
  text += `\nPembayaran dapat ditransfer ke rekening toko:\n`;
  settings.bankAccounts.forEach(acc => {
    text += `- ${acc.bankName}: ${acc.accountNumber} a.n. ${acc.holderName}\n`;
  });
  text += `\nAtau pembayaran tunai langsung di kasir toko.\n`;
  text += `Terima kasih atas kerjasamanya! 🙏\n_${settings.storeName}_ - ${settings.phone}`;

  const encoded = encodeURIComponent(text);
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

// Convert Number to Indonesian Words (Terbilang)
export function angkaTerbilang(nilai: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  const n = Math.floor(Math.abs(nilai));

  function sebut(x: number): string {
    if (x < 12) return bilangan[x];
    if (x < 20) return sebut(x - 10) + ' Belas';
    if (x < 100) return sebut(Math.floor(x / 10)) + ' Puluh ' + sebut(x % 10);
    if (x < 200) return 'Seratus ' + sebut(x - 100);
    if (x < 1000) return sebut(Math.floor(x / 100)) + ' Ratus ' + sebut(x % 100);
    if (x < 2000) return 'Seribu ' + sebut(x - 1000);
    if (x < 1000000) return sebut(Math.floor(x / 1000)) + ' Ribu ' + sebut(x % 1000);
    if (x < 1000000000) return sebut(Math.floor(x / 1000000)) + ' Juta ' + sebut(x % 1000000);
    if (x < 1000000000000) return sebut(Math.floor(x / 1000000000)) + ' Milyar ' + sebut(x % 1000000000);
    return sebut(Math.floor(x / 1000000000000)) + ' Triliun ' + sebut(x % 1000000000000);
  }

  if (n === 0) return 'Nol Rupiah';
  const hasil = sebut(n).replace(/\s+/g, ' ').trim();
  return hasil + ' Rupiah';
}

// Generate WhatsApp Link specifically for Formal Invoice A4
export function createWhatsAppInvoiceA4Url(trx: Transaction, settings: StoreSettings): string {
  const phone = trx.customerPhone ? trx.customerPhone.replace(/[^0-9]/g, '') : '';
  let formattedPhone = phone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.slice(1);
  }

  let text = `*FAKTUR PENJUALAN RESMI (INVOICE)*\n`;
  text += `*${settings.storeName.toUpperCase()}*\n`;
  text += `${settings.address} | Telp: ${settings.phone}\n`;
  text += `========================================\n`;
  text += `No. Faktur  : *${trx.invoiceNo}*\n`;
  text += `Tanggal     : ${formatDateTime(trx.timestamp)}\n`;
  text += `Pelanggan   : *${trx.customerName || 'Pelanggan Umum'}*\n`;
  text += `Kasir       : ${trx.cashierName}\n`;
  text += `========================================\n\n`;
  text += `*RINCIAN BARANG:*\n`;

  trx.items.forEach((item, idx) => {
    text += `${idx + 1}. *${item.productName}*\n`;
    text += `   ${item.quantity} ${item.unitName} x ${formatRupiah(item.sellPrice)} = *${formatRupiah(item.subtotal)}*\n`;
  });

  text += `\n----------------------------------------\n`;
  text += `*Subtotal      :* ${formatRupiah(trx.subtotal)}\n`;
  if (trx.discount > 0) {
    text += `*Diskon        :* -${formatRupiah(trx.discount)}\n`;
  }
  text += `*TOTAL TAGIHAN :* *${formatRupiah(trx.total)}*\n`;
  text += `_Terbilang: ${angkaTerbilang(trx.total)}_\n`;
  text += `----------------------------------------\n`;

  text += `*Metode Bayar:* ${trx.paymentMethod.toUpperCase()}\n`;
  if (trx.isKasbon) {
    text += `*Status:* KASBON / TEMPO\n`;
    if (trx.kasbonDueDate) {
      text += `*Jatuh Tempo Panen:* ${formatDate(trx.kasbonDueDate)}\n`;
    }
  } else if (trx.paymentMethod === 'cash') {
    text += `Tunai: ${formatRupiah(trx.amountPaid)} | Kembali: ${formatRupiah(trx.changeAmount)}\n`;
  }

  text += `\n*Rekening Pembayaran Toko:*\n`;
  settings.bankAccounts.forEach(acc => {
    text += `• ${acc.bankName}: ${acc.accountNumber} a.n ${acc.holderName}\n`;
  });

  text += `\n_${settings.receiptFooter}_\n`;

  const encoded = encodeURIComponent(text);
  return formattedPhone ? `https://wa.me/${formattedPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

