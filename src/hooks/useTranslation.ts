import { useState, useEffect, useCallback, useRef } from "react"
import type { ITranslationSettings, ITranslationState, IDictionaryEntry } from "@/interfaces/ITranslation"
import { raceTranslate, getCached } from "@/lib/translate"

const SETTINGS_KEY = "mnemosyne-translation"
const DICT_KEY = "mnemosyne-dictionary"

const defaultSettings: ITranslationSettings = {
  sourceLanguage: "en",
  targetLanguage: "id",
}

export function useTranslation(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [settings, setSettings] = useState<ITranslationSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  })
  const [popup, setPopup] = useState<ITranslationState | null>(null)
  const [dictionary, setDictionary] = useState<IDictionaryEntry[]>(() => {
    const raw = localStorage.getItem(DICT_KEY)
    return raw ? JSON.parse(raw) : []
  })
  const abortRef = useRef<AbortController | null>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const popupRef = useRef(popup)
  popupRef.current = popup
  const dictionaryRef = useRef(dictionary)
  dictionaryRef.current = dictionary

  const updateSettings = useCallback((updates: Partial<ITranslationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const translate = useCallback(async (text: string, x: number, y: number) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const { sourceLanguage, targetLanguage } = settingsRef.current

    const dictEntry = dictionaryRef.current.find(
      (e) => e.source === trimmed && e.targetLanguage === targetLanguage
    )
    if (dictEntry) {
      setPopup({ text: trimmed, translation: dictEntry.translation, isLoading: false, position: { x, y }, alreadySaved: true })
      return
    }

    const sessionHit = getCached(trimmed, sourceLanguage, targetLanguage)
    if (sessionHit) {
      setPopup({ text: trimmed, translation: sessionHit, isLoading: false, position: { x, y }, alreadySaved: false })
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setPopup({ text: trimmed, translation: null, isLoading: true, position: { x, y }, alreadySaved: false })

    try {
      const result = await raceTranslate(trimmed, sourceLanguage, targetLanguage, controller.signal)
      if (!controller.signal.aborted) {
        setPopup((prev) =>
          prev ? { ...prev, translation: result || "Translation failed", isLoading: false } : null
        )
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      if (!controller.signal.aborted) {
        setPopup((prev) => (prev ? { ...prev, translation: "Translation failed", isLoading: false } : null))
      }
    }
  }, [])

  const dismiss = useCallback(() => {
    abortRef.current?.abort()
    setPopup(null)
  }, [])

  const saveToDict = useCallback(() => {
    const p = popupRef.current
    if (!p || !p.translation || p.isLoading || p.alreadySaved) return
    const { sourceLanguage, targetLanguage } = settingsRef.current
    setDictionary((prev) => {
      if (prev.some((e) => e.source === p.text && e.targetLanguage === targetLanguage)) return prev
      const next: IDictionaryEntry[] = [
        { source: p.text, translation: p.translation!, sourceLanguage, targetLanguage, timestamp: Date.now() },
        ...prev,
      ]
      localStorage.setItem(DICT_KEY, JSON.stringify(next))
      return next
    })
    setPopup((prev) => prev ? { ...prev, alreadySaved: true } : null)
  }, [])

  const deleteDictEntry = useCallback((index: number) => {
    setDictionary((prev) => {
      const next = prev.filter((_, i) => i !== index)
      localStorage.setItem(DICT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearDictionary = useCallback(() => {
    setDictionary([])
    localStorage.removeItem(DICT_KEY)
  }, [])

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container || e.button !== 0) return
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString()
        if (!text || !text.trim()) return
        try {
          const range = selection?.getRangeAt(0)
          if (range && container.contains(range.commonAncestorContainer)) {
            translate(text, e.clientX, e.clientY)
          }
        } catch { /* no range */ }
      }, 10)
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [containerRef, translate])

  useEffect(() => {
    if (!popup) return

    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-translation-popup]")) dismiss()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss()
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick)
      document.addEventListener("keydown", handleKeyDown)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [popup, dismiss])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !popup) return
    const handleScroll = (e: Event) => {
      const anchor = window.getSelection()?.anchorNode
      if (!anchor || (e.target as Node).contains(anchor)) dismiss()
    }
    container.addEventListener("scroll", handleScroll, { passive: true, capture: true })
    return () => container.removeEventListener("scroll", handleScroll, { capture: true })
  }, [containerRef, popup, dismiss])

  return { settings, updateSettings, popup, dismiss, saveToDict, dictionary, deleteDictEntry, clearDictionary }
}
