import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomerInput } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api, applyServerErrors, type NormalizedError } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { CustomerForm } from '@/features/customers/customer-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detail = useQuery({
    queryKey: qk.customer(id ?? ''),
    queryFn: async () => (await api.get(`/customers/${id}`)).data,
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (values: CustomerInput) => api.patch(`/customers/${id}`, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Perubahan disimpan');
      navigate(ROUTES.customers.index);
    },
  });

  if (!detail.data) return <Skeleton className="h-96" />;

  const row = detail.data as CustomerInput & { id: string };

  return (
    <div>
      <PageHeader title={`Ubah ${row.name}`} />
      <CustomerForm
        mode="edit"
        defaultValues={row}
        submitting={mutation.isPending}
        onSubmit={(values) => {
          mutation.mutate(values as CustomerInput, {
            onError: (error) => {
              const err = error as unknown as NormalizedError;
              if (!applyServerErrors(err, () => undefined)) toast.error(err.message);
            },
          });
        }}
      />
    </div>
  );
}
