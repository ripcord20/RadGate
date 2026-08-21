import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated, Role } from '@radgate/shared';
import { ROLES } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AccountRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  wilayah: { name: string } | null;
}

export default function AccountsPage() {
  const { can, wilayahOptions } = useApp();
  const { data } = useQuery({
    queryKey: qk.accounts,
    queryFn: async () => (await api.get<Paginated<AccountRow>>('/accounts', { params: { perPage: 100 } })).data,
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('teknisi');
  const [wilayahId, setWilayahId] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.post('/accounts', {
        name,
        email,
        password,
        role,
        wilayahId: wilayahId || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.accounts });
      setName('');
      setEmail('');
      setPassword('');
      toast.success('Akun dibuat');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div>
      <PageHeader title="Manajemen Akun" />
      {can('settings', 'create') && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} className="max-w-40" />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-52" />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="max-w-40"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={wilayahId}
            onChange={(e) => setWilayahId(e.target.value)}
          >
            <option value="">Semua wilayah</option>
            {wilayahOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <Button disabled={!name || !email || password.length < 8 || create.isPending} onClick={() => create.mutate()}>
            Tambah Akun
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telepon</TableHead>
            <TableHead>Wilayah</TableHead>
            <TableHead>Peran</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.data.length ?? 0) === 0 && <TableEmpty colSpan={5} />}
          {data?.data.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.phone ?? '-'}</TableCell>
              <TableCell>{u.wilayah?.name ?? 'Semua'}</TableCell>
              <TableCell className="capitalize">{u.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
