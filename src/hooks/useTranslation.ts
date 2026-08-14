import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ITranslationSettings,
  ITranslationState,
  IDictionaryEntry,
} from "@/interfaces/ITranslation";
import { raceTranslate, getCached } from "@/lib/translate";
import {
  fetchDefinition,
  localizeDefinitions,
  isSingleWord,
  WordNotFoundError,
} from "@/lib/dictionary";

const SETTINGS_KEY = "mnemosyne-translation";
const DICT_KEY = "mnemosyne-dictionary";

const defaultSettings: ITranslationSettings = {
  sourceLanguage: "en",
  targetLanguage: "id",
  mode: "translate",
};

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

export function useTranslation(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [settings, setSettings] = useState<ITranslationSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  });
  const [popup, setPopup] = useState<ITranslationState | null>(null);
  const [dictionary, setDictionary] = useState<IDictionaryEntry[]>(() => {
    const raw = localStorage.getItem(DICT_KEY);
    return raw ? JSON.parse(raw) : [];
  });
  const abortRef = useRef<AbortController | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const popupRef = useRef(popup);
  popupRef.current = popup;
  const dictionaryRef = useRef(dictionary);
  dictionaryRef.current = dictionary;

  const updateSettings = useCallback(
    (updates: Partial<ITranslationSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const isSaved = useCallback(
    (source: string, targetLanguage: string, kind: "translation" | "definition") =>
      dictionaryRef.current.some(
        (e) =>
          e.source === source &&
          e.targetLanguage === targetLanguage &&
          (e.kind ?? "translation") === kind,
      ),
    [],
  );

  const runTranslate = useCallback(
    async (
      trimmed: string,
      position: { x: number; y: number },
      controller: AbortController,
      fellBackToTranslation: boolean,
    ) => {
      const { sourceLanguage, targetLanguage } = settingsRef.current;

      const base = {
        text: trimmed,
        definitions: null,
        position,
        mode: settingsRef.current.mode,
        fellBackToTranslation,
      };

      const dictEntry = dictionaryRef.current.find(
        (e) =>
          e.source === trimmed &&
          e.targetLanguage === targetLanguage &&
          (e.kind ?? "translation") === "translation",
      );
      if (dictEntry) {
        setPopup({
          ...base,
          translation: dictEntry.translation,
          isLoading: false,
          alreadySaved: true,
        });
        return;
      }

      const sessionHit = getCached(trimmed, sourceLanguage, targetLanguage);
      if (sessionHit) {
        setPopup({
          ...base,
          translation: sessionHit,
          isLoading: false,
          alreadySaved: false,
        });
        return;
      }

      setPopup({
        ...base,
        translation: null,
        isLoading: true,
        alreadySaved: false,
      });

      try {
        const result = await raceTranslate(
          trimmed,
          sourceLanguage,
          targetLanguage,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setPopup((prev) =>
            prev
              ? {
                  ...prev,
                  translation: result || "Translation failed",
                  isLoading: false,
                }
              : null,
          );
        }
      } catch (e) {
        if (isAbortError(e)) return;
        if (!controller.signal.aborted) {
          setPopup((prev) =>
            prev
              ? { ...prev, translation: "Translation failed", isLoading: false }
              : null,
          );
        }
      }
    },
    [],
  );

  const runDefine = useCallback(
    async (
      trimmed: string,
      position: { x: number; y: number },
      controller: AbortController,
    ): Promise<boolean> => {
      const { targetLanguage } = settingsRef.current;

      setPopup({
        text: trimmed,
        translation: null,
        definitions: null,
        isLoading: true,
        position,
        alreadySaved: false,
        mode: "define",
        fellBackToTranslation: false,
      });

      try {
        const entries = await fetchDefinition(trimmed, controller.signal);
        const localized = await localizeDefinitions(
          entries,
          targetLanguage,
          controller.signal,
        );
        if (controller.signal.aborted) return true;
        setPopup((prev) =>
          prev
            ? {
                ...prev,
                definitions: localized,
                isLoading: false,
                alreadySaved: isSaved(trimmed, targetLanguage, "definition"),
              }
            : null,
        );
        return true;
      } catch (e) {
        if (isAbortError(e) || controller.signal.aborted) return true;
        if (e instanceof WordNotFoundError) return false;
        setPopup((prev) =>
          prev
            ? {
                ...prev,
                translation: "Definition unavailable",
                isLoading: false,
              }
            : null,
        );
        return true;
      }
    },
    [isSaved],
  );

  const translate = useCallback(
    async (text: string, x: number, y: number) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const position = { x, y };
      const { mode } = settingsRef.current;

      if (mode === "define" && isSingleWord(trimmed)) {
        const handled = await runDefine(trimmed, position, controller);
        if (handled || controller.signal.aborted) return;
      }

      await runTranslate(trimmed, position, controller, mode === "define");
    },
    [runDefine, runTranslate],
  );

  const dismiss = useCallback(() => {
    abortRef.current?.abort();
    setPopup(null);
  }, []);

  const saveToDict = useCallback(() => {
    const p = popupRef.current;
    if (!p || p.isLoading || p.alreadySaved) return;

    const kind = p.definitions?.length ? "definition" : "translation";
    const value = p.definitions?.length
      ? p.definitions
          .map((d) => `(${d.partOfSpeech}) ${d.definition}`)
          .join(" · ")
      : p.translation;
    if (!value) return;

    const { sourceLanguage, targetLanguage } = settingsRef.current;
    setDictionary((prev) => {
      if (
        prev.some(
          (e) =>
            e.source === p.text &&
            e.targetLanguage === targetLanguage &&
            (e.kind ?? "translation") === kind,
        )
      )
        return prev;
      const next: IDictionaryEntry[] = [
        {
          source: p.text,
          translation: value,
          sourceLanguage: kind === "definition" ? "en" : sourceLanguage,
          targetLanguage,
          timestamp: Date.now(),
          kind,
        },
        ...prev,
      ];
      localStorage.setItem(DICT_KEY, JSON.stringify(next));
      return next;
    });
    setPopup((prev) => (prev ? { ...prev, alreadySaved: true } : null));
  }, []);

  const deleteDictEntry = useCallback((index: number) => {
    setDictionary((prev) => {
      const next = prev.filter((_, i) => i !== index);
      localStorage.setItem(DICT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearDictionary = useCallback(() => {
    setDictionary([]);
    localStorage.removeItem(DICT_KEY);
  }, []);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container || e.button !== 0) return;
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString();
        if (!text || !text.trim()) return;
        try {
          const range = selection?.getRangeAt(0);
          if (range && container.contains(range.commonAncestorContainer)) {
            translate(text, e.clientX, e.clientY);
          }
        } catch {
          /* no range */
        }
      }, 10);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef, translate]);

  useEffect(() => {
    if (!popup) return;

    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-translation-popup]"))
        dismiss();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popup, dismiss]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !popup) return;
    const handleScroll = (e: Event) => {
      const anchor = window.getSelection()?.anchorNode;
      if (!anchor || (e.target as Node).contains(anchor)) dismiss();
    };
    container.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });
    return () =>
      container.removeEventListener("scroll", handleScroll, { capture: true });
  }, [containerRef, popup, dismiss]);

  return {
    settings,
    updateSettings,
    popup,
    dismiss,
    saveToDict,
    dictionary,
    deleteDictEntry,
    clearDictionary,
  };
}
