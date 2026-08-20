import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { formatRupiah } from '@/lib/utils';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Profile {
  id: string;
  name: string;
  price: number;
}

interface VoucherRow {
  id: string;
  code: string;
  status: string;
  usedAt: string | null;
  expiresAt: string | null;
  profile: { name: string; price: number };
  wilayah: { name: string; code: string };
}

export default function HotspotVouchersPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [profileId, setProfileId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState('');

  const { data } = useQuery({
    queryKey: qk.hotspot(wilayahId, { search, status }),
    queryFn: async () =>
      (
        await api.get<Paginated<VoucherRow>>('/hotspot/vouchers', {
          params: { wilayahId, search: search || undefined, status: status || undefined, perPage: 50 },
        })
      ).data,
  });

  const profiles = useQuery({
    queryKey: [...qk.hotspot(null), 'profiles'],
    queryFn: async () => (await api.get<Profile[]>('/hotspot/profiles')).data,
  });

  const generate = useMutation({
    mutationFn: () =>
      api.post('/hotspot/vouchers/generate', {
        profileId,
        quantity,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
        codeLength: 8,
        prefix: prefix || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hotspot'] });
      toast.success('Generate voucher dimulai');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Voucher Hotspot" quota="hotspot_vouchers" />
      {can('hotspot', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            <option value="">Profil</option>
            {profiles.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Input
            type="number"
            className="max-w-24"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <Input placeholder="Prefix" className="max-w-28" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          <Button disabled={!profileId || quantity < 1 || generate.isPending} onClick={() => generate.mutate()}>
            Generate
          </Button>
        </div>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          placeholder="Cari kode..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="unused">Belum dipakai</option>
          <option value="used">Dipakai</option>
          <option value="expired">Kedaluwarsa</option>
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Profil</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dipakai</TableHead>
            <TableHead>Kedaluwarsa</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={8} message="Belum ada voucher" />}
          {data?.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.code}</TableCell>
              <TableCell>{row.profile.name}</TableCell>
              <TableCell>{formatRupiah(row.profile.price)}</TableCell>
              <TableCell>
                <Badge variant={row.status === 'unused' ? 'success' : row.status === 'used' ? 'neutral' : 'warning'}>
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>{row.usedAt ? new Date(row.usedAt).toLocaleString('id-ID') : '-'}</TableCell>
              <TableCell>{row.expiresAt ? new Date(row.expiresAt).toLocaleDateString('id-ID') : '-'}</TableCell>
              <TableCell>{row.wilayah.code}</TableCell>
              <TableCell>
                <Link className="text-sm text-primary hover:underline" to={`/hotspot/embed/${row.id}`}>
                  Preview
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
