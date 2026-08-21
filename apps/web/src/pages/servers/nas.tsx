import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  Eye,
  EyeOff,
  Info,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { FilterBar, filterControlClass } from '@/components/filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuotaIndicator } from '@/components/layout/quota-indicator';

interface NasRow {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  isDefault: boolean;
  description: string | null;
  connectionMode: string;
  protocol: string | null;
  type: string;
  wilayah: { id: string; name: string; code: string };
  _count: { customers: number };
}

type Panel = 'info' | 'add' | 'migrate' | 'edit' | 'detail' | null;

const emptyForm = {
  name: '',
  description: '',
  ipAddress: '',
  secret: '',
  connectionMode: 'vpn' as 'vpn' | 'direct',
  protocol: 'L2TP, PPTP',
  wilayahId: '',
};

export default function NasPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions, hasQuotaLeft } = useApp();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [editing, setEditing] = useState<NasRow | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);
  const [fromNasId, setFromNasId] = useState('');
  const [toNasId, setToNasId] = useState('');

  const { data, isFetching, refetch } = useQuery({
        queryKey: qk.nas(wilayahId, { search, status, filterWilayah }),
        queryFn: async () =>
          (
            await api.get<Paginated<NasRow>>('/nas', {
              params: {
                wilayahId: filterWilayah || wilayahId,
                search: search || undefined,
                status: status || undefined,
                perPage: 100,
              },
            })
          ).data,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['nas'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: qk.bootstrap });
  };

  const create = useMutation({
    mutationFn: () =>
      api.post('/nas', {
        name: form.name,
        description: form.description || null,
        ipAddress: form.ipAddress,
        secret: form.secret,
        connectionMode: form.connectionMode,
        protocol: form.protocol || null,
        wilayahId: form.wilayahId || wilayahId || wilayahOptions[0]?.id,
        type: 'mikrotik',
        isDefault: false,
      }),
    onSuccess: async () => {
      await invalidate();
      setForm(emptyForm);
      setPanel(null);
      toast.success('NAS ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal menambah NAS'),
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api.patch(`/nas/${id}`, body),
    onSuccess: async () => {
      await invalidate();
      setPanel(null);
      setEditing(null);
      toast.success('NAS diperbarui');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal mengubah NAS'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/nas/${id}`),
    onSuccess: async () => {
      await invalidate();
      toast.success('NAS dihapus');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal menghapus NAS'),
  });

  const migrate = useMutation({
    mutationFn: () => api.post('/nas/migrate', { fromNasId, toNasId }),
    onSuccess: async (res) => {
      await invalidate();
      setPanel(null);
      toast.success(`${res.data.moved} pelanggan dipindahkan`);
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal migrasi'),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => api.post(`/nas/${id}/default`),
    onSuccess: async () => {
      await invalidate();
      toast.success('NAS default disimpan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const rows = data?.data ?? [];
  const onlineCount = rows.filter((n) => n.status === 'online').length;
  const groups = useMemo(() => {
    const map = new Map<string, NasRow[]>();
    for (const row of rows) {
      const key = row.wilayah?.name ?? 'Tanpa wilayah';
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [rows]);

  const toggleSecret = async (id: string) => {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    try {
      const { data: detail } = await api.get<{ secret: string | null }>(`/nas/${id}`, { params: { reveal: 1 } });
      if (detail.secret) setRevealed((prev) => ({ ...prev, [id]: detail.secret! }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tidak bisa menampilkan secret');
    }
  };

  const openEdit = (row: NasRow) => {
    if (row.status === 'online') {
      toast.error('NAS online tidak dapat diedit. Tandai offline terlebih dahulu.');
      return;
    }
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description ?? '',
      ipAddress: row.ipAddress,
      secret: '',
      connectionMode: row.connectionMode === 'vpn' ? 'vpn' : 'direct',
      protocol: row.protocol ?? '',
      wilayahId: row.wilayah.id,
    });
    setPanel('edit');
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Dashboard <span className="mx-1">›</span> NAS
      </p>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Network Access Server (NAS)</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>
            Total: <span className="tabular font-semibold">{data?.meta.total ?? 0}</span>
          </span>
          <span className="text-success">
            Online: <span className="tabular font-semibold">{onlineCount}</span>
          </span>
          <QuotaIndicator metric="nas" />
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setPanel('info')} aria-label="Informasi">
            <Info />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => void refetch()}
            aria-label="Refresh"
          >
            <RefreshCw className={isFetching ? 'animate-spin' : undefined} />
          </Button>
          {can('servers', 'create') && (
            <Button
              size="icon"
              className="rounded-xl"
              disabled={!hasQuotaLeft('nas')}
              onClick={() => {
                setForm({ ...emptyForm, wilayahId: wilayahId ?? wilayahOptions[0]?.id ?? '' });
                setPanel('add');
              }}
              aria-label="Tambah"
            >
              <Plus />
            </Button>
          )}
          {can('servers', 'update') && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => setPanel('migrate')}
              aria-label="Migrasi"
            >
              <ArrowRightLeft />
            </Button>
          )}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-full pl-9"
            placeholder="Cari nama atau deskripsi NAS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-3">
          <FilterBar
            onReset={() => {
              setSearch('');
              setStatus('');
              setFilterWilayah('');
            }}
          >
            <select className={filterControlClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
            <select
              className={filterControlClass}
              value={filterWilayah}
              onChange={(e) => setFilterWilayah(e.target.value)}
            >
              <option value="">Semua Wilayah</option>
              {wilayahOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </FilterBar>
        </div>
      </section>

      {rows.length === 0 && (
        <section className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h3 className="font-semibold">Belum ada NAS</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tambah NAS supaya pelanggan bisa diikat ke server akses.</p>
        </section>
      )}

      {groups.map(([wilayahName, items]) => (
        <section key={wilayahName} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{wilayahName}</h3>
          {items.map((n) => {
            const online = n.status === 'online';
            return (
              <article key={n.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{n.name}</h3>
                    {n.description && <p className="text-sm text-muted-foreground">{n.description}</p>}
                    {n.isDefault && <p className="mt-1 text-xs font-medium text-primary">Default</p>}
                  </div>
                  <Badge variant={online ? 'success' : 'neutral'} className="rounded-full">
                    {online ? 'Online' : 'Offline'}
                  </Badge>
                </div>

                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Mode Koneksi</dt>
                  <dd className="text-right font-medium uppercase">{n.connectionMode === 'vpn' ? 'VPN' : 'Langsung'}</dd>
                  <dt className="text-muted-foreground">IP Server</dt>
                  <dd className="text-right font-medium">{n.ipAddress}</dd>
                  <dt className="text-muted-foreground">Protocol</dt>
                  <dd className="text-right font-medium">{n.protocol || '-'}</dd>
                  <dt className="text-muted-foreground">Secret</dt>
                  <dd className="flex items-center justify-end gap-2 font-medium">
                    <span className="tabular">{revealed[n.id] ?? '••••••'}</span>
                    <button type="button" className="text-muted-foreground" onClick={() => void toggleSecret(n.id)} aria-label="Tampilkan secret">
                      {revealed[n.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </dd>
                </dl>

                <div className="mt-3 flex flex-wrap gap-2">
                  {can('servers', 'update') && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      disabled={online}
                      title={online ? 'NAS online tidak dapat diedit' : 'Ubah'}
                      onClick={() => openEdit(n)}
                    >
                      <Pencil />
                    </Button>
                  )}
                  {can('servers', 'delete') && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl text-destructive hover:text-destructive"
                      disabled={online}
                      title={online ? 'NAS online tidak dapat dihapus' : 'Hapus'}
                      onClick={() => {
                        if (confirm(`Hapus NAS ${n.name}?`)) remove.mutate(n.id);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </div>

                {online && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-semibold text-amber-800">NAS Online</p>
                    <p className="mt-1">
                      NAS berstatus online tidak bisa diubah atau dihapus. Tandai offline terlebih dahulu.
                    </p>
                    {can('servers', 'update') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-full"
                        disabled={patch.isPending}
                        onClick={() => patch.mutate({ id: n.id, body: { status: 'offline' } })}
                      >
                        Tandai offline
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="mt-3 w-full rounded-xl"
                  onClick={() => {
                    setEditing(n);
                    setPanel('detail');
                  }}
                >
                  <Eye /> Lihat Detail
                </Button>
              </article>
            );
          })}
        </section>
      ))}

      {panel && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-4 shadow-lg">
            {panel === 'info' && (
              <>
                <h2 className="text-lg font-semibold">Informasi NAS</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  NAS adalah titik akses yang dipakai RADIUS untuk mengenali concentrator. Setiap
                  pelanggan PPPoE diikat ke satu NAS. Secret hanya disimpan terenkripsi; tampilan mata
                  membacanya untuk petugas yang berwenang.
                </p>
                <Button className="mt-4 w-full rounded-xl" onClick={() => setPanel(null)}>
                  Tutup
                </Button>
              </>
            )}

            {panel === 'add' && (
              <NasForm
                title="Tambah NAS"
                form={form}
                setForm={setForm}
                wilayahOptions={wilayahOptions}
                pending={create.isPending}
                onCancel={() => setPanel(null)}
                onSubmit={() => create.mutate()}
                submitLabel="Tambah NAS"
              />
            )}

            {panel === 'edit' && editing && (
              <NasForm
                title="Ubah NAS"
                form={form}
                setForm={setForm}
                wilayahOptions={wilayahOptions}
                pending={patch.isPending}
                secretOptional
                onCancel={() => setPanel(null)}
                onSubmit={() =>
                  patch.mutate({
                    id: editing.id,
                    body: {
                      name: form.name,
                      description: form.description || null,
                      ipAddress: form.ipAddress,
                      ...(form.secret ? { secret: form.secret } : {}),
                      connectionMode: form.connectionMode,
                      protocol: form.protocol || null,
                      ...(form.wilayahId ? { wilayahId: form.wilayahId } : {}),
                    },
                  })
                }
                submitLabel="Simpan"
              />
            )}

            {panel === 'migrate' && (
              <>
                <h2 className="text-lg font-semibold">Migrasi pelanggan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Memindahkan semua pelanggan dari satu NAS ke NAS lain, misalnya saat ganti perangkat.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>Dari</Label>
                    <select
                      className={`${filterControlClass} mt-1 w-full`}
                      value={fromNasId}
                      onChange={(e) => setFromNasId(e.target.value)}
                    >
                      <option value="">Pilih NAS asal</option>
                      {rows.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n._count.customers} pelanggan)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Ke</Label>
                    <select
                      className={`${filterControlClass} mt-1 w-full`}
                      value={toNasId}
                      onChange={(e) => setToNasId(e.target.value)}
                    >
                      <option value="">Pilih NAS tujuan</option>
                      {rows.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPanel(null)}>
                    Batal
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
                    disabled={!fromNasId || !toNasId || migrate.isPending}
                    onClick={() => migrate.mutate()}
                  >
                    Pindahkan
                  </Button>
                </div>
              </>
            )}

            {panel === 'detail' && editing && (
              <>
                <h2 className="text-lg font-semibold">{editing.name}</h2>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Wilayah</dt>
                  <dd className="text-right">{editing.wilayah.name}</dd>
                  <dt className="text-muted-foreground">Pelanggan</dt>
                  <dd className="text-right tabular">{editing._count.customers}</dd>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-right">{editing.status}</dd>
                  <dt className="text-muted-foreground">IP Server</dt>
                  <dd className="text-right">{editing.ipAddress}</dd>
                </dl>
                <div className="mt-4 space-y-2">
                  {can('servers', 'update') && !editing.isDefault && (
                    <Button
                      className="w-full rounded-xl"
                      disabled={setDefault.isPending}
                      onClick={() => setDefault.mutate(editing.id)}
                    >
                      Jadikan default
                    </Button>
                  )}
                  {can('servers', 'update') && editing.status === 'offline' && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={patch.isPending}
                      onClick={() => patch.mutate({ id: editing.id, body: { status: 'online' } })}
                    >
                      Tandai online
                    </Button>
                  )}
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => setPanel(null)}>
                    Tutup
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NasForm({
  title,
  form,
  setForm,
  wilayahOptions,
  pending,
  onCancel,
  onSubmit,
  submitLabel,
  secretOptional,
}: {
  title: string;
  form: typeof emptyForm;
  setForm: (next: typeof emptyForm) => void;
  wilayahOptions: { id: string; name: string }[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  secretOptional?: boolean;
}) {
  const set = (key: keyof typeof emptyForm, value: string) => setForm({ ...form, [key]: value });

  return (
    <>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {secretOptional ? 'Ubah data NAS yang sedang offline.' : 'Tambahkan Network Access Server ke sistem.'}
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <Label required>Nama NAS</Label>
          <Input className="mt-1" placeholder="Contoh: Router Pusat" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <Label>Deskripsi</Label>
          <Input
            className="mt-1"
            placeholder="Contoh: Router untuk area pusat kota"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div>
          <Label required>Metode koneksi</Label>
          <select
            className={`${filterControlClass} mt-1 w-full`}
            value={form.connectionMode}
            onChange={(e) => set('connectionMode', e.target.value)}
          >
            <option value="vpn">VPN</option>
            <option value="direct">Langsung</option>
          </select>
        </div>
        <div>
          <Label required>IP / host server</Label>
          <Input className="mt-1" placeholder="10.0.0.1 atau hostname" value={form.ipAddress} onChange={(e) => set('ipAddress', e.target.value)} />
        </div>
        <div>
          <Label>Protocol</Label>
          <Input className="mt-1" placeholder="L2TP, PPTP" value={form.protocol} onChange={(e) => set('protocol', e.target.value)} />
        </div>
        <div>
          <Label required={!secretOptional}>RADIUS secret{secretOptional ? ' (kosongkan jika tidak diganti)' : ''}</Label>
          <Input
            className="mt-1"
            type="password"
            value={form.secret}
            onChange={(e) => set('secret', e.target.value)}
          />
        </div>
        <div>
          <Label required>Wilayah</Label>
          <select
            className={`${filterControlClass} mt-1 w-full`}
            value={form.wilayahId}
            onChange={(e) => set('wilayahId', e.target.value)}
          >
            <option value="">Pilih wilayah untuk NAS</option>
            {wilayahOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="flex-1 rounded-xl" onClick={onCancel}>
          Batal
        </Button>
        <Button
          className="flex-1 rounded-xl"
          disabled={!form.name || !form.ipAddress || (!secretOptional && form.secret.length < 6) || !form.wilayahId || pending}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
    </>
  );
}
