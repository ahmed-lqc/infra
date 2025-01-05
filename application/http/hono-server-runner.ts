// hono-server-runner.ts
import { Injectable, Scope, Scoped } from "di-wise";
import { Hono, type MiddlewareHandler } from "hono";
import type { ServerRunner } from "./server-runner.ts";
import { ServerRunnerToken } from "./tokens.ts";

@Injectable<HonoServerRunner>(ServerRunnerToken)
@Scoped(Scope.Container)
export class HonoServerRunner implements ServerRunner {
  private app = new Hono();

  setRoute(path: string, handler: MiddlewareHandler): void {
    // We assume handler is a function that Hono can handle, e.g.
    // something like:
    //   (c) => new Response(...)
    // or the yoga's fetch as a middleware
    this.app.all(path, handler);
  }
  async start(port: number): Promise<void> {
    console.log(`HonoServerRunner listening on port ${port}`);
    await Deno.serve({ port }, this.app.fetch);
  }
}
