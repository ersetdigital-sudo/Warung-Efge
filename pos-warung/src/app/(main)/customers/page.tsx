'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, MapPin, Receipt, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { customers, transactions } from '@/data/mock-data';
import { Customer } from '@/types';

export default function CustomersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [showPayDebtModal, setShowPayDebtModal] = useState<Customer | null>(null);

  const totalDebt = customers.reduce((sum, c) => sum + c.debt, 0);
  const customersWithDebt = customers.filter((c) => c.debt > 0);

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      render: (item: Customer) => (
        <button
          onClick={() => setViewingCustomer(item)}
          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {item.name}
        </button>
      ),
    },
    {
      key: 'phone',
      label: 'Telepon',
      render: (item: Customer) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Phone className="w-3.5 h-3.5" />
          {item.phone}
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Alamat',
      render: (item: Customer) => (
        <div className="flex items-start gap-1.5 text-sm text-gray-600 max-w-xs">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="truncate">{item.address || '-'}</span>
        </div>
      ),
    },
    {
      key: 'debt',
      label: 'Hutang',
      sortable: true,
      render: (item: Customer) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${item.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {item.debt > 0 ? formatCurrency(item.debt) : 'Lunas'}
          </span>
          {item.debt > 0 && (
            <button
              onClick={() => setShowPayDebtModal(item)}
              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 font-medium"
            >
              Bayar
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Terdaftar',
      render: (item: Customer) => (
        <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (item: Customer) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingCustomer(item)}
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
          <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data pelanggan dan hutang</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Pelanggan</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Punya Hutang</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{customersWithDebt.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Hutang</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalDebt)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pelanggan Lunas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{customers.length - customersWithDebt.length}</p>
        </div>
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={customers}
            searchPlaceholder="Cari pelanggan..."
            searchKeys={['name', 'phone', 'address']}
          />
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Pelanggan" size="md">
        <CustomerForm onClose={() => setShowAddModal(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Edit Pelanggan" size="md">
        {editingCustomer && <CustomerForm customer={editingCustomer} onClose={() => setEditingCustomer(null)} />}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title="Detail Pelanggan" size="lg">
        {viewingCustomer && <CustomerDetail customer={viewingCustomer} />}
      </Modal>

      {/* Pay Debt Modal */}
      <Modal isOpen={!!showPayDebtModal} onClose={() => setShowPayDebtModal(null)} title="Bayar Hutang" size="sm">
        {showPayDebtModal && <PayDebtForm customer={showPayDebtModal} onClose={() => setShowPayDebtModal(null)} />}
      </Modal>
    </div>
  );
}

function CustomerForm({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
        <input
          type="text"
          defaultValue={customer?.name}
          placeholder="Nama lengkap"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
        <input
          type="text"
          defaultValue={customer?.phone}
          placeholder="08xx-xxxx-xxxx"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
        <textarea
          defaultValue={customer?.address}
          placeholder="Alamat lengkap"
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
        <Button type="button" onClick={onClose}>{customer ? 'Simpan' : 'Tambah'}</Button>
      </div>
    </form>
  );
}

function CustomerDetail({ customer }: { customer: Customer }) {
  const customerTransactions = transactions.filter((t) => t.customerId === customer.id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Telepon</p>
          <p className="text-sm font-medium">{customer.phone}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Alamat</p>
          <p className="text-sm font-medium">{customer.address || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Hutang</p>
          <p className={`text-sm font-bold ${customer.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {customer.debt > 0 ? formatCurrency(customer.debt) : 'Lunas'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Terdaftar</p>
          <p className="text-sm font-medium">{formatDate(customer.createdAt)}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Riwayat Transaksi
        </h4>
        {customerTransactions.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada riwayat transaksi</p>
        ) : (
          <div className="space-y-2">
            {customerTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.id}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(t.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(t.total)}</p>
                  {t.isDebt && <Badge variant="warning">Bon</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PayDebtForm({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="bg-red-50 rounded-lg p-4 text-center">
        <p className="text-sm text-red-600">Sisa Hutang</p>
        <p className="text-2xl font-bold text-red-700">{formatCurrency(customer.debt)}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar</label>
        <input
          type="number"
          placeholder="0"
          max={customer.debt}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
        <input
          type="text"
          placeholder="Catatan pembayaran (opsional)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
        <Button type="button" onClick={onClose}>
          <DollarSign className="w-4 h-4" />
          Bayar
        </Button>
      </div>
    </form>
  );
}
