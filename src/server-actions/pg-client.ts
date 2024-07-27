import pg from 'pg';

const { Client } = pg;

let client: typeof Client;

export const getClient = async (): typeof Client => {
    if (client) {
        return client;
    }

    client = new Client();

    await client.connect();

    return client;
};
