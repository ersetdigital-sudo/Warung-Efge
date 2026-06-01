import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Admin client with service_role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Create new user (Auth + users table)
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert into users table
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id, // link to auth user
      name,
      email,
      role: role || "cashier",
      is_active: true,
    });

    if (dbError) {
      // Rollback: delete auth user if db insert fails
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
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    // Delete from users table
    await supabaseAdmin.from("users").delete().eq("id", id);

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
