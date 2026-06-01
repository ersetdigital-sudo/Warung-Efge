export interface ReceiptData {
  storeName: string;
  cashier: string;
  trxId: string;
  date: string;
  items: { name: string; quantity: number; unit: string; price: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  total: number;
  method: string;
  paid: number;
  change: number;
}

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function generateReceiptPDF(data: ReceiptData, action: "download" | "open" = "download") {
  const items = data.items.map(item => `
    <div style="margin-bottom:6px">
      <div style="font-weight:bold;font-size:12px">${item.name}</div>
      <div style="display:flex;justify-content:space-between;font-size:11px">
        <span>${item.quantity} ${item.unit} x ${fmtRp(item.price)}</span>
        <span style="font-weight:bold">${fmtRp(item.subtotal)}</span>
      </div>
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Struk ${data.trxId}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Courier New', monospace; background:#f5f5f5; padding:20px; }
  .receipt { background:#fff; max-width:300px; margin:0 auto; padding:20px; border-radius:8px; box-shadow:0 2px 20px rgba(0,0,0,.1); }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  .divider { border:none; border-top:1px dashed #ccc; margin:10px 0; }
  .row { display:flex; justify-content:space-between; font-size:12px; margin:3px 0; }
  .row.total { font-size:15px; font-weight:bold; margin:8px 0; padding:6px 0; border-top:1px solid #333; border-bottom:1px solid #333; }
  .footer { text-align:center; font-size:10px; color:#888; margin-top:12px; }
  .actions { text-align:center; margin-top:20px; padding-top:16px; border-top:1px solid #eee; }
  .actions button { padding:10px 20px; margin:4px; border-radius:6px; border:none; font-size:13px; font-weight:bold; cursor:pointer; }
  .btn-print { background:#072C2C; color:#fff; }
  .btn-save { background:#FF5F03; color:#fff; }
  @media print {
    body { background:#fff; padding:0; }
    .receipt { box-shadow:none; border-radius:0; max-width:58mm; padding:2mm; }
    .actions { display:none; }
  }
</style>
</head>
<body>
<div class="receipt">
  <div class="center">
    <div style="font-size:16px;font-weight:bold">${data.storeName}</div>
    <div style="font-size:10px;color:#666">Sistem POS & Inventory</div>
    <div style="font-size:10px;color:#666">Kasir: ${data.cashier}</div>
  </div>
  <hr class="divider">
  <div class="row" style="font-size:10px;color:#666">
    <span>${data.trxId}</span>
    <span>${data.date}</span>
  </div>
  <hr class="divider">
  ${items}
  <hr class="divider">
  <div class="row"><span>Subtotal</span><span>${fmtRp(data.subtotal)}</span></div>
  ${data.discount > 0 ? `<div class="row"><span>Diskon</span><span style="color:#DC2626">-${fmtRp(data.discount)}</span></div>` : ""}
  <div class="row total"><span>TOTAL</span><span>${fmtRp(data.total)}</span></div>
  <div class="row"><span>Metode</span><span>${data.method}</span></div>
  <div class="row"><span>Bayar</span><span>${fmtRp(data.paid)}</span></div>
  ${data.change > 0 ? `<div class="row bold"><span>Kembalian</span><span style="color:#16A34A">${fmtRp(data.change)}</span></div>` : ""}
  <hr class="divider">
  <div class="footer">
    <p>Terima kasih atas kunjungan Anda!</p>
    <p>Barang yang dibeli tidak dapat dikembalikan</p>
  </div>
</div>
<div class="actions">
  <button class="btn-print" onclick="window.print()">🖨️ Cetak</button>
  <button class="btn-save" onclick="window.close()">✓ Selesai</button>
</div>
</body>
</html>`;

  // Open in new tab/window
  const newWindow = window.open("", "_blank");
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}
