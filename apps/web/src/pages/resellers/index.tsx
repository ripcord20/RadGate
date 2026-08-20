import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated, ResellerType } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatPhone, formatRupiah } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ResellerRow {
  id: string;
  name: string;
  phone: string;
  type: ResellerType;
  commissionType: 'percent' | 'fixed';
  commissionValue: number;
  balance: number;
  status: string;
  wilayah: { name: string; code: string };
}

export default function ResellersPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('62');
  const [newType, setNewType] = useState<ResellerType>('reseller');
  const [commissionType, setCommissionType] = useState<'percent' | 'fixed'>('percent');
  const [commissionValue, setCommissionValue] = useState(10);

  const { data } = useQuery({
    queryKey: [...qk.resellers(wilayahId), type, search],
    queryFn: async () =>
      (
        await api.get<Paginated<ResellerRow>>('/resellers', {
          params: { wilayahId, type: type || undefined, search: search || undefined, perPage: 50 },
        })
      ).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/resellers', {
        name,
        phone,
        type: newType,
        commissionType,
        commissionValue,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['resellers'] });
      setName('');
      setPhone('62');
      toast.success('Reseller ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Reseller & Biller" />
      {can('resellers', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama" className="max-w-40" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="62812..." className="max-w-40" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={newType}
            onChange={(e) => setNewType(e.target.value as ResellerType)}
          >
            <option value="reseller">Reseller</option>
            <option value="biller">Biller</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={commissionType}
            onChange={(e) => setCommissionType(e.target.value as 'percent' | 'fixed')}
          >
            <option value="percent">Komisi %</option>
            <option value="fixed">Komisi tetap</option>
          </select>
          <Input
            type="number"
            className="max-w-28"
            value={commissionValue}
            onChange={(e) => setCommissionValue(Number(e.target.value))}
          />
          <Button disabled={!name || phone.length < 10 || create.isPending} onClick={() => create.mutate()}>
            Tambah
          </Button>
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Input placeholder="Cari nama atau telepon..." className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Semua Tipe</option>
          <option value="reseller">Reseller</option>
          <option value="biller">Biller</option>
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Komisi</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={8} />}
          {data?.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{formatPhone(row.phone)}</TableCell>
              <TableCell className="capitalize">{row.type}</TableCell>
              <TableCell>
                {row.commissionType === 'percent' ? `${row.commissionValue}%` : formatRupiah(row.commissionValue)}
              </TableCell>
              <TableCell>{formatRupiah(row.balance)}</TableCell>
              <TableCell>{row.wilayah.code}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'aktif' ? 'success' : 'neutral'}>{row.status}</Badge>
              </TableCell>
              <TableCell className="space-x-2 whitespace-nowrap">
                <Link className="text-sm text-primary hover:underline" to={`${ROUTES.resellers.customers}?id=${row.id}`}>
                  Pelanggan
                </Link>
                <Link className="text-sm text-primary hover:underline" to={`${ROUTES.resellers.log}?id=${row.id}`}>
                  Log
                </Link>
                <Link className="text-sm text-primary hover:underline" to={`${ROUTES.resellers.pay}?id=${row.id}`}>
                  Bayar
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
