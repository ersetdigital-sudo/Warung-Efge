import { NextRequest, NextResponse } from "next/server";
import { checkAndSendExpiryNotif } from "@/lib/check-expiry-notif";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await checkAndSendExpiryNotif(false);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Cron check-expiry error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
