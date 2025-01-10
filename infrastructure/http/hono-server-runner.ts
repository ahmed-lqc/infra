// hono-server-runner.ts
import { Inject, Injectable, Scope, Scoped } from "di-wise";
import { Hono, type MiddlewareHandler } from "hono";
import type { ServerRunner } from "./server-runner.ts";
import { ServerRunnerToken } from "./tokens.ts";
import {
  type ILoggerService,
  LoggerServiceToken,
} from "../common/logger/logger.types.ts";

@Injectable<HonoServerRunner>(ServerRunnerToken)
@Scoped(Scope.Container)
export class HonoServerRunner implements ServerRunner {
  private app = new Hono();
  @Inject(LoggerServiceToken)
  private logger!: ILoggerService;

  setRoute(path: string, handler: MiddlewareHandler): void {
    // We assume handler is a function that Hono can handle, e.g.
    // something like:
    //   (c) => new Response(...)
    // or the yoga's fetch as a middleware
    this.app.all(path, handler);
  }
  async start(port: number): Promise<void> {
    this.logger.log(`HonoServerRunner listening on port ${port}`);
    await Deno.serve({ port }, this.app.fetch);
  }
}
