import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customerPatchSchema, customerSchema, ROUTES, type CustomerInput, type Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { toPhone62 } from '@/lib/utils';
import { useApp } from '@/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError, Label } from '@/components/ui/label';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PackageRow = { id: string; name: string; price: number };
type InventoryRow = { id: string; name: string; code: string; stock: number };
type WilayahRow = { id: string; name: string; isActive: boolean };

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label required={required}>{label}</Label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function CustomerForm({
  defaultValues,
  submitting,
  onSubmit,
  mode = 'create',
}: {
  defaultValues?: Partial<CustomerInput>;
  submitting: boolean;
  onSubmit: (
    values: unknown,
    setError: (field: string, err: { type: string; message: string }) => void,
  ) => void;
  mode?: 'create' | 'edit';
}) {
  const { wilayahOptions, activeWilayahId, can } = useApp();
  const packages = useQuery({
    queryKey: qk.packages(null),
    queryFn: async () => (await api.get<Paginated<PackageRow>>('/internet-packages', { params: { perPage: 100 } })).data,
  });
  const wilayahList = useQuery({
    queryKey: qk.wilayah,
    queryFn: async () => (await api.get<Paginated<WilayahRow>>('/wilayah', { params: { perPage: 100 } })).data,
    enabled: can('settings', 'view'),
  });
  const inventory = useQuery({
    queryKey: qk.inventory(null),
    queryFn: async () =>
      (await api.get<Paginated<InventoryRow>>('/inventory/items', { params: { perPage: 100 } })).data,
    enabled: mode === 'create',
  });

  const wilayahChoices =
    wilayahList.data?.data.filter((w) => w.isActive).map((w) => ({ id: w.id, name: w.name })) ??
    wilayahOptions.map((w) => ({ id: w.id, name: w.name }));

  const form = useForm({
    resolver: zodResolver(mode === 'create' ? customerSchema : customerPatchSchema),
    defaultValues: {
      ipMode: 'dhcp',
      billingType: 'postpaid',
      installationFee: 0,
      discount: 0,
      status: 'aktif',
      inventoryItems: [],
      dueDay: 10,
      installationDate: new Date(),
      wilayahId: activeWilayahId ?? wilayahOptions[0]?.id,
      ...defaultValues,
    },
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const { errors } = formState;
  const [stockOut, setStockOut] = useState<{ itemId: string; quantity: number }[]>([]);

  useEffect(() => {
    const current = watch('wilayahId');
    if (current && wilayahChoices.some((w) => w.id === current)) return;
    const next = activeWilayahId && wilayahChoices.some((w) => w.id === activeWilayahId)
      ? activeWilayahId
      : wilayahChoices[0]?.id;
    if (next) setValue('wilayahId', next, { shouldValidate: true });
  }, [wilayahChoices, activeWilayahId, setValue, watch]);

  useEffect(() => {
    const list = packages.data?.data ?? [];
    const current = watch('packageId');
    if (current && list.some((p) => p.id === current)) return;
    if (list[0]) setValue('packageId', list[0].id, { shouldValidate: true });
  }, [packages.data, setValue, watch]);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(
        (values) =>
          onSubmit(
            {
              ...values,
              phone: toPhone62(values.phone),
              inventoryItems: stockOut.filter((r) => r.itemId),
            },
            form.setError as (field: string, err: { type: string; message: string }) => void,
          ),
        (errs) => {
          const first = Object.values(errs).find((e) => e && typeof e === 'object' && 'message' in e) as
            | { message?: string }
            | undefined;
          toast.error(first?.message ?? 'Periksa isian yang bertanda merah');
        },
      )}
      noValidate
    >
      <Section title="Layanan Internet">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Username PPPoE" required error={errors.pppoeUsername?.message}>
            <Input {...register('pppoeUsername')} placeholder="Username untuk login" />
          </Field>
          <Field label="Password PPPoE" required={mode === 'create'} error={errors.pppoePassword?.message}>
            <Input type="password" {...register('pppoePassword')} placeholder={mode === 'edit' ? 'Kosongkan jika tidak diganti' : 'Password untuk PPPoE'} />
          </Field>
          <Field label="Paket Internet" required error={errors.packageId?.message}>
            <Select value={watch('packageId')} onValueChange={(v: string) => setValue('packageId', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                {packages.data?.data.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pengaturan IP" error={errors.ipMode?.message}>
            <Select value={watch('ipMode')} onValueChange={(v: string) => setValue('ipMode', v as CustomerInput['ipMode'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dhcp">DHCP</SelectItem>
                <SelectItem value="static">Statis</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Akun Aplikasi">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" {...register('email')} placeholder="email@example.com" />
          </Field>
          <Field label="Password" required={mode === 'create'} error={errors.appPassword?.message}>
            <Input type="password" {...register('appPassword')} placeholder={mode === 'edit' ? 'Kosongkan jika tidak diganti' : 'Password untuk aplikasi'} />
          </Field>
        </div>
      </Section>

      <Section title="Informasi Personal">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama Lengkap" required error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field
            label="Nomor Telepon"
            required
            error={errors.phone?.message}
            hint="Contoh 6281234567890. Boleh 08…, akan diubah ke 62."
          >
            <Input {...register('phone')} placeholder="6281234567890" />
          </Field>
          <Field label="NIK" required error={errors.nik?.message} hint="16 digit tanpa spasi atau tanda hubung">
            <Input {...register('nik')} placeholder="3501234567890001" inputMode="numeric" />
          </Field>
          <Field label="Wilayah" required error={errors.wilayahId?.message}>
            <Select value={watch('wilayahId')} onValueChange={(v: string) => setValue('wilayahId', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih wilayah" />
              </SelectTrigger>
              <SelectContent>
                {wilayahChoices.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Alamat Lengkap" required error={errors.address?.message}>
            <Input className="sm:col-span-2" {...register('address')} />
          </Field>
          <Field label="Tipe Penagihan" error={errors.billingType?.message}>
            <Select
              value={watch('billingType')}
              onValueChange={(v: string) => setValue('billingType', v as CustomerInput['billingType'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postpaid">Postpaid</SelectItem>
                <SelectItem value="prepaid">Prepaid</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tgl Jatuh Tempo" required error={errors.dueDay?.message}>
            <Input type="number" min={1} max={31} {...register('dueDay', { valueAsNumber: true })} />
          </Field>
          <Field label="Tanggal Instalasi" error={errors.installationDate?.message}>
            <Input
              type="date"
              {...register('installationDate', {
                setValueAs: (v) => (v ? new Date(v) : new Date()),
              })}
            />
          </Field>
          <Field label="Biaya Pasang" error={errors.installationFee?.message}>
            <Input type="number" min={0} {...register('installationFee', { valueAsNumber: true })} />
          </Field>
          <Field label="Diskon (Rp)" error={errors.discount?.message}>
            <Input type="number" min={0} {...register('discount', { valueAsNumber: true })} />
          </Field>
          <Field label="Catatan" error={errors.notes?.message}>
            <Textarea {...register('notes')} />
          </Field>
          <Field
            label="Latitude"
            error={errors.latitude?.message}
            hint="Opsional. Isi bersama longitude agar pelanggan tampil di peta."
          >
            <Input
              type="number"
              step="any"
              {...register('latitude', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
            />
          </Field>
          <Field label="Longitude" error={errors.longitude?.message}>
            <Input
              type="number"
              step="any"
              {...register('longitude', {
                setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
              })}
            />
          </Field>
        </div>
      </Section>

      {mode === 'create' && (
        <Section title="Inventory Barang Keluar">
          <p className="mb-3 text-xs text-muted-foreground">
            Opsional. Stok dipotong dalam transaksi yang sama dengan pembuatan pelanggan.
            Barang dan stok diisi dulu di menu Inventory.
          </p>
          {(inventory.data?.data.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada barang.{' '}
              <Link to={ROUTES.inventory.index} className="text-primary hover:underline">
                Tambah barang dan stok di Inventory
              </Link>
              , lalu kembali ke form ini.
            </p>
          ) : (
            <>
          {(stockOut).map((row, index) => (
            <div key={`${row.itemId}-${index}`} className="mb-2 flex flex-wrap gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={row.itemId}
                onChange={(e) => {
                  const next = [...stockOut];
                  next[index] = { ...row, itemId: e.target.value };
                  setStockOut(next);
                }}
              >
                <option value="">Pilih barang</option>
                {inventory.data?.data.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} · {i.name} (stok {i.stock})
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={1}
                className="max-w-24"
                value={row.quantity}
                onChange={(e) => {
                  const next = [...stockOut];
                  next[index] = { ...row, quantity: Number(e.target.value) };
                  setStockOut(next);
                }}
              />
              <Button type="button" variant="outline" onClick={() => setStockOut(stockOut.filter((_, i) => i !== index))}>
                Hapus
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={!inventory.data?.data.length}
            onClick={() =>
              setStockOut([...stockOut, { itemId: inventory.data?.data[0]?.id ?? '', quantity: 1 }])
            }
          >
            Tambah barang
          </Button>
            </>
          )}
        </Section>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
