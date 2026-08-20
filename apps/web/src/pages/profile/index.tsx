import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AuthUser } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get<AuthUser>('/profile')).data,
  });

  return (
    <div>
      <PageHeader
        title="Profil Saya"
        actions={
          <Button asChild>
            <Link to={ROUTES.profile.edit}>Ubah</Link>
          </Button>
        }
      />
      <Card className="max-w-lg">
        <CardContent className="space-y-2 pt-4 text-sm">
          <p className="font-medium">{data?.name}</p>
          <p>{data?.email}</p>
          <p>{formatPhone(data?.phone)}</p>
          <p className="capitalize">{data?.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
