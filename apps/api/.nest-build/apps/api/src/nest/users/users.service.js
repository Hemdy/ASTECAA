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
import { and, eq } from "drizzle-orm";
import { appUsers, authIdentities, roles, userRoles, } from "../../../../../infrastructure/database/schema.js";
import { DatabaseService } from "../database/database.service.js";
let UsersService = class UsersService {
    database;
    constructor(database) {
        this.database = database;
    }
    async getActiveIdentity(subject, email, name) {
        const [identity] = await this.database.db
            .select({
            id: appUsers.id,
            email: appUsers.email,
            fullName: appUsers.fullName,
            phone: appUsers.phone,
        })
            .from(authIdentities)
            .innerJoin(appUsers, eq(appUsers.id, authIdentities.userId))
            .where(and(eq(authIdentities.issuer, new URL(process.env.BETTER_AUTH_URL).origin), eq(authIdentities.subject, subject), eq(appUsers.status, "active")))
            .limit(1);
        if (!identity) {
            return null;
        }
        const assignments = await this.database.db
            .select({ code: roles.code })
            .from(userRoles)
            .innerJoin(roles, eq(roles.id, userRoles.roleId))
            .where(eq(userRoles.userId, identity.id));
        const role = assignments.some((assignment) => assignment.code === "super_admin")
            ? "super_admin"
            : assignments.some((assignment) => assignment.code === "admin")
                ? "admin"
                : "alumni";
        return {
            id: identity.id,
            email: identity.email || email,
            full_name: identity.fullName ?? name,
            role,
            is_active: true,
            phone: identity.phone,
        };
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [DatabaseService])
], UsersService);
export { UsersService };
