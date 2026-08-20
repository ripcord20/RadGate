import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { customerPatchSchema, customerSchema, type CustomerInput, type Paginated } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldError, Label } from '@/components/ui/label';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PackageRow = { id: string; name: string; price: number };

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label required={required}>{label}</Label>
      {children}
      <FieldError message={error} />
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
  onSubmit: (values: unknown) => void;
  mode?: 'create' | 'edit';
}) {
  const { wilayahOptions, activeWilayahId } = useApp();
  const packages = useQuery({
    queryKey: qk.packages(null),
    queryFn: async () => (await api.get<Paginated<PackageRow>>('/internet-packages', { params: { perPage: 100 } })).data,
  });

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

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
          <Field label="Nomor Telepon" required error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="Diawali dengan 62" />
          </Field>
          <Field label="NIK" required error={errors.nik?.message}>
            <Input {...register('nik')} />
          </Field>
          <Field label="Wilayah" required error={errors.wilayahId?.message}>
            <Select value={watch('wilayahId')} onValueChange={(v: string) => setValue('wilayahId', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih wilayah" />
              </SelectTrigger>
              <SelectContent>
                {wilayahOptions.map((w) => (
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
        </div>
      </Section>

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
