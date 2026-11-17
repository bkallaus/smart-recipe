import 'server-only';
import { db } from '@/lib/db';
import type { User } from '@/types/user';

/** Creates or refreshes the user's row and returns its id. */
export const upsertUserRow = async (user: User): Promise<string> => {
  const row = await db
    .insertInto('users')
    .values({ email: user.email, name: user.name })
    .onConflict((oc) => oc.column('email').doUpdateSet({ name: user.name }))
    .returning('id')
    .executeTakeFirstOrThrow();

  return row.id;
};
