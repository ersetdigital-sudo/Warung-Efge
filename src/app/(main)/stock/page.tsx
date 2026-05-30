'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Settings2, ClipboardCheck, History } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { formatDate, formatNumber, getStockStatus } from '@/lib/utils';
import { products, stockMovements } from '@/data/mock-data';
import { StockMovement } from '@/types';

type TabType = 'overview' | 'movements' | 'opname';

export default function StockPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInModal, setShowInModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const tabs = [
    { id: 'overview' as TabType, label: 'Ringkasan Stok', icon: ClipboardCheck },
    { id: 'movements' as TabType, label: 'Riwayat Pergerakan', icon: History },
    { id: 'opname' as TabType, label: 'Stock Opname', icon: Settings2 },
  ];

  const lowStock = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau dan kelola stok barang</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowInModal(true)}>
            <ArrowDownToLine className="w-4 h-4" />
            Barang Masuk
          </Button>
          <Button variant="outline" onClick={() => setShowOutModal(true)}>
            <ArrowUpFromLine className="w-4 h-4" />
            Barang Keluar
          </Button>
          <Button onClick={() => setShowAdjustModal(true)}>
            <Settings2 className="w-4 h-4" />
            Penyesuaian
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Produk</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Stok Aman</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{products.length - lowStock.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Stok Menipis</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{lowStock.filter(p => p.stock > 0).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Stok Habis</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lowStock.filter(p => p.stock <= 0).length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <StockOverview />}
      {activeTab === 'movements' && <StockMovements />}
      {activeTab === 'opname' && <StockOpname />}

      {/* Stock In Modal */}
      <Modal isOpen={showInModal} onClose={() => setShowInModal(false)} title="Barang Masuk" size="md">
        <StockForm type="in" onClose={() => setShowInModal(false)} />
      </Modal>

      {/* Stock Out Modal */}
      <Modal isOpen={showOutModal} onClose={() => setShowOutModal(false)} title="Barang Keluar" size="md">
        <StockForm type="out" onClose={() => setShowOutModal(false)} />
      </Modal>

      {/* Adjustment Modal */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title="Penyesuaian Stok" size="md">
        <StockForm type="adjustment" onClose={() => setShowAdjustModal(false)} />
      </Modal>
    </div>
  );
}

function StockOverview() {
  const stockColumns = [
    {
      key: 'name',
      label: 'Produk',
      sortable: true,
      render: (item: Record<string, unknown>) => (
        <div>
          <p className="font-medium text-gray-900">{item.name as string}</p>
          <p className="text-xs text-gray-500">SKU: {item.sku as string}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      sortable: true,
    },
    {
      key: 'stock',
      label: 'Stok',
      sortable: true,
      render: (item: Record<string, unknown>) => {
        const status = getStockStatus(item.stock as number, item.minStock as number);
        return (
          <Badge variant={status === 'safe' ? 'success' : status === 'warning' ? 'warning' : 'danger'}>
            {formatNumber(item.stock as number)} {item.unit as string}
          </Badge>
        );
      },
    },
    {
      key: 'minStock',
      label: 'Min. Stok',
      render: (item: Record<string, unknown>) => (
        <span className="text-sm text-gray-500">{item.minStock as number} {item.unit as string}</span>
      ),
    },
    {
      key: 'unit',
      label: 'Satuan',
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: Record<string, unknown>) => {
        const status = getStockStatus(item.stock as number, item.minStock as number);
        const labels = { safe: 'Aman', warning: 'Menipis', danger: 'Habis' };
        return (
          <Badge variant={status === 'safe' ? 'success' : status === 'warning' ? 'warning' : 'danger'}>
            {labels[status]}
          </Badge>
        );
      },
    },
  ];

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={stockColumns}
          data={products}
          searchPlaceholder="Cari produk..."
          searchKeys={['name', 'sku', 'category']}
        />
      </CardContent>
    </Card>
  );
}

function StockMovements() {
  const movementColumns = [
    {
      key: 'date',
      label: 'Tanggal',
      sortable: true,
      render: (item: Record<string, unknown>) => (
        <span className="text-sm text-gray-600">{formatDate(item.date as string)}</span>
      ),
    },
    {
      key: 'productName',
      label: 'Produk',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Tipe',
      render: (item: Record<string, unknown>) => {
        const typeLabels: Record<string, string> = { in: 'Masuk', out: 'Keluar', adjustment: 'Penyesuaian', opname: 'Opname' };
        const typeVariants: Record<string, 'success' | 'danger' | 'warning' | 'info'> = { in: 'success', out: 'danger', adjustment: 'warning', opname: 'info' };
        const type = item.type as string;
        return <Badge variant={typeVariants[type]}>{typeLabels[type]}</Badge>;
      },
    },
    {
      key: 'quantity',
      label: 'Jumlah',
      render: (item: Record<string, unknown>) => {
        const qty = item.quantity as number;
        const type = item.type as string;
        return (
          <span className={`font-medium ${type === 'in' ? 'text-green-600' : type === 'out' ? 'text-red-600' : 'text-gray-700'}`}>
            {type === 'in' ? '+' : type === 'out' ? '-' : ''}{qty} {item.unit as string}
          </span>
        );
      },
    },
    {
      key: 'notes',
      label: 'Catatan',
      render: (item: Record<string, unknown>) => (
        <span className="text-sm text-gray-500">{item.notes as string}</span>
      ),
    },
    {
      key: 'user',
      label: 'User',
    },
  ];

  return (
    <Card>
      <CardContent>
        <DataTable
          columns={movementColumns}
          data={stockMovements}
          searchPlaceholder="Cari pergerakan stok..."
          searchKeys={['productName', 'notes', 'user']}
        />
      </CardContent>
    </Card>
  );
}

function StockOpname() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Stock Opname</h3>
          <Button size="sm">
            <ClipboardCheck className="w-4 h-4" />
            Mulai Opname
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Stock Opname</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Lakukan pengecekan stok fisik dan bandingkan dengan data di sistem. Klik &quot;Mulai Opname&quot; untuk memulai.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StockForm({ type, onClose }: { type: 'in' | 'out' | 'adjustment'; onClose: () => void }) {
  const titles = { in: 'Barang Masuk', out: 'Barang Keluar', adjustment: 'Penyesuaian Stok' };

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Pilih Produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock} {p.unit})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Pcs</option>
            <option>Dus</option>
            <option>Pak</option>
            <option>Kg</option>
            <option>Karung</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
        <textarea
          placeholder={`Alasan ${titles[type].toLowerCase()}...`}
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">Batal</Button>
        <Button type="button" onClick={onClose}>Simpan</Button>
      </div>
    </form>
  );
}
