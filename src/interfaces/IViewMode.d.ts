export type ViewMode = "single" | "dual"

export interface IViewModeControls {
  mode: ViewMode
  isDual: boolean
  toggle: () => void
}
