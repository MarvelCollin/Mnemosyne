import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCached, raceTranslate } from "@/lib/translate"

describe("translate", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("getCached", () => {
    it("returns null for uncached text", () => {
      expect(getCached("unknown", "en", "id")).toBeNull()
    })
  })

  describe("raceTranslate", () => {
    it("returns translation from fastest API", async () => {
      const mockResponse = (body: unknown, delay: number) =>
        new Promise<Response>((resolve) =>
          setTimeout(() => resolve(new Response(JSON.stringify(body), { status: 200 })), delay)
        )

      vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
        if (url.includes("googleapis")) {
          return mockResponse([[["halo", "hello"]]], 10)
        }
        return mockResponse({ responseData: { translatedText: "halo-mm" } }, 50)
      })

      const controller = new AbortController()
      const result = await raceTranslate("hello", "en", "id", controller.signal)
      expect(result).toBe("halo")
    })

    it("falls back to second API if first fails", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
        if (url.includes("googleapis")) {
          return Promise.resolve(new Response("error", { status: 500 }))
        }
        return Promise.resolve(
          new Response(JSON.stringify({ responseData: { translatedText: "halo-fallback" } }), { status: 200 })
        )
      })

      const controller = new AbortController()
      const result = await raceTranslate("hello-fallback", "en", "id", controller.signal)
      expect(result).toBe("halo-fallback")
    })

    it("caches result after successful translation", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify([[["cached-result", "cache-test"]]]), { status: 200 })
        )
      )

      const controller = new AbortController()
      await raceTranslate("cache-test", "en", "id", controller.signal)

      expect(getCached("cache-test", "en", "id")).toBe("cached-result")
    })

    it("returns cached result without fetch on second call", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify([[["repeat-result", "repeat"]]]), { status: 200 })
        )
      )

      const controller = new AbortController()
      await raceTranslate("repeat", "en", "id", controller.signal)
      fetchSpy.mockClear()

      const result = await raceTranslate("repeat", "en", "id", controller.signal)
      expect(result).toBe("repeat-result")
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("throws when both APIs fail", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(new Response("error", { status: 500 }))
      )

      const controller = new AbortController()
      await expect(
        raceTranslate("fail-both-" + Date.now(), "en", "id", controller.signal)
      ).rejects.toThrow("Translation failed")
    })

    it("uses different cache keys per language pair", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify([[["result-en-id"]]]), { status: 200 }))
        )
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify([[["result-en-fr"]]]), { status: 200 }))
        )
        .mockImplementation(() =>
          Promise.resolve(new Response(JSON.stringify([[["result-en-fr"]]]), { status: 200 }))
        )

      const controller = new AbortController()
      await raceTranslate("lang-test", "en", "id", controller.signal)
      await raceTranslate("lang-test", "en", "fr", controller.signal)

      expect(getCached("lang-test", "en", "id")).toBe("result-en-id")
      expect(getCached("lang-test", "en", "fr")).toBe("result-en-fr")
    })
  })
})
