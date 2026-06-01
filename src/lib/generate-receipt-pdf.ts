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

const fmtRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export function generateReceiptPDF(data: ReceiptData, action: "download" | "open" = "download") {
  const W = 58; // page width mm
  const M = 3; // margin
  const doc = new jsPDF({ unit: "mm", format: [W, 200], orientation: "portrait" });

  let y = 6;

  const setFont = (bold = false, size = 8) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
  };

  const textCenter = (text: string, size = 8, bold = false) => {
    setFont(bold, size);
    doc.text(text, W / 2, y, { align: "center" });
    y += size * 0.45;
  };

  const textLeft = (text: string, size = 8, bold = false) => {
    setFont(bold, size);
    doc.text(text, M, y);
    y += size * 0.45;
  };

  const textLeftRight = (left: string, right: string, size = 8, bold = false) => {
    setFont(bold, size);
    doc.text(left, M, y);
    doc.text(right, W - M, y, { align: "right" });
    y += size * 0.45;
  };

  const drawLine = (double = false) => {
    setFont(false, 7);
    const ch = double ? "=" : "-";
    doc.text(ch.repeat(38), M, y);
    y += 3;
  };

  // === HEADER ===
  textCenter(data.storeName, 11, true);
  y += 0.5;
  textCenter("Sistem POS & Inventory", 7);
  textCenter(`Kasir: ${data.cashier}`, 7);
  y += 1;
  drawLine(true);

  // === INFO TRANSAKSI ===
  textLeft(`No: ${data.trxId}`, 7);
  textLeft(data.date, 7);
  drawLine();

  // === ITEMS ===
  for (const item of data.items) {
    setFont(false, 8);
    const lines = doc.splitTextToSize(item.name, W - M * 2);
    for (const l of lines) {
      doc.text(l, M, y);
      y += 3.2;
    }
    textLeftRight(
      `${item.quantity} ${item.unit} x ${fmtRp(item.price)}`,
      fmtRp(item.subtotal),
      7
    );
    y += 1;
  }
  drawLine();

  // === RINGKASAN ===
  textLeftRight("Subtotal", fmtRp(data.subtotal), 8);
  if (data.discount > 0) {
    textLeftRight("Diskon", `-${fmtRp(data.discount)}`, 8);
  }
  drawLine(true);
  textLeftRight("TOTAL", fmtRp(data.total), 10, true);
  drawLine(true);

  // === PEMBAYARAN ===
  textLeft(`Metode: ${data.method}`, 7);
  y += 0.5;
  textLeftRight("Bayar", fmtRp(data.paid), 8);
  textLeftRight("Kembali", fmtRp(data.change), 8);
  drawLine(true);

  // === FOOTER ===
  y += 1;
  textCenter("Terima kasih atas kunjungan Anda!", 7);
  textCenter("Barang yang dibeli tidak dapat", 7);
  textCenter("dikembalikan", 7);
  y += 10;

  // Trim page height to content
  const finalHeight = Math.max(y + 5, 50);
  (doc.internal.pageSize as any).height = finalHeight;

  // Output
  const dateClean = data.date.replace(/[\s\/,:]/g, "-");
  const filename = `Struk-${data.trxId}-${dateClean}.pdf`;

  if (action === "download") {
    doc.save(filename);
  } else {
    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
  }
}
