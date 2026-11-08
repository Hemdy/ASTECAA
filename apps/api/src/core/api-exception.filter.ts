import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { AppError } from './app-error.js';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const requestId = String(response.getHeader('X-Request-Id') ?? randomUUID());
    const failure = describeError(error);

    if (failure.status >= 500) {
      console.error(
        JSON.stringify({
          level: 'error',
          requestId,
          code: failure.code,
          errorType: error instanceof Error ? error.name : 'NonErrorThrown',
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }

    const payload: {
      error: {
        code: string;
        message: string;
        requestId: string;
        details?: unknown;
      };
    } = {
      error: {
        code: failure.code,
        message: failure.message,
        requestId,
      },
    };

    if (failure.details !== undefined) {
      payload.error.details = failure.details;
    }

    response.status(failure.status).json(payload);
  }
}

function describeError(error: unknown): {
  status: number;
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof AppError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof HttpException) {
    const status = error.getStatus();
    const response = error.getResponse();
    let code = status === 404 ? 'NOT_FOUND' : status === 400 ? 'INVALID_REQUEST' : 'HTTP_ERROR';
    let message = status >= 500 ? 'An unexpected error occurred.' : error.message;

    if (typeof response === 'object' && response !== null) {
      const resObj = response as Record<string, unknown>;
      if (typeof resObj['code'] === 'string') {
        code = resObj['code'];
      }
      if (typeof resObj['message'] === 'string') {
        message = resObj['message'];
      }
    }

    return { status, code, message };
  }

  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred.',
  };
}

