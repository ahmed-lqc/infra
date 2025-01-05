import type { MiddlewareHandler } from "hono/types";

/**
 * Describes a server runner that can register routes
 * and start listening on a given port.
 */
export interface ServerRunner {
  /**
   * Sets up a route. Typically used for subgraphs or any path logic.
   * @param path - The path or route pattern to match.
   * @param handler - Something like a yoga fetch or specialized middleware.
   */
  setRoute(path: string, handler: MiddlewareHandler): void;

  /**
   * Starts the server on a specified port.
   */
  start(port: number): Promise<void>;
}
