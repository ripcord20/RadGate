import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FinanceType, Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Tx {
  id: string;
  type: FinanceType;
  amount: number;
  description: string;
  transactionDate: string;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
  type: FinanceType;
}

export default function FinancesPage() {
  const wilayahId = useActiveWilayah();
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.finances(wilayahId),
    queryFn: async () =>
      (await api.get<Paginated<Tx>>('/finances', { params: { wilayahId, perPage: 50 } })).data,
  });
  const summary = useQuery({
    queryKey: [...qk.finances(wilayahId), 'summary'],
    queryFn: async () => (await api.get('/finances/summary', { params: { wilayahId } })).data,
  });
  const categories = useQuery({
    queryKey: [...qk.finances(null), 'categories'],
    queryFn: async () => (await api.get<Category[]>('/finances/categories')).data,
  });

  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<FinanceType>('expense');

  const create = useMutation({
    mutationFn: () =>
      api.post('/finances', {
        categoryId,
        type,
        amount,
        description,
        transactionDate: new Date().toISOString(),
        wilayahId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['finances'] });
      setDescription('');
      setAmount(0);
      toast.success('Transaksi dicatat');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Keuangan" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pendapatan</p>
            <p className="font-semibold">{formatRupiah(summary.data?.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Pengeluaran</p>
            <p className="font-semibold">{formatRupiah(summary.data?.expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className="font-semibold">{formatRupiah(summary.data?.profit)}</p>
          </CardContent>
        </Card>
      </div>

      {can('finances', 'create') && (
        <div className="flex flex-wrap gap-2">
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
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as FinanceType)}
          >
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <Input type="number" className="max-w-32" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <Input placeholder="Deskripsi" className="max-w-56" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button disabled={!categoryId || !description || amount < 1 || create.isPending} onClick={() => create.mutate()}>
            Tambah
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Keterangan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
          {data?.data.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{new Date(tx.transactionDate).toLocaleDateString('id-ID')}</TableCell>
              <TableCell>{tx.category.name}</TableCell>
              <TableCell>{tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</TableCell>
              <TableCell>{formatRupiah(tx.amount)}</TableCell>
              <TableCell>{tx.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
