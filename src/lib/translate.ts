const sessionCache = new Map<string, string>()

function cacheKey(text: string, source: string, target: string): string {
  return `${source}|${target}|${text}`
}

export function getCached(text: string, source: string, target: string): string | null {
  return sessionCache.get(cacheKey(text, source, target)) ?? null
}

function setCache(text: string, source: string, target: string, translation: string) {
  sessionCache.set(cacheKey(text, source, target), translation)
}

async function googleTranslate(
  text: string,
  source: string,
  target: string,
  signal: AbortSignal
): Promise<string> {
  const encoded = encodeURIComponent(text)
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encoded}`,
    { signal }
  )
  if (!res.ok) throw new Error(`Google: ${res.status}`)
  const data = await res.json()
  const parts: string[] = []
  for (const segment of data[0]) {
    if (segment[0]) parts.push(segment[0])
  }
  return parts.join("") || text
}

async function myMemoryTranslate(
  text: string,
  source: string,
  target: string,
  signal: AbortSignal
): Promise<string> {
  const encoded = encodeURIComponent(text)
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${source}|${target}`,
    { signal }
  )
  if (!res.ok) throw new Error(`MyMemory: ${res.status}`)
  const data = await res.json()
  return data.responseData?.translatedText ?? ""
}

export async function raceTranslate(
  text: string,
  source: string,
  target: string,
  signal: AbortSignal
): Promise<string> {
  const cached = getCached(text, source, target)
  if (cached) return cached

  const result = await Promise.any([
    googleTranslate(text, source, target, signal),
    myMemoryTranslate(text, source, target, signal),
  ]).catch(() => {
    throw new Error("Translation failed")
  })

  if (result) setCache(text, source, target, result)
  return result
}
