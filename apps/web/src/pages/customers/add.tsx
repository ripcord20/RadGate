import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomerInput } from '@radgate/shared';
import { ROUTES } from '@radgate/shared';
import { api, applyServerErrors, type NormalizedError } from '@/lib/api';
import { queryClient } from '@/lib/query';
import { PageHeader } from '@/components/page-header';
import { CustomerForm } from '@/features/customers/customer-form';

export default function CustomerAddPage() {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (values: CustomerInput) => api.post('/customers', values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Pelanggan disimpan');
      navigate(ROUTES.customers.index);
    },
  });

  return (
    <div>
      <PageHeader title="Tambah Pelanggan" quota="customers" />
      <CustomerForm
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
