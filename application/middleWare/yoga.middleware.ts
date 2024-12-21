import type { Context, MiddlewareHandler } from "hono";
import type { YogaServerInstance } from "graphql-yoga";

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
