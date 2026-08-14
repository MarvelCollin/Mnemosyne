export type TranslationMode = "translate" | "define"

export interface ITranslationSettings {
  sourceLanguage: string
  targetLanguage: string
  mode: TranslationMode
}

export interface IDefinition {
  partOfSpeech: string
  definition: string
  example?: string
}

export interface ITranslationState {
  text: string
  translation: string | null
  definitions: IDefinition[] | null
  isLoading: boolean
  position: { x: number; y: number }
  alreadySaved: boolean
  mode: TranslationMode
  fellBackToTranslation: boolean
}

export interface IDictionaryEntry {
  source: string
  translation: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
  kind?: "translation" | "definition"
}
