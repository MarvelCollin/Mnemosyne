import { raceTranslate } from "./translate"
import type { IDefinition } from "@/interfaces/ITranslation"

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"
const MAX_MEANINGS = 3

const definitionCache = new Map<string, IDefinition[]>()

export class WordNotFoundError extends Error {
  constructor(word: string) {
    super(`No definition found for "${word}"`)
    this.name = "WordNotFoundError"
  }
}

export function normalizeWord(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}]+/u, "")
    .replace(/[^\p{L}]+$/u, "")
}

export function isSingleWord(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && !/\s/.test(trimmed)
}

export function getCachedDefinition(word: string): IDefinition[] | null {
  return definitionCache.get(normalizeWord(word)) ?? null
}

function parseEntries(data: unknown): IDefinition[] {
  if (!Array.isArray(data)) return []

  const results: IDefinition[] = []
  const seenPartsOfSpeech = new Set<string>()

  for (const entry of data) {
    for (const meaning of entry?.meanings ?? []) {
      const partOfSpeech: string | undefined = meaning?.partOfSpeech
      const first = meaning?.definitions?.[0]
      if (!partOfSpeech || !first?.definition) continue
      if (seenPartsOfSpeech.has(partOfSpeech)) continue

      seenPartsOfSpeech.add(partOfSpeech)
      results.push({
        partOfSpeech,
        definition: first.definition,
        example: first.example || undefined,
      })
      if (results.length >= MAX_MEANINGS) return results
    }
  }

  return results
}

export async function fetchDefinition(
  word: string,
  signal: AbortSignal
): Promise<IDefinition[]> {
  const normalized = normalizeWord(word)
  if (!normalized) throw new WordNotFoundError(word)

  const cached = definitionCache.get(normalized)
  if (cached) return cached

  const res = await fetch(`${API_BASE}/${encodeURIComponent(normalized)}`, { signal })
  if (res.status === 404) throw new WordNotFoundError(normalized)
  if (!res.ok) throw new Error(`Dictionary: ${res.status}`)

  const definitions = parseEntries(await res.json())
  if (definitions.length === 0) throw new WordNotFoundError(normalized)

  definitionCache.set(normalized, definitions)
  return definitions
}

async function translateOrKeep(
  text: string,
  targetLanguage: string,
  signal: AbortSignal
): Promise<string> {
  try {
    return (await raceTranslate(text, "en", targetLanguage, signal)) || text
  } catch {
    return text
  }
}

export async function localizeDefinitions(
  definitions: IDefinition[],
  targetLanguage: string,
  signal: AbortSignal
): Promise<IDefinition[]> {
  if (targetLanguage === "en") return definitions

  return Promise.all(
    definitions.map(async (entry) => ({
      ...entry,
      definition: await translateOrKeep(entry.definition, targetLanguage, signal),
      example: entry.example
        ? await translateOrKeep(entry.example, targetLanguage, signal)
        : undefined,
    }))
  )
}
