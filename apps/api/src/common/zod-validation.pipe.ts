import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Memvalidasi body memakai skema Zod yang sama dengan yang dipakai form di frontend.
 * Bentuk galatnya sengaja `{ field: [pesan] }` supaya frontend bisa memetakannya langsung
 * ke field react-hook-form lewat `applyServerErrors`.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || '_';
      (errors[path] ??= []).push(issue.message);
    }

    throw new BadRequestException({
      statusCode: 400,
      message: 'Data yang dikirim tidak valid',
      errors,
    });
  }
}
