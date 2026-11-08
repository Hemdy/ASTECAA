import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { AppError } from "./app-error.js";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const requestId = String(response.getHeader("X-Request-Id") ?? randomUUID());
    const failure = describeError(error);

    if (failure.status >= 500) {
      console.error(JSON.stringify({
        level: "error",
        requestId,
        code: failure.code,
        errorType: error instanceof Error ? error.name : "NonErrorThrown",
      }));
    }

    response.status(failure.status).json({
      error: { code: failure.code, message: failure.message, requestId },
    });
  }
}

function describeError(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof AppError) {
    return { status: error.status, code: error.code, message: error.message };
  }

  if (error instanceof HttpException) {
    const status = error.getStatus();
    const code = status === 404 ? "NOT_FOUND" : status === 400 ? "INVALID_REQUEST" : "HTTP_ERROR";
    return { status, code, message: status >= 500 ? "An unexpected error occurred." : error.message };
  }

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
  };
}
