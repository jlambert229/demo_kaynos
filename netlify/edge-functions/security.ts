import type { Context, Config } from "@netlify/edge-functions";

const BLOCKED_COUNTRIES = new Set([
  "RU", // Russia
  "CN", // China
  "KP", // North Korea
  "IR", // Iran
  "BY", // Belarus
  "SY", // Syria
  "CU", // Cuba
]);

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-XSS-Protection": "1; mode=block",
};

export default async (req: Request, context: Context) => {
  const countryCode = context.geo?.country?.code;

  if (countryCode && BLOCKED_COUNTRIES.has(countryCode)) {
    return new Response("Access denied", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const response = await context.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
};

export const config: Config = {
  path: "/*",
};
