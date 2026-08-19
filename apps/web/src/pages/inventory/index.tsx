import { ModuleScaffold } from '@/components/module-scaffold';

export default function InventoryPage() {
  return (
    <ModuleScaffold
      title="Inventory"
      stage="Tahap 6"
      description="Tab: Barang & Stok, Log Transaksi."
      columns={["Kode","Nama Barang","Kategori","Unit","Stok","Deskripsi","Aksi"]}
      actions={["Tambah Barang","Tambah Stok","Barang Keluar","Export Stok"]}
      filters={["Semua Wilayah","Semua Reseller","Semua Kategori"]}
      endpoints={["GET /inventory/items","GET /inventory/transactions"]}
    />
  );
}
