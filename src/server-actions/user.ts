'use server';
import { db } from '@/lib/db';
import { getUser } from './verify-credentials';

export const upsertUser = async () => {
    const user = await getUser();

    if (!user?.email) {
        return;
    }

    await db
        .insertInto('users')
        .values({
            email: user.email,
            name: user.name,
        })
        .onConflict((oc) =>
            oc.column('email').doUpdateSet({
                name: user.name,
            }),
        )
        .execute();
};
