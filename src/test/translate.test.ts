import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCached, raceTranslate } from "@/lib/translate"

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  return input instanceof URL ? input.toString() : input.url
}

describe("translate", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("getCached", () => {
    it("returns null for uncached text", () => {
      expect(getCached("unknown", "id")).toBeNull()
    })
  })

  describe("raceTranslate", () => {
    it("returns translation from fastest API", async () => {
      const mockResponse = (body: unknown, delay: number) =>
        new Promise<Response>((resolve) =>
          setTimeout(() => resolve(new Response(JSON.stringify(body), { status: 200 })), delay)
        )

      vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        if (urlOf(input).includes("googleapis")) {
          return mockResponse([[["halo", "hello"]]], 10)
        }
        return mockResponse({ responseData: { translatedText: "halo-mm" } }, 50)
      })

      const controller = new AbortController()
      const result = await raceTranslate("hello", "id", controller.signal)
      expect(result).toBe("halo")
    })

    it("asks both APIs to detect the source language", async () => {
      const seen: string[] = []
      vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        seen.push(urlOf(input))
        return Promise.resolve(
          new Response(JSON.stringify([[["selamat pagi", "guten morgen"]]]), { status: 200 })
        )
      })

      const controller = new AbortController()
      await raceTranslate("guten morgen", "id", controller.signal)

      expect(seen.some((url) => url.includes("sl=auto"))).toBe(true)
      expect(seen.some((url) => url.includes("langpair=Autodetect"))).toBe(true)
    })

    it("falls back to second API if first fails", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
        if (urlOf(input).includes("googleapis")) {
          return Promise.resolve(new Response("error", { status: 500 }))
        }
        return Promise.resolve(
          new Response(JSON.stringify({ responseData: { translatedText: "halo-fallback" } }), { status: 200 })
        )
      })

      const controller = new AbortController()
      const result = await raceTranslate("hello-fallback", "id", controller.signal)
      expect(result).toBe("halo-fallback")
    })

    it("caches result after successful translation", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify([[["cached-result", "cache-test"]]]), { status: 200 })
        )
      )

      const controller = new AbortController()
      await raceTranslate("cache-test", "id", controller.signal)

      expect(getCached("cache-test", "id")).toBe("cached-result")
    })

    it("returns cached result without fetch on second call", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify([[["repeat-result", "repeat"]]]), { status: 200 })
        )
      )

      const controller = new AbortController()
      await raceTranslate("repeat", "id", controller.signal)
      fetchSpy.mockClear()

      const result = await raceTranslate("repeat", "id", controller.signal)
      expect(result).toBe("repeat-result")
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it("throws when both APIs fail", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(() =>
        Promise.resolve(new Response("error", { status: 500 }))
      )

      const controller = new AbortController()
      await expect(
        raceTranslate("fail-both-" + Date.now(), "id", controller.signal)
      ).rejects.toThrow("Translation failed")
    })

    it("uses different cache keys per target language", async () => {
      vi.spyOn(globalThis, "fetch")
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify([[["result-id"]]]), { status: 200 }))
        )
        .mockImplementationOnce(() =>
          Promise.resolve(new Response(JSON.stringify([[["result-fr"]]]), { status: 200 }))
        )
        .mockImplementation(() =>
          Promise.resolve(new Response(JSON.stringify([[["result-fr"]]]), { status: 200 }))
        )

      const controller = new AbortController()
      await raceTranslate("lang-test", "id", controller.signal)
      await raceTranslate("lang-test", "fr", controller.signal)

      expect(getCached("lang-test", "id")).toBe("result-id")
      expect(getCached("lang-test", "fr")).toBe("result-fr")
    })
  })
})
