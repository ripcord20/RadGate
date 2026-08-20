import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { queryClient, qk } from '@/lib/query';
import { useApp } from '@/providers/app-provider';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string | null;
}

export default function WhatsappTemplatePage() {
  const { can } = useApp();
  const { data } = useQuery({
    queryKey: qk.whatsapp('templates'),
    queryFn: async () => (await api.get<Template[]>('/whatsapp/templates')).data,
  });
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const create = useMutation({
    mutationFn: () => api.post('/whatsapp/templates', { name, content, category: category || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.whatsapp('templates') });
      setName('');
      setContent('');
      toast.success('Template disimpan');
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Gagal'),
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Template Pesan" />
      {can('whatsapp', 'create') && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah template</CardTitle>
          </CardHeader>
          <CardContent className="grid max-w-lg gap-3">
            <div>
              <Label>Nama</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Kategori</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="tagihan, pengingat..." />
            </div>
            <div>
              <Label>Isi</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Halo {{name}}..." />
            </div>
            <Button disabled={!name || !content || create.isPending} onClick={() => create.mutate()}>
              Simpan
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {data?.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="mb-1">{t.category ?? 'Umum'}</p>
              <p className="whitespace-pre-wrap text-foreground">{t.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
