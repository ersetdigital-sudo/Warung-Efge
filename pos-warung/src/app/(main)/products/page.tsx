'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, getStockStatus } from '@/lib/utils';
import { products, categories } from '@/data/mock-data';
import { Product } from '@/types';

export default function ProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const columns = [
    {
      key: 'name',
      label: 'Produk',
      sortable: true,
      render: (item: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      sortable: true,
      render: (item: Product) => (
        <Badge variant="info">{item.category}</Badge>
      ),
    },
    {
      key: 'costPrice',
      label: 'Harga Modal',
      sortable: true,
      render: (item: Product) => (
        <span className="text-gray-600">{formatCurrency(item.costPrice)}</span>
      ),
    },
    {
      key: 'sellingPrice',
      label: 'Harga Jual',
      sortable: true,
      render: (item: Product) => (
        <span className="font-medium text-gray-900">{formatCurrency(item.sellingPrice)}</span>
      ),
    },
    {
      key: 'stock',
      label: 'Stok',
      sortable: true,
      render: (item: Product) => {
        const status = getStockStatus(item.stock, item.minStock);
        return (
          <Badge variant={status === 'safe' ? 'success' : status === 'warning' ? 'warning' : 'danger'}>
            {item.stock} {item.unit}
          </Badge>
        );
      },
    },
    {
      key: 'unit',
      label: 'Satuan',
      render: (item: Product) => (
        <div>
          <p className="text-sm text-gray-700">{item.unit}</p>
          {item.unitConversions.length > 0 && (
            <p className="text-xs text-gray-500">
              {item.unitConversions.map((uc) => `1 ${uc.fromUnit} = ${uc.conversionRate} ${uc.toUnit}`).join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (item: Product) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingProduct(item)}
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua produk toko Anda</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua ({products.length})
        </button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.category === cat.name).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Products Table */}
      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredProducts}
            searchPlaceholder="Cari produk, SKU, atau barcode..."
            searchKeys={['name', 'sku', 'barcode', 'category']}
          />
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Produk Baru"
        size="xl"
      >
        <ProductForm onClose={() => setShowAddModal(false)} />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Produk"
        size="xl"
      >
        {editingProduct && (
          <ProductForm product={editingProduct} onClose={() => setEditingProduct(null)} />
        )}
      </Modal>
    </div>
  );
}

function ProductForm({ product, onClose }: { product?: Product; onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
          <input
            type="text"
            defaultValue={product?.name}
            placeholder="Contoh: Beras Premium 5kg"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            defaultValue={product?.category}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            defaultValue={product?.sku}
            placeholder="Contoh: BRS-001"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
          <input
            type="text"
            defaultValue={product?.barcode}
            placeholder="Scan atau ketik barcode"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Harga</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal</label>
            <input
              type="number"
              defaultValue={product?.costPrice}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
            <input
              type="number"
              defaultValue={product?.sellingPrice}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Grosir</label>
            <input
              type="number"
              defaultValue={product?.wholesalePrice}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Eceran</label>
            <input
              type="number"
              defaultValue={product?.retailPrice}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Stok & Satuan</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Saat Ini</label>
            <input
              type="number"
              defaultValue={product?.stock}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stok</label>
            <input
              type="number"
              defaultValue={product?.minStock}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Satuan Dasar</label>
            <select
              defaultValue={product?.unit}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Satuan</option>
              <option value="Pcs">Pcs</option>
              <option value="Kg">Kg</option>
              <option value="Gram">Gram</option>
              <option value="Liter">Liter</option>
              <option value="Botol">Botol</option>
              <option value="Bungkus">Bungkus</option>
              <option value="Kotak">Kotak</option>
              <option value="Karung">Karung</option>
              <option value="Dus">Dus</option>
              <option value="Pak">Pak</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Konversi Satuan</h4>
        <p className="text-xs text-gray-500 mb-3">Atur konversi satuan bertingkat (mis: 1 Dus = 12 Pcs)</p>
        <div className="space-y-2">
          {(product?.unitConversions || [{ fromUnit: '', toUnit: '', conversionRate: 0 }]).map((conv, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-sm text-gray-600">1</span>
              <input
                type="text"
                defaultValue={conv.fromUnit}
                placeholder="Dus"
                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">=</span>
              <input
                type="number"
                defaultValue={conv.conversionRate}
                placeholder="12"
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                defaultValue={conv.toUnit}
                placeholder="Pcs"
                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            + Tambah Konversi
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} type="button">
          Batal
        </Button>
        <Button type="button" onClick={onClose}>
          {product ? 'Simpan Perubahan' : 'Tambah Produk'}
        </Button>
      </div>
    </form>
  );
}
