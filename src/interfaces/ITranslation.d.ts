export interface ITranslationSettings {
  sourceLanguage: string
  targetLanguage: string
}

export interface ITranslationState {
  text: string
  translation: string | null
  isLoading: boolean
  position: { x: number; y: number }
  alreadySaved: boolean
}

export interface IDictionaryEntry {
  source: string
  translation: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
}
