import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { CustomerStatus } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { qk } from '@/lib/query';
import { Badge, CUSTOMER_STATUS_VARIANT } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import 'leaflet/dist/leaflet.css';

interface MappedCustomer {
  id: string;
  name: string;
  customerCode: string;
  status: CustomerStatus;
  latitude: number;
  longitude: number;
  package: { name: string };
}

interface Odp {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER: [number, number] = [-2.5, 118];

export function DashboardMapPreview({ wilayahId }: { wilayahId: string | null }) {
  const customers = useQuery({
    queryKey: [...qk.mapping(wilayahId), 'customers'],
    queryFn: async () =>
      (await api.get<MappedCustomer[]>('/mapping/customers', { params: { wilayahId } })).data,
  });
  const odp = useQuery({
    queryKey: [...qk.mapping(wilayahId), 'odp'],
    queryFn: async () => (await api.get<Odp[]>('/mapping/odp', { params: { wilayahId } })).data,
  });

  const points = [
    ...(customers.data ?? []).map((c) => [c.latitude, c.longitude] as [number, number]),
    ...(odp.data ?? []).map((o) => [o.latitude, o.longitude] as [number, number]),
  ];
  const center = points[0] ?? DEFAULT_CENTER;
  const loading = customers.isLoading || odp.isLoading;
  const empty = !loading && points.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Peta</CardTitle>
        <Link to={ROUTES.mapping.index} className="text-xs text-primary hover:underline">
          Buka Pemetaan
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <Skeleton className="h-64 w-full rounded-none" />
        ) : empty ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            Belum ada titik. Isi latitude dan longitude pada pelanggan, atau tambah ODP di menu Pemetaan.
          </p>
        ) : (
          <MapContainer center={center} zoom={points.length > 1 ? 12 : 5} className="h-64 w-full rounded-b-lg">
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {odp.data?.map((o) => (
              <CircleMarker
                key={o.id}
                center={[o.latitude, o.longitude]}
                radius={9}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.7 }}
              >
                <Popup>
                  <p className="text-sm font-medium">{o.name}</p>
                  <p className="text-xs">{o.code}</p>
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
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs">{c.customerCode}</p>
                  <Badge variant={CUSTOMER_STATUS_VARIANT[c.status]}>{c.status}</Badge>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </CardContent>
    </Card>
  );
}
