import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lazy admin client - only created when needed
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env variable");
  return createClient(url, key);
}

// POST: Create new user (Auth + users table)
export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      name,
      email,
      role: role || "cashier",
      is_active: true,
    });

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Gagal menyimpan data user: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: { id: authData.user.id, name, email, role } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// DELETE: Remove user (Auth + users table)
export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    await supabaseAdmin.from("users").delete().eq("id", id);

    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch {
      // Ignore if auth user doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
