var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch, HttpException, } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AppError } from "./app-error.js";
let ApiExceptionFilter = class ApiExceptionFilter {
    catch(error, host) {
        const context = host.switchToHttp();
        const request = context.getRequest();
        const response = context.getResponse();
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
};
ApiExceptionFilter = __decorate([
    Catch()
], ApiExceptionFilter);
export { ApiExceptionFilter };
function describeError(error) {
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
