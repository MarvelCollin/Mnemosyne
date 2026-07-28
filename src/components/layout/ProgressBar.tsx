import type { IProgressBarProps } from "@/interfaces/IProgressBar"

export function ProgressBar({ progress }: IProgressBarProps) {
  return (
    <div className="h-0.5 w-full shrink-0 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
