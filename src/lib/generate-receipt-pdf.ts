import { jsPDF } from "jspdf";

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

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function generateReceiptPDF(data: ReceiptData, action: "download" | "open" = "download") {
  const pageWidth = 58;
  const margin = 3;
  const contentWidth = pageWidth - margin * 2;
  const doc = new jsPDF({ unit: "mm", format: [pageWidth, 200] });

  let y = 5;
  const lineGap = 3.5;
  const smallGap = 2.8;

  const center = (text: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("Courier", bold ? "bold" : "normal");
    const w = doc.getTextWidth(text);
    doc.text(text, (pageWidth - w) / 2, y);
    y += size * 0.4;
  };

  const leftRight = (left: string, right: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("Courier", bold ? "bold" : "normal");
    doc.text(left, margin, y);
    const rw = doc.getTextWidth(right);
    doc.text(right, pageWidth - margin - rw, y);
    y += size * 0.4;
  };

  const line = (char = "-") => {
    doc.setFontSize(7);
    doc.setFont("Courier", "normal");
    const sep = char === "=" ? "================================" : "--------------------------------";
    doc.text(sep.substring(0, Math.floor(contentWidth / 1.5)), margin, y);
    y += 2.5;
  };

  // 1. Header
  center(data.storeName, 10, true);
  y += 1;
  center("Sistem POS & Inventory", 7);
  center(`Kasir: ${data.cashier}`, 7);
  y += 1;
  line("=");

  // 2. Info transaksi
  doc.setFontSize(7);
  doc.setFont("Courier", "normal");
  doc.text(`No: ${data.trxId}`, margin, y);
  y += smallGap;
  doc.text(data.date, margin, y);
  y += smallGap;
  line();

  // 3. Items
  for (const item of data.items) {
    doc.setFontSize(8);
    doc.setFont("Courier", "normal");
    // Nama produk (mungkin perlu wrap)
    const nameLines = doc.splitTextToSize(item.name, contentWidth);
    for (const nl of nameLines) {
      doc.text(nl, margin, y);
      y += smallGap;
    }
    // Qty x harga + total
    doc.setFontSize(7);
    const qtyText = `${item.quantity} ${item.unit} x ${formatRp(item.price)}`;
    const totalText = formatRp(item.subtotal);
    doc.text(qtyText, margin, y);
    const tw = doc.getTextWidth(totalText);
    doc.text(totalText, pageWidth - margin - tw, y);
    y += lineGap;
  }
  line();

  // 4. Ringkasan
  leftRight("Subtotal", formatRp(data.subtotal), 7);
  y += 0.5;
  if (data.discount > 0) {
    leftRight("Diskon", `-${formatRp(data.discount)}`, 7);
    y += 0.5;
  }
  line("=");
  leftRight("TOTAL", formatRp(data.total), 9, true);
  y += 0.5;
  line("=");

  // 5. Pembayaran
  leftRight(`Metode: ${data.method}`, "", 7);
  y += 0.5;
  leftRight("Bayar", formatRp(data.paid), 7);
  y += 0.5;
  leftRight("Kembali", formatRp(data.change), 7);
  y += 0.5;
  line("=");

  // 6. Footer
  y += 1;
  center("Terima kasih atas kunjungan Anda!", 7);
  center("Barang yang dibeli tidak dapat", 7);
  center("dikembalikan", 7);
  y += 10;

  // Resize page to actual content height
  const pageHeight = y + 5;
  (doc as any).internal.pageSize.height = pageHeight;

  // Generate filename
  const dateStr = data.date.replace(/[\/\s:]/g, "").replace(/,/g, "");
  const filename = `Struk-${data.trxId}-${dateStr}.pdf`;

  if (action === "download") {
    doc.save(filename);
  } else {
    // Open in new tab
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }
}
