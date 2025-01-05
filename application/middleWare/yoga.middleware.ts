import type { Context, MiddlewareHandler } from "hono";
import type { YogaServerInstance } from "graphql-yoga";

/**
 * Middleware function that handles requests to a GraphQL Yoga server using the Hono framework.
 *
 * This middleware function is responsible for parsing the incoming request, extracting the necessary
 * information (method, URL, headers, and body), and then forwarding the request to the GraphQL Yoga
 * server for processing.
 *
 * @param yoga - The GraphQL Yoga server instance to use for handling the request.
 * @returns A Hono middleware function that can be used in a Hono application.
 */
export function honoYogaMiddleware(
  yoga: YogaServerInstance<
    Record<string | number | symbol, never>,
    Record<string | number | symbol, never>
  >,
): MiddlewareHandler {
  return async (c: Context) => {
    const { req } = c;
    const method = req.method;

    // Parse the request URL
    const url = new URL(req.url);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.header())) {
      headers.set(key, value);
    }

    let body: BodyInit | undefined;
    if (method !== "GET") {
      // For POST/PUT requests (queries and mutations), read the body
      const bodyText = await req.text();
      body = bodyText;
    } else {
      // For GET requests (likely subscriptions), modify the pathname to include '/stream'
      // This keeps query parameters intact since they are separate fields of the URL object.
      url.pathname = url.pathname + "/stream";
    }

    const fetchRequest = new Request(url.toString(), {
      method,
      headers,
      body,
    });

    return await yoga.fetch(fetchRequest);
  };
}
