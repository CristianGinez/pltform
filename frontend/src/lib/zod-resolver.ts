/**
 * Zod 4 + @hookform/resolvers v5 compatibility shim.
 *
 * In Zod 4, z.coerce.number() has input type `unknown`.
 * resolvers v5 uses the schema's INPUT type as TFieldValues, which causes
 * a type mismatch when useForm<T> is called with the OUTPUT type.
 * This wrapper casts the resolver to the output type so forms type-check correctly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { zodResolver as _zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodResolver<T extends Record<string, any>>(schema: any): Resolver<T> {
  return _zodResolver(schema) as unknown as Resolver<T>;
}
