import { NextResponse } from "next/server";
import { checkAndSendExpiryNotif } from "@/lib/check-expiry-notif";

export async function POST() {
  try {
    const result = await checkAndSendExpiryNotif(true); // isTest = true, skip notif_sent_at filter
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("test-wa-notif error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
