import 'server-only'
import { createSupabaseServiceClient } from '@/lib/db/server'
import {
  recordProductEvent,
  type ProductEventInput,
  type ProductEventRecorder,
} from './product-events'

/**
 * Record a product event from server code using the service client.
 * Fire-and-forget friendly: never throws (see {@link recordProductEvent}).
 */
export async function track(input: ProductEventInput) {
  const client = createSupabaseServiceClient() as unknown as ProductEventRecorder
  return recordProductEvent(client, input)
}
