import { Client, type ClientBase } from 'pg';

let client: ClientBase;

export const getClient = async (): Promise<ClientBase> => {
  if (client) {
    return client;
  }

  client = new Client();

  await client.connect();

  return client;
};
