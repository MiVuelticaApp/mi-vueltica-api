import ENV from "./env";

/**
 * Browser origins allowed by CORS. Native apps send no `Origin` header and are not affected.
 *
 * Read from `CORS_ORIGINS`, a comma-separated list of exact origins (scheme + host [+ port], no path,
 * no trailing slash), e.g. `https://mivueltica.app,https://www.mivueltica.app`. When it is unset or
 * empty: outside production the local dev servers below are allowed; in production no browser origin
 * is (fail closed), and a warning is logged at boot.
 */
const DEV_DEFAULT_ORIGINS = [
  "http://localhost:8081", // Expo web (Metro)
  "http://127.0.0.1:8081",
  "http://localhost:19006", // Expo web (legacy webpack port)
  "http://localhost:5173",
];

function parseOrigins(raw: string): string[] {
  const origins = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of origins) {
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw new Error(`CORS_ORIGINS has an invalid origin: "${entry}" (expected e.g. "https://mivueltica.app").`);
    }
    // `cors` compares the request's Origin header verbatim, so anything but a bare origin never matches.
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.origin !== entry) {
      throw new Error(
        `CORS_ORIGINS entries must be bare http(s) origins without path or trailing slash: "${entry}".`
      );
    }
  }

  return [...new Set(origins)];
}

function resolveOrigins(): string[] {
  const configured = parseOrigins(process.env.CORS_ORIGINS || "");
  if (configured.length > 0) return configured;

  if (ENV.NODE_ENV === "production") {
    console.warn("[cors] CORS_ORIGINS is empty: browser clients (web build) cannot call this API.");
    return [];
  }
  return DEV_DEFAULT_ORIGINS;
}

const origins = resolveOrigins();

export default origins;
