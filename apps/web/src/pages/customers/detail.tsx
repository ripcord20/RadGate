import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { api } from '@/lib/api';
import { formatPhone, formatRupiah } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge, CUSTOMER_STATUS_VARIANT, INVOICE_STATUS_LABEL, INVOICE_STATUS_VARIANT } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { CustomerStatus, InvoiceStatus } from '@radgate/shared';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: qk.customer(id ?? ''),
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
    enabled: !!id,
  });

  if (isLoading || !data) return <Skeleton className="h-80" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={data.name}
        description={`${data.customerCode} · ${data.pppoeUsername}`}
        actions={
          <Button asChild variant="outline">
            <Link to={`/customers/edit/${data.id}`}>Edit</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status">
              <Badge variant={CUSTOMER_STATUS_VARIANT[data.status as CustomerStatus]}>{data.status}</Badge>
            </Row>
            <Row label="Paket">{data.package?.name}</Row>
            <Row label="Telepon">{formatPhone(data.phone)}</Row>
            <Row label="Email">{data.email ?? '-'}</Row>
            <Row label="Alamat">{data.address}</Row>
            <Row label="Wilayah">{data.wilayah?.name}</Row>
            <Row label="Jatuh tempo">Tanggal {data.dueDay}</Row>
            <Row label="Diskon">{formatRupiah(data.discount)}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tagihan terakhir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data.invoices ?? []).length === 0 && <p className="text-muted-foreground">Belum ada tagihan</p>}
            {(data.invoices ?? []).map((inv: { id: string; invoiceNumber: string; total: number; status: InvoiceStatus }) => (
              <div key={inv.id} className="flex items-center justify-between">
                <Link to={`/billing/detail/${inv.id}`} className="text-primary hover:underline">
                  {inv.invoiceNumber}
                </Link>
                <span>{formatRupiah(inv.total)}</span>
                <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
