import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export function Label({
  className,
  required,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium leading-none', className)}
      {...props}
    >
      {props.children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </LabelPrimitive.Root>
  );
}

/** Menampilkan pesan galat validasi di bawah field, kosong kalau tidak ada galat. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
