import type { ITranslationSettings, IDictionaryEntry } from "@/interfaces/ITranslation"

const languages = [
  { code: "id", name: "Indonesian" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh-CN", name: "Chinese" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "ms", name: "Malay" },
]

interface TranslationSettingsProps {
  settings: ITranslationSettings
  onUpdate: (updates: Partial<ITranslationSettings>) => void
  isOpen: boolean
  onClose: () => void
  dictionary: IDictionaryEntry[]
  onDeleteEntry: (index: number) => void
  onClearDictionary: () => void
}

export function TranslationSettings({ settings, onUpdate, isOpen, onClose, dictionary, onDeleteEntry, onClearDictionary }: TranslationSettingsProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute inset-x-3 top-12 max-h-[70vh] overflow-y-auto rounded-md border bg-popover p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:top-14 sm:w-72"
        style={{ animation: "dialog-enter 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-sm font-semibold tracking-tight">Translation</h4>
        <p className="mt-1 text-xs text-muted-foreground">Select text in the PDF to translate</p>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">From</label>
            <select
              value={settings.sourceLanguage}
              onChange={(e) => onUpdate({ sourceLanguage: e.target.value })}
              className="mt-1 w-full rounded-sm border bg-transparent px-2 py-1.5 text-xs transition-colors focus:border-primary focus:outline-none"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">To</label>
            <select
              value={settings.targetLanguage}
              onChange={(e) => onUpdate({ targetLanguage: e.target.value })}
              className="mt-1 w-full rounded-sm border bg-transparent px-2 py-1.5 text-xs transition-colors focus:border-primary focus:outline-none"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {dictionary.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold tracking-tight">Dictionary ({dictionary.length})</h4>
              <button
                onClick={onClearDictionary}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 space-y-1.5">
              {dictionary.map((entry, i) => (
                <div key={`${entry.source}-${entry.timestamp}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">
                    <span className="text-foreground">{entry.source}</span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="text-foreground">{entry.translation}</span>
                  </span>
                  <button
                    onClick={() => onDeleteEntry(i)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
