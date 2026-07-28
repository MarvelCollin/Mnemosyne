import { useState, useEffect, useRef, useCallback } from "react"
import type { IAutoScroll, IAutoScrollControls } from "@/Interface/IAutoScroll"

const MIN_SPEED = 1
const MAX_SPEED = 10
const BASE_PX_PER_FRAME = 0.5

export function useAutoScroll(containerRef: React.RefObject<HTMLElement | null>): IAutoScrollControls {
  const [autoScroll, setAutoScroll] = useState<IAutoScroll>({
    isActive: false,
    speed: 3,
  })
  const animationRef = useRef<number>(0)

  const scroll = useCallback(() => {
    if (!containerRef.current) return
    containerRef.current.scrollTop += autoScroll.speed * BASE_PX_PER_FRAME
    animationRef.current = requestAnimationFrame(scroll)
  }, [autoScroll.speed, containerRef])

  useEffect(() => {
    if (autoScroll.isActive) {
      animationRef.current = requestAnimationFrame(scroll)
    } else {
      cancelAnimationFrame(animationRef.current)
    }
    return () => cancelAnimationFrame(animationRef.current)
  }, [autoScroll.isActive, scroll])

  const toggle = () => {
    setAutoScroll((prev) => ({ ...prev, isActive: !prev.isActive }))
  }

  const setSpeed = (speed: number) => {
    setAutoScroll((prev) => ({
      ...prev,
      speed: Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed)),
    }))
  }

  const increaseSpeed = () => {
    setAutoScroll((prev) => ({
      ...prev,
      speed: Math.min(MAX_SPEED, prev.speed + 1),
    }))
  }

  const decreaseSpeed = () => {
    setAutoScroll((prev) => ({
      ...prev,
      speed: Math.max(MIN_SPEED, prev.speed - 1),
    }))
  }

  return { autoScroll, toggle, setSpeed, increaseSpeed, decreaseSpeed }
}
