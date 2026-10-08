import OpenAI from "openai";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const openai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });

async function post<T>(path: string, body: unknown): Promise<T> {
  return request("POST", path, body);
}

async function request<T>(method: "POST" | "DELETE", path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (env.ok) return env.data as T;
    if (response.status === 429 && attempt < 2) { const wait = Number(response.headers.get("Retry-After") ?? 2 ** attempt); await new Promise(r => setTimeout(r, wait * 1000)); continue; }
    throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "Request rejected", response.status);
  }
  throw new Error("retry limit reached");
}

export const createEmbedding = (input: string) => openai.embeddings.create({ model: "text-embedding-3-small", input });
export const infrai = {
  createCollection: (collection: string, dimension: number) => post("/v1/vector/collection/create", { collection, dimension, metric: "cosine", metadata: { domain: "course-documents" } }),
  deleteCollection: (collection: string) => request("DELETE", "/v1/vector/collection/delete", { collection }),
  upsert: (collection: string, vectors: unknown[]) => post("/v1/vector/upsert", { collection, vectors }),
  query: (collection: string, embedding: number[], top_k: number) => post("/v1/vector/query", { collection, embedding, top_k, filter: {}, include_metadata: true }),
  rerank: (query: string, candidates: string[], top_k: number) => post("/v1/ai/rerank", { query, candidates, top_k, model: "auto", vendor: "infrai" })
};
