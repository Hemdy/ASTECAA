var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../admin/admin.guard.js";
import { AppError } from "../core/app-error.js";
import { EventsService } from "./events.service.js";
let AdminEventsController = class AdminEventsController {
    events;
    constructor(events) {
        this.events = events;
    }
    list() {
        return this.events.listAdmin();
    }
    async create(body) {
        try {
            return await this.events.create(body);
        }
        catch (error) {
            throw mapEventConflict(error);
        }
    }
    async update(id, body) {
        try {
            return await this.events.update(id, body);
        }
        catch (error) {
            throw mapEventConflict(error);
        }
    }
    async delete(id) {
        await this.events.delete(id);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminEventsController.prototype, "list", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminEventsController.prototype, "create", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminEventsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminEventsController.prototype, "delete", null);
AdminEventsController = __decorate([
    Controller("api/admin/v1/events"),
    UseGuards(AdminGuard),
    __metadata("design:paramtypes", [EventsService])
], AdminEventsController);
export { AdminEventsController };
function mapEventConflict(error) {
    if (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505") {
        return new AppError(409, "An event with this title already exists.", "EVENT_SLUG_CONFLICT");
    }
    return error;
}
