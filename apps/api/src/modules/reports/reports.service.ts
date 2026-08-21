import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Workbook } from 'exceljs';
import { tenantWhere, requireScope } from '../../common/request-context';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Laporan membaca snapshot harian kalau sudah ada. Kalau belum, dihitung dari tabel
   * operasional lalu disimpan, supaya request berikutnya tidak memindai ulang.
   */
  async summary(wilayahId?: string | null) {
    const metrics = await this.compute(wilayahId);
    await this.upsertSnapshot(metrics);
    return metrics;
  }

  customers(wilayahId?: string | null) {
    return this.prisma.customer.groupBy({
      by: ['status'],
      where: { ...tenantWhere(wilayahId), deletedAt: null },
      _count: { _all: true },
    });
  }

  async finances(wilayahId?: string | null) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const groups = await this.prisma.financeTransaction.groupBy({
      by: ['type'],
      where: { ...tenantWhere(wilayahId), transactionDate: { gte: from } },
      _sum: { amount: true },
    });
    const income = groups.find((g) => g.type === 'income')?._sum.amount ?? 0;
    const expense = groups.find((g) => g.type === 'expense')?._sum.amount ?? 0;
    return { income, expense, profit: income - expense, from, to: now };
  }

  async billing(wilayahId?: string | null) {
    const groups = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: tenantWhere(wilayahId),
      _count: { _all: true },
      _sum: { total: true },
    });
    return groups.map((g) => ({ status: g.status, count: g._count._all, total: g._sum.total ?? 0 }));
  }

  private async compute(wilayahId?: string | null) {
    const [customers, finances, billing] = await Promise.all([
      this.customers(wilayahId),
      this.finances(wilayahId),
      this.billing(wilayahId),
    ]);
    return { customers, finances, billing, generatedAt: new Date().toISOString() };
  }

  private async upsertSnapshot(metrics: unknown) {
    const tenantId = requireScope().tenantId;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    await this.prisma.reportDailySnapshot.upsert({
      where: { tenantId_date: { tenantId, date } },
      create: { tenantId, date, metrics: metrics as object },
      update: { metrics: metrics as object },
    });
  }

  async toExcel(wilayahId?: string | null) {
    const [metrics, customers] = await Promise.all([
      this.compute(wilayahId),
      this.prisma.customer.findMany({
        where: { ...tenantWhere(wilayahId), deletedAt: null },
        select: {
          customerCode: true,
          name: true,
          status: true,
          phone: true,
          address: true,
          dueDay: true,
          installationDate: true,
          package: { select: { name: true } },
          wilayah: { select: { code: true, name: true } },
        },
        orderBy: { name: 'asc' },
        take: 5_000,
      }),
    ]);

    const wb = new Workbook();
    wb.creator = 'RadGate';
    wb.created = new Date();

    const rekap = wb.addWorksheet('Rekap');
    rekap.columns = [
      { header: 'Metrik', key: 'metric', width: 28 },
      { header: 'Nilai', key: 'value', width: 22 },
    ];
    rekap.addRows([
      { metric: 'Pendapatan bulan ini (Rp)', value: metrics.finances.income },
      { metric: 'Pengeluaran bulan ini (Rp)', value: metrics.finances.expense },
      { metric: 'Profit (Rp)', value: metrics.finances.profit },
      { metric: 'Dibuat', value: metrics.generatedAt },
    ]);

    const pelangganStatus = wb.addWorksheet('Pelanggan per status');
    pelangganStatus.columns = [
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Jumlah', key: 'count', width: 12 },
    ];
    pelangganStatus.addRows(metrics.customers.map((row) => ({ status: row.status, count: row._count._all })));

    const tagihan = wb.addWorksheet('Tagihan');
    tagihan.columns = [
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Jumlah invoice', key: 'count', width: 16 },
      { header: 'Total (Rp)', key: 'total', width: 18 },
    ];
    tagihan.addRows(metrics.billing);

    const daftar = wb.addWorksheet('Daftar pelanggan');
    daftar.columns = [
      { header: 'Kode', key: 'code', width: 14 },
      { header: 'Nama', key: 'name', width: 28 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Paket', key: 'package', width: 22 },
      { header: 'Wilayah', key: 'wilayah', width: 16 },
      { header: 'Telepon', key: 'phone', width: 18 },
      { header: 'Alamat', key: 'address', width: 36 },
      { header: 'Jatuh tempo', key: 'dueDay', width: 14 },
      { header: 'Instalasi', key: 'installation', width: 14 },
    ];
    daftar.addRows(
      customers.map((row) => ({
        code: row.customerCode,
        name: row.name,
        status: row.status,
        package: row.package.name,
        wilayah: row.wilayah.code,
        phone: row.phone,
        address: row.address,
        dueDay: row.dueDay,
        installation: row.installationDate.toISOString().slice(0, 10),
      })),
    );

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async toPdf(wilayahId?: string | null) {
    const metrics = await this.compute(wilayahId);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.12, 0.16, 0.22);
    let y = 800;

    const line = (text: string, size = 11, heavy = false) => {
      page.drawText(text, { x: 48, y, size, font: heavy ? bold : font, color: ink });
      y -= size + 8;
    };

    line('RadGate - Rekap Laporan', 16, true);
    line(`Dibuat ${metrics.generatedAt}`, 10);
    y -= 8;
    line('Keuangan bulan ini', 13, true);
    line(`Pendapatan  Rp ${metrics.finances.income.toLocaleString('id-ID')}`);
    line(`Pengeluaran Rp ${metrics.finances.expense.toLocaleString('id-ID')}`);
    line(`Profit      Rp ${metrics.finances.profit.toLocaleString('id-ID')}`);
    y -= 8;
    line('Pelanggan', 13, true);
    for (const row of metrics.customers) {
      line(`${row.status}: ${row._count._all}`);
    }
    y -= 8;
    line('Tagihan', 13, true);
    for (const row of metrics.billing) {
      line(`${row.status}: ${row.count} invoice, Rp ${row.total.toLocaleString('id-ID')}`);
    }

    return Buffer.from(await pdf.save());
  }
}
