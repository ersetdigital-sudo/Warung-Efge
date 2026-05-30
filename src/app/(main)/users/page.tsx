"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { formatDate } from "@/lib/utils";
import { users } from "@/data/mock-data";
import { User } from "@/types";

export default function UsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);


  const roleLabels: Record<string, string> = { owner: "Owner", admin: "Admin", cashier: "Kasir" };
  const roleIcons: Record<string, typeof Shield> = { owner: ShieldCheck, admin: Shield, cashier: UserIcon };
  const roleColors: Record<string, "danger" | "info" | "default"> = { owner: "danger", admin: "info", cashier: "default" };

  const columns = [
    { key: "name", label: "Nama", sortable: true, render: (item: User) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"><span className="text-white text-sm font-medium">{item.name.charAt(0)}</span></div>
        <div><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-500">{item.email}</p></div>
      </div>
    )},
    { key: "role", label: "Role", render: (item: User) => { const Icon = roleIcons[item.role]; return <Badge variant={roleColors[item.role]}><Icon className="w-3 h-3 mr-1" />{roleLabels[item.role]}</Badge>; } },
    { key: "isActive", label: "Status", render: (item: User) => <Badge variant={item.isActive ? "success" : "default"}>{item.isActive ? "Aktif" : "Nonaktif"}</Badge> },
    { key: "createdAt", label: "Terdaftar", render: (item: User) => <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span> },
    { key: "actions", label: "Aksi", render: (item: User) => (
      <div className="flex items-center gap-1">
        <button onClick={() => setEditingUser(item)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 cursor-pointer"><Edit className="w-4 h-4" /></button>
        {item.role !== "owner" && <button className="p-1.5 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1><p className="text-sm text-gray-500 mt-1">Kelola akun dan hak akses</p></div>
        <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" />Tambah Pengguna</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-5 h-5 text-red-500" /><span className="text-sm font-medium">Owner</span></div><p className="text-xs text-gray-500">Akses penuh ke semua fitur</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-blue-500" /><span className="text-sm font-medium">Admin</span></div><p className="text-xs text-gray-500">Kelola produk, stok, supplier, pelanggan</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center gap-2 mb-2"><UserIcon className="w-5 h-5 text-gray-500" /><span className="text-sm font-medium">Kasir</span></div><p className="text-xs text-gray-500">Akses kasir dan catat transaksi</p></div>
      </div>
      <Card><CardContent><DataTable columns={columns} data={users} searchPlaceholder="Cari pengguna..." searchKeys={["name", "email", "role"]} /></CardContent></Card>

      <Modal isOpen={showAddModal || !!editingUser} onClose={() => { setShowAddModal(false); setEditingUser(null); }} title={editingUser ? "Edit Pengguna" : "Tambah Pengguna"} size="md">
        <form className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input type="text" defaultValue={editingUser?.name} placeholder="Nama lengkap" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" defaultValue={editingUser?.email} placeholder="email@contoh.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          {!editingUser && <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" placeholder="Min 8 karakter" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select defaultValue={editingUser?.role} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Pilih Role</option><option value="admin">Admin</option><option value="cashier">Kasir</option></select></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setEditingUser(null); }} type="button">Batal</Button>
            <Button type="button" onClick={() => { setShowAddModal(false); setEditingUser(null); }}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
