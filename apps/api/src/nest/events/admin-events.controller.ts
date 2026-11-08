import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../admin/admin.guard.js";
import { AppError } from "../core/app-error.js";
import { EventsService } from "./events.service.js";

@Controller("api/admin/v1/events")
@UseGuards(AdminGuard)
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.listAdmin();
  }

  @Post()
  async create(@Body() body: unknown) {
    try {
      return await this.events.create(body);
    } catch (error) {
      throw mapEventConflict(error);
    }
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: unknown) {
    try {
      return await this.events.update(id, body);
    } catch (error) {
      throw mapEventConflict(error);
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string): Promise<void> {
    await this.events.delete(id);
  }
}

function mapEventConflict(error: unknown): unknown {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return new AppError(
      409,
      "An event with this title already exists.",
      "EVENT_SLUG_CONFLICT",
    );
  }
  return error;
}
