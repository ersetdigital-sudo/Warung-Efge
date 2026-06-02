"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Shield, ShieldCheck, User as UserIcon, KeyRound, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { getUsers } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function UsersPage() {
  const { role } = useAuth();
  const isOwner = role === "owner";
  const [users, setUsers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("cashier");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => { loadUsers(); }, []);
  const loadUsers = async () => { const data = await getUsers(); setUsers(data); };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg); setToastType(type); setTimeout(() => setToast(""), 3000);
  };

  const handleAddUser = async () => {
    if (!formName || !formEmail || !formPassword) { setFormError("Semua field wajib diisi"); return; }
    if (formPassword.length < 6) { setFormError("Password minimal 6 karakter"); return; }
    setFormError(""); setFormLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, email: formEmail, password: formPassword, role: formRole }),
    });
    const data = await res.json();
    setFormLoading(false);

    if (!res.ok) { setFormError(data.error || "Gagal menambah pengguna"); return; }

    setShowAddModal(false);
    setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("cashier");
    showToast("Pengguna berhasil ditambahkan!");
    await loadUsers();
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Hapus ${user.name}? Akun login-nya juga akan dihapus.`)) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });
    if (res.ok) { showToast("Pengguna dihapus"); await loadUsers(); }
    else { showToast("Gagal menghapus", "error"); }
  };

  const handleChangePassword = async () => {
    if (!showChangePassword || !newPassword) return;
    if (newPassword.length < 6) { setPwdError("Password minimal 6 karakter"); return; }
    setPwdError(""); setPwdLoading(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: showChangePassword.id, password: newPassword }),
    });
    const data = await res.json();
    setPwdLoading(false);
    if (!res.ok) { setPwdError(data.error || "Gagal mengubah password"); return; }
    setShowChangePassword(null); setNewPassword(""); setShowPwd(false);
    showToast(`Password ${showChangePassword.name} berhasil diubah`);
  };

  const handleToggleActive = async (user: any) => {
    await supabase.from("users").update({ is_active: !user.is_active }).eq("id", user.id);
    await loadUsers();
    showToast(user.is_active ? `${user.name} dinonaktifkan` : `${user.name} diaktifkan`);
  };

  const handleChangePassword = async () => {
    if (!showChangePassword || !newPassword) return;
    if (newPassword.length < 6) { setPwdError("Password minimal 6 karakter"); return; }
    setPwdLoading(true); setPwdError("");
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: showChangePassword.id, password: newPassword }),
    });
    const data = await res.json();
    setPwdLoading(false);
    if (!res.ok) { setPwdError(data.error || "Gagal mengubah password"); return; }
    setShowChangePassword(null); setNewPassword(""); setShowPwd(false);
    showToast(`Password ${showChangePassword.name} berhasil diubah`);
  };

  const roleLabels: Record<string, string> = { owner: "Owner", admin: "Admin", cashier: "Kasir" };
  const roleColors: Record<string, string> = { owner: "bg-[#DC2626]/10 text-[#DC2626] border-[#fecaca]", admin: "bg-[#FF5F03]/10 text-[#FF5F03] border-[#FF5F03]/30", cashier: "bg-[#072C2C]/10 text-[#072C2C] border-[#072C2C]/20" };

  return (
    <div className="space-y-5">
      {toast && <div className={`fixed z-[9999] top-4 right-4 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white ${toastType === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"}`}>{toast}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">Manajemen Pengguna</h1><p className="text-[10px] text-[#9CA3AF]">Kelola akun dan hak akses</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Tambah Pengguna</Button>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-3.5 border-l-[3px] border-l-[#DC2626]"><div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-[#DC2626]" /><span className="text-xs font-bold text-[#072C2C]">Owner</span></div><p className="text-[10px] text-[#9CA3AF]">Akses penuh ke semua fitur</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-3.5 border-l-[3px] border-l-[#FF5F03]"><div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-[#FF5F03]" /><span className="text-xs font-bold text-[#072C2C]">Admin</span></div><p className="text-[10px] text-[#9CA3AF]">Kelola produk, stok, supplier, pelanggan</p></div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-3.5 border-l-[3px] border-l-[#072C2C]"><div className="flex items-center gap-2 mb-1"><UserIcon className="w-4 h-4 text-[#072C2C]/50" /><span className="text-xs font-bold text-[#072C2C]">Kasir</span></div><p className="text-[10px] text-[#9CA3AF]">Akses kasir dan lihat produk (tanpa edit/hapus)</p></div>
      </div>

      {/* Users table */}
      <Card>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D9D6C8]">
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Nama</th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Role</th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Status</th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Terdaftar</th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-[#9CA3AF]">Belum ada pengguna</td></tr>}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#072C2C] rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">{(u.name || "?")[0].toUpperCase()}</span></div>
                      <div><p className="font-medium text-[#072C2C]">{u.name}</p><p className="text-[10px] text-[#9CA3AF]">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded border ${roleColors[u.role] || roleColors.cashier}`}>{roleLabels[u.role] || u.role}</span></td>
                  <td className="px-4 py-3"><button onClick={() => handleToggleActive(u)} className="cursor-pointer"><Badge variant={u.is_active ? "success" : "default"}>{u.is_active ? "Aktif" : "Nonaktif"}</Badge></button></td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">{u.created_at ? formatDate(u.created_at) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {isOwner && <button onClick={() => { setShowChangePassword(u); setNewPassword(""); setPwdError(""); }} className="p-1.5 rounded-md hover:bg-[#FFFBEB] text-[#9CA3AF] hover:text-[#D97706] cursor-pointer" title="Ubah Password"><KeyRound className="w-4 h-4" /></button>}
                      {u.role !== "owner" && <button onClick={() => handleDelete(u)} className="p-1.5 rounded-md hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden px-3 py-2 space-y-2">
          {users.length === 0 && <div className="text-center py-6 text-[#9CA3AF] text-sm">Belum ada pengguna</div>}
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-[#D9D6C8] rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-[#072C2C] rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-sm font-bold">{(u.name || "?")[0].toUpperCase()}</span></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#072C2C] text-sm">{u.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${roleColors[u.role] || roleColors.cashier}`}>{roleLabels[u.role] || u.role}</span>
                  <button onClick={() => handleToggleActive(u)} className="cursor-pointer"><Badge variant={u.is_active ? "success" : "default"}>{u.is_active ? "Aktif" : "Nonaktif"}</Badge></button>
                  {isOwner && <button onClick={() => { setShowChangePassword(u); setNewPassword(""); setPwdError(""); }} className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#D97706] cursor-pointer"><KeyRound className="w-4 h-4" /></button>}
                  {u.role !== "owner" && <button onClick={() => handleDelete(u)} className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowChangePassword(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D97706]/10 rounded-full flex items-center justify-center"><KeyRound className="w-5 h-5 text-[#D97706]" /></div>
              <div>
                <h3 className="text-base font-bold text-[#072C2C]">Ubah Password</h3>
                <p className="text-xs text-[#072C2C]/50">{showChangePassword.name} · {showChangePassword.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1.5">Password Baru</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  placeholder="Min 6 karakter"
                  className="w-full px-4 py-3 pr-11 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 focus:border-[#FF5F03]"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#072C2C]/30 hover:text-[#072C2C]/60 cursor-pointer">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwdError && <p className="text-xs text-[#DC2626] mt-1.5 bg-[#FEF2F2] px-3 py-2 rounded-lg">{pwdError}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowChangePassword(null); setNewPassword(""); setPwdError(""); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-[#072C2C]/60 hover:text-[#072C2C] cursor-pointer">Batal</button>
              <button onClick={handleChangePassword} disabled={pwdLoading || !newPassword} className="flex-1 px-4 py-2.5 bg-[#D97706] text-white font-bold text-sm rounded-xl disabled:opacity-50 cursor-pointer hover:bg-[#b45309]">
                {pwdLoading ? "Menyimpan..." : "Ubah Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#072C2C]">Tambah Pengguna</h3>
            <p className="text-xs text-[#072C2C]/50">Akun login akan otomatis dibuat dengan email & password di bawah.</p>

            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Nama Lengkap</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="cth: Ahmad Fauzi" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Email</label>
              <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} type="email" placeholder="email@contoh.com" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Password</label>
              <input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" placeholder="Min 6 karakter" className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#072C2C]/70 mb-1">Role</label>
              <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full px-4 py-3 border border-[#072C2C]/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5F03]/20 cursor-pointer">
                <option value="cashier">Kasir</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {formError && <p className="text-xs text-[#DC2626] bg-[#FEF2F2] px-3 py-2 rounded-lg">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 text-sm font-medium text-[#072C2C]/60 hover:text-[#072C2C] cursor-pointer">Batal</button>
              <button onClick={handleAddUser} disabled={formLoading} className="flex-1 px-4 py-3 bg-[#FF5F03] text-white font-bold text-sm rounded-xl disabled:opacity-50 cursor-pointer hover:bg-[#e55503]">
                {formLoading ? "Menyimpan..." : "Tambah Pengguna"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
