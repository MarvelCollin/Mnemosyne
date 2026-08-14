import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  fetchDefinition,
  localizeDefinitions,
  normalizeWord,
  isSingleWord,
  getCachedDefinition,
  WordNotFoundError,
} from "@/lib/dictionary"

function dictionaryResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }))
}

const entryFor = (word: string) => [
  {
    word,
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [{ definition: "a written work", example: "a good book" }],
      },
      {
        partOfSpeech: "verb",
        definitions: [{ definition: "to reserve something" }],
      },
    ],
  },
]

describe("dictionary", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("normalizeWord", () => {
    it("lowercases and strips surrounding punctuation", () => {
      expect(normalizeWord('  "Book," ')).toBe("book")
    })

    it("returns empty string for punctuation only", () => {
      expect(normalizeWord("--")).toBe("")
    })
  })

  describe("isSingleWord", () => {
    it("accepts one word and rejects phrases", () => {
      expect(isSingleWord("book")).toBe(true)
      expect(isSingleWord("open book")).toBe(false)
      expect(isSingleWord("   ")).toBe(false)
    })
  })

  describe("fetchDefinition", () => {
    it("parses one definition per part of speech", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        dictionaryResponse(entryFor("parse-test"))
      )

      const controller = new AbortController()
      const result = await fetchDefinition("Parse-Test", controller.signal)

      expect(result).toEqual([
        {
          partOfSpeech: "noun",
          definition: "a written work",
          example: "a good book",
        },
        {
          partOfSpeech: "verb",
          definition: "to reserve something",
          example: undefined,
        },
      ])
    })

    it("throws WordNotFoundError on 404", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        dictionaryResponse({ title: "No Definitions Found" }, 404)
      )

      const controller = new AbortController()
      await expect(
        fetchDefinition("notaword-404", controller.signal)
      ).rejects.toBeInstanceOf(WordNotFoundError)
    })

    it("throws WordNotFoundError when the word has no letters", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const controller = new AbortController()

      await expect(fetchDefinition("...", controller.signal)).rejects.toBeInstanceOf(
        WordNotFoundError
      )
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("serves repeat lookups from cache", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation(() => dictionaryResponse(entryFor("cache-word")))

      const controller = new AbortController()
      await fetchDefinition("cache-word", controller.signal)
      fetchSpy.mockClear()

      const second = await fetchDefinition("cache-word", controller.signal)
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(second[0].definition).toBe("a written work")
      expect(getCachedDefinition("Cache-Word")).not.toBeNull()
    })
  })

  describe("localizeDefinitions", () => {
    const definitions = [{ partOfSpeech: "noun", definition: "a written work" }]

    it("skips translation when the target language is English", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const controller = new AbortController()

      const result = await localizeDefinitions(definitions, "en", controller.signal)

      expect(result).toBe(definitions)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("translates the definition into the target language", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify([[["karya tulis", "a written work"]]]), {
            status: 200,
          })
        )
      )

      const controller = new AbortController()
      const result = await localizeDefinitions(definitions, "id", controller.signal)

      expect(result[0].definition).toBe("karya tulis")
      expect(result[0].partOfSpeech).toBe("noun")
    })

    it("keeps the English text when translation fails", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(new Response("error", { status: 500 }))
      )

      const controller = new AbortController()
      const result = await localizeDefinitions(
        [{ partOfSpeech: "noun", definition: "untranslatable-" + Date.now() }],
        "id",
        controller.signal
      )

      expect(result[0].definition).toContain("untranslatable-")
    })
  })
})
