import { Injectable } from "@nestjs/common";
import { createDatabase } from "../../db/database.ts";

@Injectable()
export class DatabaseService {
  readonly db = createDatabase(process.env.DATABASE_URL);
}
