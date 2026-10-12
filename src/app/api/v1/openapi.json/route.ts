import { buildOpenApiSpec } from '@/helpers/openapi';

export async function GET(request: Request) {
  return Response.json(buildOpenApiSpec(new URL(request.url).origin));
}
