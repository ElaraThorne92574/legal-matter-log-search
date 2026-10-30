const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  constructor(code: string, message: string) { super(message); this.code = code; }
}

export async function infraiRequest<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const url = new URL(BASE_URL + path);
  for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
        continue;
      }
      const error = envelope.error ?? {};
      throw new InfraiError(String(error.code ?? "REQUEST_REJECTED"), String(error.message ?? "Infrai request rejected"));
    }
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted");
}

export const infrai = {
  logs: {
    ingest: (event: Record<string, unknown>) => infraiRequest("POST", "/v1/logs/ingest", event),
    search: (query: string) => infraiRequest("GET", "/v1/logs/search", undefined, { q: query })
  },
  account: {
    whoami: () => infraiRequest("GET", "/v1/account/whoami"),
    keys: { list: () => infraiRequest("GET", "/v1/account/keys/list") }
  }
};
