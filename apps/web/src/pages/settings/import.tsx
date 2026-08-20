import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export default function SettingsImportPage() {
  return (
    <div>
      <PageHeader
        title="Import Data"
        description="Import dari Excel dan dari konfigurasi Mikrotik dijalankan sebagai job latar belakang."
      />
      <Card className="max-w-lg">
        <CardContent className="space-y-2 pt-4 text-sm text-muted-foreground">
          <p>
            Unggahan berkas akan masuk antrean tugas, sama seperti generate tagihan dan voucher, supaya request HTTP
            tidak menunggu proses besar selesai.
          </p>
          <p>
            Endpoint job import belum dipasang di rute ini. Siapkan berkas Excel atau cadangan Mikrotik, lalu jalankan
            dari job yang sudah ada setelah modul import diaktifkan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
