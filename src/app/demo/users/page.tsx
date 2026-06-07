"use client";

import { useState } from "react";
import {
  Plus, Trash2, Shield, ShieldCheck, User as UserIcon, KeyRound,
} from "lucide-react";
import { useDemo } from "@/lib/demo-context";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function DemoUsersPage() {
  const { users: initialUsers } = useDemo();
  const [users, setUsers] = useState(initialUsers);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  const handleToggleActive = (user: any) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    );
    showToast(user.is_active ? `${user.name} dinonaktifkan` : `${user.name} diaktifkan`);
  };

  const roleLabels: Record<string, string> = { owner: "Owner", admin: "Admin", cashier: "Kasir" };
  const roleColors: Record<string, string> = {
    owner: "bg-[#DC2626]/10 text-[#DC2626] border-[#fecaca]",
    admin: "bg-[#FF5F03]/10 text-[#FF5F03] border-[#FF5F03]/30",
    cashier: "bg-[#072C2C]/10 text-[#072C2C] border-[#072C2C]/20",
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed z-[9999] top-4 right-4 px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium text-white ${
            toastType === "success" ? "bg-[#16A34A]" : "bg-[#DC2626]"
          }`}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#072C2C] font-[Oswald] uppercase tracking-wide">
            Manajemen Pengguna
          </h1>
          <p className="text-[10px] text-[#9CA3AF]">Kelola akun dan hak akses</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5F03] text-white font-bold text-sm rounded-xl opacity-50 cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-3.5 border-l-[3px] border-l-[#DC2626]">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#DC2626]" />
            <span className="text-xs font-bold text-[#072C2C]">Owner</span>
          </div>
          <p className="text-[10px] text-[#9CA3AF]">Akses penuh ke semua fitur</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-3.5 border-l-[3px] border-l-[#FF5F03]">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[#FF5F03]" />
            <span className="text-xs font-bold text-[#072C2C]">Admin</span>
          </div>
          <p className="text-[10px] text-[#9CA3AF]">Kelola produk, stok, supplier, pelanggan</p>
        </div>
        <div className="bg-white border border-[#D9D6C8] rounded-lg p-3.5 border-l-[3px] border-l-[#072C2C]">
          <div className="flex items-center gap-2 mb-1">
            <UserIcon className="w-4 h-4 text-[#072C2C]/50" />
            <span className="text-xs font-bold text-[#072C2C]">Kasir</span>
          </div>
          <p className="text-[10px] text-[#9CA3AF]">Akses kasir dan lihat produk (tanpa edit/hapus)</p>
        </div>
      </div>

      {/* Users table card */}
      <div className="bg-white border border-[#D9D6C8] rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D9D6C8]">
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">
                  Nama
                </th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">
                  Role
                </th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">
                  Terdaftar
                </th>
                <th className="text-left px-4 py-2.5 bg-[#EDEADE] text-[10px] font-semibold text-[#9CA3AF] uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#9CA3AF]">
                    Belum ada pengguna
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#D9D6C8] hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#072C2C] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {(u.name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#072C2C]">{u.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        roleColors[u.role] || roleColors.cashier
                      }`}
                    >
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className="cursor-pointer"
                    >
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded ${
                          u.is_active
                            ? "bg-[#16A34A]/10 text-[#16A34A]"
                            : "bg-[#9CA3AF]/10 text-[#9CA3AF]"
                        }`}
                      >
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                    {u.created_at ? formatDate(u.created_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => showToast("Demo mode: ubah password tidak tersedia")}
                        className="p-1.5 rounded-md hover:bg-[#FFFBEB] text-[#9CA3AF] hover:text-[#D97706] cursor-pointer"
                        title="Ubah Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {u.role !== "owner" && (
                        <button
                          onClick={() => showToast("Demo mode: hapus pengguna tidak tersedia")}
                          className="p-1.5 rounded-md hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden px-3 py-2 space-y-2">
          {users.length === 0 && (
            <div className="text-center py-6 text-[#9CA3AF] text-sm">Belum ada pengguna</div>
          )}
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-[#D9D6C8] rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-[#072C2C] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {(u.name || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#072C2C] text-sm">{u.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      roleColors[u.role] || roleColors.cashier
                    }`}
                  >
                    {roleLabels[u.role] || u.role}
                  </span>
                  <button onClick={() => handleToggleActive(u)} className="cursor-pointer">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        u.is_active
                          ? "bg-[#16A34A]/10 text-[#16A34A]"
                          : "bg-[#9CA3AF]/10 text-[#9CA3AF]"
                      }`}
                    >
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </button>
                  <button
                    onClick={() => showToast("Demo mode: ubah password tidak tersedia")}
                    className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#D97706] cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  {u.role !== "owner" && (
                    <button
                      onClick={() => showToast("Demo mode: hapus pengguna tidak tersedia")}
                      className="p-1.5 rounded-md text-[#9CA3AF] hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
