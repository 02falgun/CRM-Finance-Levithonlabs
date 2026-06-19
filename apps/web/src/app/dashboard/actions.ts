'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { getServerSession } from '../../lib/server/session';

/**
 * Server Action: invalidate the cached dashboard data for the current tenant.
 * Client components can call this after a mutation (invoice/payment/customer)
 * so the next dashboard render is fresh without a hard reload.
 */
export async function refreshDashboard() {
  const session = await getServerSession();
  if (session) {
    revalidateTag(`dashboard:${session.tenant.id}`);
  }
}

/**
 * Server Action: revalidate an arbitrary dashboard route path after a mutation.
 */
export async function refreshPath(path: string) {
  revalidatePath(path);
}
