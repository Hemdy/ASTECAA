var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "../database/database.service.js";
let HealthController = class HealthController {
    database;
    constructor(database) {
        this.database = database;
    }
    health() {
        return { status: "ok" };
    }
    async ready() {
        await this.database.db.execute(sql `select 1`);
        return { status: "ready" };
    }
};
__decorate([
    Get("health"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "health", null);
__decorate([
    Get("ready"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
HealthController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [DatabaseService])
], HealthController);
export { HealthController };
