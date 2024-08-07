'use server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

export const downloadUploadImage = async (url: string) => {
  const client = new S3Client({
    forcePathStyle: true,
    region: 'us-west-1',
    endpoint: 'https://lpjyyshuwnnkxmykaplr.supabase.co/storage/v1/s3',
    credentials: {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      accessKeyId: process.env.SERVICE_ID!,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      secretAccessKey: process.env.SERVICE_KEY!,
    },
  });

  const response = await fetch(url);
  const blob = await response.arrayBuffer();
  const fileEnding = url.split('.').pop();
  const uuid = nanoid();

  const key = `${uuid}.${fileEnding}`;
  const command = new PutObjectCommand({
    Bucket: 'recipe-images',
    Key: key,
    Body: Buffer.from(blob),
  });

  try {
    await client.send(command);
    const uploadUrl = `https://lpjyyshuwnnkxmykaplr.supabase.co/storage/v1/object/public/recipe-images/${key}`;

    return uploadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
  }

  return null;
};
