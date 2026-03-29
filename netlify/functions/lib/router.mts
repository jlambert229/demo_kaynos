import { json } from "./middleware.mts";

type RouteHandler = (req: Request, ctx: RouteContext) => Promise<Response> | Response;

export interface RouteContext {
  params: Record<string, string>;
  url: URL;
}

interface Route {
  method: string;
  pattern: string;
  handler: RouteHandler;
}

export function createRouter(basePath: string) {
  const routes: Route[] = [];

  function addRoute(method: string, pattern: string, handler: RouteHandler) {
    routes.push({ method, pattern, handler });
  }

  return {
    get: (pattern: string, handler: RouteHandler) => addRoute("GET", pattern, handler),
    post: (pattern: string, handler: RouteHandler) => addRoute("POST", pattern, handler),
    patch: (pattern: string, handler: RouteHandler) => addRoute("PATCH", pattern, handler),
    delete: (pattern: string, handler: RouteHandler) => addRoute("DELETE", pattern, handler),
    put: (pattern: string, handler: RouteHandler) => addRoute("PUT", pattern, handler),

    handle(req: Request): { handler: RouteHandler; ctx: RouteContext } | null {
      const url = new URL(req.url);
      const path = url.pathname.replace(basePath, "") || "/";

      for (const route of routes) {
        if (route.method !== req.method) continue;

        const params = matchPath(route.pattern, path);
        if (params !== null) {
          return { handler: route.handler, ctx: { params, url } };
        }
      }
      return null;
    },
  };
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  if (pattern === path) return {};

  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function withErrorHandling(
  router: ReturnType<typeof createRouter>,
  label: string,
) {
  return async (req: Request): Promise<Response> => {
    try {
      const match = router.handle(req);
      if (!match) return json({ error: "Not found" }, 404);
      return await match.handler(req, match.ctx);
    } catch (err: any) {
      if (err.message === "Not authenticated") return json({ error: "Not authenticated" }, 401);
      if (err.message === "Forbidden") return json({ error: "Forbidden" }, 403);
      if (err.name === "ValidationError") return json({ error: err.message }, 400);
      console.error(`${label} error:`, err);
      return json({ error: "Internal server error" }, 500);
    }
  };
}
