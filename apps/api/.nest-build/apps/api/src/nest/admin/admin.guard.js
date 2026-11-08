var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from "@nestjs/common";
import { AppError } from "../core/app-error.js";
import { AuthService } from "../auth/auth.service.js";
import { UsersService } from "../users/users.service.js";
let AdminGuard = class AdminGuard {
    auth;
    users;
    constructor(auth, users) {
        this.auth = auth;
        this.users = users;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const session = await this.auth.getSession(request.headers);
        if (!session) {
            throw new AppError(401, "Authentication is required.", "UNAUTHENTICATED");
        }
        const identity = await this.users.getActiveIdentity(session.user.id, session.user.email, session.user.name);
        if (!identity) {
            throw new AppError(403, "This account is not active.", "ACCOUNT_INACTIVE");
        }
        if (identity.role !== "admin" && identity.role !== "super_admin") {
            throw new AppError(403, "Administrator access is required.", "FORBIDDEN");
        }
        return true;
    }
};
AdminGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AuthService,
        UsersService])
], AdminGuard);
export { AdminGuard };
