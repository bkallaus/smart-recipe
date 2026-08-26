import { redirect } from 'next/navigation';
import { hasAccess } from '@/server-actions/verify-credentials';

/**
 * Sends signed-out visitors to the login screen, remembering where they were
 * headed so they land there after signing in.
 */
export const requireAccess = async (returnTo: string) => {
  if (await hasAccess()) {
    return;
  }

  redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
};
