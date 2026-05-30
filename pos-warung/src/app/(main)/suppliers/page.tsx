'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { suppliers, purchases } from '@/data/mock-data';
import { Supplier } from '@/types';

export default function SuppliersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const columns = [
    {
      key: 'name',
      label: 'Nama Supplier',
      sortable: true,
      render: (item: Supplier) => (
        <div>
          <button
            onClick={() => setViewingSupplier(item)}
            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
          >
            {item.name}
          </button>
          {item.email && <p className="text-xs text-gray-500">{item.email}</p>}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Telepon',
      render: (item: Supplier) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Phone className="w-3.5 h-3.5" />
          {item.phone}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (item: Supplier) => (
        <div className="flex items-start gap-1.5 text-sm text-gray-600 max-w-xs">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="truncate">{item.address}</span>
        </div>
      ),
    },
    {
      key: 'debt',
      label: 'Hutang',
      sortable: true,
      render: (item: Supplier) => (
        <span className={`font-medium ${item.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {item.debt > 0 ? formatCurrency(item.debt) : 'Lunas'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Terdaftar',
      render: (item: Supplier) => (
        <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (item: Supplier) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingSupplier(item)}
            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data supplier dan riwayat pembelian</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Tambah Supplier
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Supplier</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Hutang</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatCurrency(suppliers.reduce((sum, s) => sum + s.debt, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Supplier Lunas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {suppliers.filter((s) => s.debt === 0).length}
          </p>
        </div>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={suppliers}
            searchPlaceholder="Cari supplier..."
            searchKeys={['name', 'phone', 'address']}
          />
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Supplier" size="lg">
        <SupplierForm onClose={() => setShowAddModal(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingSupplier} onClose={() => setEditingSupplier(null)} title="Edit Supplier" size="lg">
        {editingSupplier && <SupplierForm supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!viewingSupplier} onClose={() => setViewingSupplier(null)} title="Detail Supplier" size="lg">
        {viewingSupplier && <SupplierDetail supplier={viewingSupplier} />}
      </Modal>
    </div>
  );
}

function SupplierForm({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier</label>
        <input
          type="text"
          defaultValue={supplier?.name}
          placeholder="Nama perusahaan/toko"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
          <input
            type="text"
            defaultValue={supplier?.phone}
            placeholder="021-xxxxxxx"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            defaultValue={supplier?.email}
            placeholder="email@supplier.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
        <textarea
          defaultValue={supplier?.address}
          placeholder="Alamat lengkap"
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
        <Button type="button" onClick={onClose}>{supplier ? 'Simpan' : 'Tambah'}</Button>
      </div>
    </form>
  );
}

function SupplierDetail({ supplier }: { supplier: Supplier }) {
  const supplierPurchases = purchases.filter((p) => p.supplierId === supplier.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Telepon</p>
          <p className="text-sm font-medium">{supplier.phone}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm font-medium">{supplier.email || '-'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-gray-500">Alamat</p>
          <p className="text-sm font-medium">{supplier.address}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Hutang</p>
          <p className={`text-sm font-bold ${supplier.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {supplier.debt > 0 ? formatCurrency(supplier.debt) : 'Lunas'}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Riwayat Pembelian</h4>
        {supplierPurchases.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada riwayat pembelian</p>
        ) : (
          <div className="space-y-2">
            {supplierPurchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.id}</p>
                  <p className="text-xs text-gray-500">{formatDate(p.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(p.totalAmount)}</p>
                  <Badge variant={p.status === 'paid' ? 'success' : p.status === 'partial' ? 'warning' : 'danger'}>
                    {p.status === 'paid' ? 'Lunas' : p.status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
