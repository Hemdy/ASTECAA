export function logRequest(
  requestId: string,
  method: string,
  path: string,
  status: number,
  durationMs: number,
): void {
  console.log(
    JSON.stringify({
      level: status >= 500 ? 'error' : 'info',
      event: 'http.request',
      requestId,
      method,
      path,
      status,
      durationMs,
    }),
  );
}
