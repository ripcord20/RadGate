import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomerStatus } from '@radgate/shared';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useActiveWilayah, useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Badge, CUSTOMER_STATUS_VARIANT } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import 'leaflet/dist/leaflet.css';

interface Odp {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  capacity: number;
  usedPorts: number;
}

interface MappedCustomer {
  id: string;
  name: string;
  customerCode: string;
  status: CustomerStatus;
  latitude: number;
  longitude: number;
  address: string;
  package: { name: string };
}

interface MappingStats {
  odp: number;
  customersWithLocation: number;
  capacity: number;
  usedPorts: number;
}

const DEFAULT_CENTER: [number, number] = [-2.5, 118];

export default function MappingPage() {
  const wilayahId = useActiveWilayah();
  const { can, wilayahOptions } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [latitude, setLatitude] = useState(-6.2);
  const [longitude, setLongitude] = useState(106.8);
  const [capacity, setCapacity] = useState(8);

  const odp = useQuery({
    queryKey: [...qk.mapping(wilayahId), 'odp'],
    queryFn: async () => (await api.get<Odp[]>('/mapping/odp', { params: { wilayahId } })).data,
  });
  const customers = useQuery({
    queryKey: [...qk.mapping(wilayahId), 'customers'],
    queryFn: async () =>
      (await api.get<MappedCustomer[]>('/mapping/customers', { params: { wilayahId } })).data,
  });
  const stats = useQuery({
    queryKey: [...qk.mapping(wilayahId), 'stats'],
    queryFn: async () => (await api.get<MappingStats>('/mapping/stats', { params: { wilayahId } })).data,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/mapping/odp', {
        name,
        code,
        latitude,
        longitude,
        capacity,
        wilayahId: wilayahId ?? wilayahOptions[0]?.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mapping'] });
      setName('');
      setCode('');
      toast.success('ODP ditambahkan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  const center = useMemo<[number, number]>(() => {
    const firstOdp = odp.data?.[0];
    if (firstOdp) return [firstOdp.latitude, firstOdp.longitude];
    const firstCustomer = customers.data?.[0];
    if (firstCustomer) return [firstCustomer.latitude, firstCustomer.longitude];
    return DEFAULT_CENTER;
  }, [odp.data, customers.data]);

  const loaded = !odp.isLoading && !customers.isLoading;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pemetaan"
        description={
          stats.data
            ? `ODP ${stats.data.odp} · Pelanggan terpetakan ${stats.data.customersWithLocation} · Port ${stats.data.usedPorts}/${stats.data.capacity}`
            : 'Peta ODP dan pelanggan yang punya koordinat.'
        }
      />
      {can('mapping', 'create') && (
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Nama ODP" className="max-w-40" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Kode" className="max-w-28" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input type="number" className="max-w-28" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} />
          <Input type="number" className="max-w-28" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))} />
          <Input type="number" className="max-w-24" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          <Button disabled={!name || !code || create.isPending} onClick={() => create.mutate()}>
            Tambah ODP
          </Button>
        </div>
      )}
      {loaded && (
        <Card>
          <CardContent className="p-0">
            <MapContainer center={center} zoom={odp.data?.length || customers.data?.length ? 13 : 5} className="h-[70vh] w-full rounded-lg">
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {odp.data?.map((o) => (
                <CircleMarker
                  key={o.id}
                  center={[o.latitude, o.longitude]}
                  radius={10}
                  pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.7 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{o.name}</p>
                      <p>{o.code}</p>
                      <p>
                        Port {o.usedPorts}/{o.capacity}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {customers.data?.map((c) => (
                <CircleMarker
                  key={c.id}
                  center={[c.latitude, c.longitude]}
                  radius={6}
                  pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.8 }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{c.name}</p>
                      <p>{c.customerCode}</p>
                      <Badge variant={CUSTOMER_STATUS_VARIANT[c.status]}>{c.status}</Badge>
                      <p>{c.package.name}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
