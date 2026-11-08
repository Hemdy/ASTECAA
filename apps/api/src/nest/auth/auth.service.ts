import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import { createAstecAuth } from "../../auth/auth.ts";

@Injectable()
export class AuthService implements OnModuleDestroy {
  readonly configuration = createAstecAuth({
    get: (name) => process.env[name],
  });

  get handler() {
    return this.configuration.auth;
  }

  get allowedOrigins(): ReadonlySet<string> {
    return this.configuration.allowedOrigins;
  }

  getSession(headers: Parameters<typeof fromNodeHeaders>[0]) {
    return this.handler.api.getSession({ headers: fromNodeHeaders(headers) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.configuration.close();
  }
}
