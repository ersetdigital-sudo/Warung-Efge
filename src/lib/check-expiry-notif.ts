import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServerSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function checkAndSendExpiryNotif(isTest = false): Promise<{ notified: number; error?: string }> {
  const supabase = getServerSupabase();

  // Calculate H+7 date
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + 7);
  const targetDateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // Query products expiring on H+7 (or less for test)
  let query = supabase
    .from("products")
    .select("id, name, stock, unit, expiry_date, cost_price")
    .lte("expiry_date", targetDateStr)
    .gt("stock", 0);

  if (!isTest) {
    query = query.is("notif_sent_at", null);
  }

  const { data: products, error: prodError } = await query.order("expiry_date", { ascending: true });

  if (prodError) {
    console.error("checkExpiry query error:", prodError);
    return { notified: 0, error: prodError.message };
  }

  if (!products || products.length === 0) {
    return { notified: 0 };
  }

  // Get WA numbers from store_settings
  const { data: settingsData } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", "wa_numbers")
    .single();

  const waNumbers = (settingsData?.value || "")
    .split(",")
    .map((n: string) => n.trim())
    .filter((n: string) => n.length > 0);

  if (waNumbers.length === 0) {
    return { notified: 0, error: "Nomor WhatsApp belum diatur" };
  }

  // Format message
  let message = `🔔 *PERINGATAN KADALUARSA*\nWarung Efge - ${getTodayFormatted()}\n\n`;
  message += `Produk berikut akan kadaluarsa dalam 7 hari:\n\n`;

  for (const p of products) {
    const daysLeft = Math.ceil((new Date(p.expiry_date).getTime() - today.getTime()) / 86400000);
    message += `📦 *${p.name}*\n`;
    message += `   Stok: ${p.stock} ${p.unit || "pcs"}\n`;
    message += `   Exp: ${formatDate(p.expiry_date)}`;
    if (daysLeft <= 0) {
      message += ` ❌ SUDAH EXPIRED\n`;
    } else {
      message += ` (${daysLeft} hari lagi)\n`;
    }
    message += `\n`;
  }

  message += `⚠️ Segera jual atau tarik dari rak!\n\n`;
  message += `—\n_Pesan otomatis dari Sistem POS Warung Efge_`;

  // Send to each number
  const apiKey = process.env.FONNTE_API_KEY;
  if (!apiKey) {
    return { notified: 0, error: "FONNTE_API_KEY not configured" };
  }

  for (const phone of waNumbers) {
    try {
      await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: phone,
          message,
          countryCode: "62",
        }),
      });
    } catch (err) {
      console.error(`Failed to send WA to ${phone}:`, err);
    }
  }

  // Mark products as notified (only if not test)
  if (!isTest) {
    const ids = products.map((p) => p.id);
    await supabase
      .from("products")
      .update({ notif_sent_at: new Date().toISOString() })
      .in("id", ids);
  }

  return { notified: products.length };
}
