'use server';
import { getClient } from './pg-client';
import { getUser } from './verify-credentials';

export const upsertUser = async () => {
    const user = await getUser();

    if (!user) {
        return;
    }

    const client = await getClient();

    await client.query(
        'INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE set name = $2',
        [user.email, user.name],
    );
};
