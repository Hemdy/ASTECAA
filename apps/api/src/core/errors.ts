export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    status: number,
    message: string,
    code: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function errorResponse(error: unknown, requestId: string): Response {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(500, 'An unexpected error occurred.', 'INTERNAL_ERROR');

  if (apiError.status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      requestId,
      code: apiError.code,
      errorType: error instanceof Error ? error.name : 'NonErrorThrown',
    }));
  }

  return Response.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        requestId,
      },
    },
    { status: apiError.status }
  );
}
