var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { createAstecAuth } from "../../auth/auth.js";
let AuthService = class AuthService {
    configuration = createAstecAuth({
        get: (name) => process.env[name],
    });
    get handler() {
        return this.configuration.auth;
    }
    get allowedOrigins() {
        return this.configuration.allowedOrigins;
    }
    getSession(headers) {
        return this.handler.api.getSession({ headers: fromNodeHeaders(headers) });
    }
    async onModuleDestroy() {
        await this.configuration.close();
    }
};
AuthService = __decorate([
    Injectable()
], AuthService);
export { AuthService };
