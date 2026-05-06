// Gemini API key + client helpers.
//
// Reads the API key from localStorage first (set by Settings page) and falls
// back to `VITE_GEMINI_API_KEY` for dev environments. The client is constructed
// lazily; consumers should always use `getClient()` rather than caching it,
// because the key can change at runtime when the user updates Settings.

import { GoogleGenerativeAI } from "@google/generative-ai"

const KEY_STORAGE = "oppr-docs:gemini-key"

export function getApiKey(): string | null {
  try {
    const fromLs = localStorage.getItem(KEY_STORAGE)
    if (fromLs && fromLs.trim()) return fromLs.trim()
  } catch {
    // localStorage may be unavailable (SSR, hardened browsers) — fall through.
  }
  const envKey = import.meta.env.VITE_GEMINI_API_KEY
  if (envKey && envKey.trim()) return envKey.trim()
  return null
}

export function hasApiKey(): boolean {
  return getApiKey() !== null
}

export function getClient(): GoogleGenerativeAI {
  const key = getApiKey()
  if (!key) {
    throw new Error(
      "No Gemini API key configured. Set one in Settings or via VITE_GEMINI_API_KEY.",
    )
  }
  return new GoogleGenerativeAI(key)
}

// Model name constants — keep in one place so we can swap them centrally.
//
// gemini-embedding-2 supports flexible output dimensions (128–3072). We pin
// to 768 so existing chunk-vector storage and similarity math stay consistent.
// If you change EMBEDDING_DIM you must clear + re-embed every chunk.
export const EMBEDDING_MODEL = "gemini-embedding-2"
export const EMBEDDING_DIM = 768
export const CHAT_MODEL = "gemini-3.1-flash-lite-preview"
