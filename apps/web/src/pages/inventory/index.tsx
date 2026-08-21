import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Item {
  id: string;
  code: string;
  name: string;
  unit: string;
  stock: number;
  category: { name: string };
  wilayah: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function InventoryPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.inventory(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<Item>>('/inventory/items', { params: { wilayahId, perPage: 100 } })).data,
  });
  const categories = useQuery({
    queryKey: [...qk.inventory(null), 'categories'],
    queryFn: async () => (await api.get<Category[]>('/inventory/categories')).data,
  });

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [catName, setCatName] = useState('');
  const [initialStock, setInitialStock] = useState(0);
  const [moveItemId, setMoveItemId] = useState('');
  const [moveQty, setMoveQty] = useState(1);

  const addCat = useMutation({
    mutationFn: () => api.post('/inventory/categories', { name: catName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setCatName('');
      toast.success('Kategori ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal menambah kategori'),
  });

  const addItem = useMutation({
    mutationFn: () =>
      api.post('/inventory/items', {
        name,
        code,
        categoryId,
        unit: 'pcs',
        unitPrice: 0,
        stock: initialStock,
        wilayahId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setName('');
      setCode('');
      setInitialStock(0);
      toast.success('Barang ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const stockIn = useMutation({
    mutationFn: () =>
      api.post('/inventory/transactions', {
        itemId: moveItemId,
        type: 'in',
        quantity: moveQty,
        notes: 'Stok masuk',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setMoveQty(1);
      toast.success('Stok ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal menambah stok'),
  });

  const items = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Buat kategori, tambah barang beserta stok awal, lalu isi stok masuk jika perlu."
      />
      {can('inventory', 'create') && (
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Kategori baru" value={catName} onChange={(e) => setCatName(e.target.value)} className="max-w-48" />
            <Button variant="outline" disabled={!catName || addCat.isPending} onClick={() => addCat.mutate()}>
              Tambah kategori
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Input placeholder="Kode" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-28" />
            <Input placeholder="Nama barang" value={name} onChange={(e) => setName(e.target.value)} className="max-w-48" />
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Kategori</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={0}
              className="max-w-24"
              value={initialStock}
              onChange={(e) => setInitialStock(Number(e.target.value))}
              aria-label="Stok awal"
              placeholder="Stok"
            />
            <Button disabled={!name || !code || !categoryId || addItem.isPending} onClick={() => addItem.mutate()}>
              Tambah Barang
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={moveItemId}
              onChange={(e) => setMoveItemId(e.target.value)}
            >
              <option value="">Pilih barang untuk stok masuk</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.code} · {i.name} (stok {i.stock})
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              className="max-w-24"
              value={moveQty}
              onChange={(e) => setMoveQty(Number(e.target.value))}
              aria-label="Jumlah stok masuk"
            />
            <Button
              variant="outline"
              disabled={!moveItemId || moveQty < 1 || stockIn.isPending}
              onClick={() => stockIn.mutate()}
            >
              Stok masuk
            </Button>
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama Barang</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Stok</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && <TableEmpty colSpan={6} />}
          {items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{i.code}</TableCell>
              <TableCell>{i.name}</TableCell>
              <TableCell>{i.category.name}</TableCell>
              <TableCell>{i.wilayah?.name ?? 'Semua'}</TableCell>
              <TableCell>{i.unit}</TableCell>
              <TableCell>{i.stock}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
