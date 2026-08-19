import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query';
import { AppProvider } from '@/providers/app-provider';
import { AppRoutes } from '@/routes';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* AppProvider berada di dalam BrowserRouter karena guard route bergantung padanya. */}
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
