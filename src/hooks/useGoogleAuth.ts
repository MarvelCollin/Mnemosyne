import { useState, useEffect, useCallback } from "react"
import {
  isConfigured,
  isGoogleLoaded,
  initTokenClient,
  requestAccessToken,
  signOut as authSignOut,
  fetchUserInfo,
  getAccessToken,
  type GoogleUser,
} from "@/lib/googleAuth"

interface UseGoogleAuthReturn {
  isConfigured: boolean
  isReady: boolean
  isSignedIn: boolean
  isLoading: boolean
  user: GoogleUser | null
  accessToken: string | null
  error: string | null
  signIn: () => void
  signOut: () => void
  clearError: () => void
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isReady, setIsReady] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured()) return

    const checkGoogleLoaded = () => {
      if (isGoogleLoaded()) {
        const initialized = initTokenClient(
          async (token) => {
            setAccessToken(token)
            setIsSignedIn(true)
            setIsLoading(false)
            const userInfo = await fetchUserInfo(token)
            if (userInfo) setUser(userInfo)
          },
          (err) => {
            setError(err)
            setIsLoading(false)
          }
        )
        if (initialized) {
          setIsReady(true)
        }
      } else {
        setTimeout(checkGoogleLoaded, 100)
      }
    }

    checkGoogleLoaded()
  }, [])

  const signIn = useCallback(() => {
    if (!isReady) return
    setIsLoading(true)
    setError(null)
    requestAccessToken()
  }, [isReady])

  const signOut = useCallback(() => {
    authSignOut()
    setIsSignedIn(false)
    setUser(null)
    setAccessToken(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (token && !isSignedIn) {
      setAccessToken(token)
      setIsSignedIn(true)
      fetchUserInfo(token).then((userInfo) => {
        if (userInfo) setUser(userInfo)
      })
    }
  }, [isSignedIn])

  return {
    isConfigured: isConfigured(),
    isReady,
    isSignedIn,
    isLoading,
    user,
    accessToken,
    error,
    signIn,
    signOut,
    clearError,
  }
}
