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

  const addCat = useMutation({
    mutationFn: () => api.post('/inventory/categories', { name: catName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setCatName('');
    },
  });

  const addItem = useMutation({
    mutationFn: () =>
      api.post('/inventory/items', {
        name,
        code,
        categoryId,
        unit: 'pcs',
        unitPrice: 0,
        wilayahId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setName('');
      setCode('');
      toast.success('Barang ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Inventory" />
      {can('inventory', 'create') && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Kategori baru" value={catName} onChange={(e) => setCatName(e.target.value)} className="max-w-48" />
            <Button variant="outline" disabled={!catName} onClick={() => addCat.mutate()}>
              Tambah kategori
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Button disabled={!name || !code || !categoryId || addItem.isPending} onClick={() => addItem.mutate()}>
              Tambah Barang
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
            <TableHead>Unit</TableHead>
            <TableHead>Stok</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
          {data?.data.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{i.code}</TableCell>
              <TableCell>{i.name}</TableCell>
              <TableCell>{i.category.name}</TableCell>
              <TableCell>{i.unit}</TableCell>
              <TableCell>{i.stock}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
