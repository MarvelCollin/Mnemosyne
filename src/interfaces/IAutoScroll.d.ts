export interface IAutoScroll {
  isActive: boolean
  speed: number
}

export interface IAutoScrollControls {
  autoScroll: IAutoScroll
  toggle: () => void
  setSpeed: (speed: number) => void
  increaseSpeed: () => void
  decreaseSpeed: () => void
  pause: () => void
  resume: () => void
}
