export function jsonResponse(
  data: unknown,
  status = 200,
  headers: HeadersInit = {}
): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}
