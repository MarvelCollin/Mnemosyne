declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient
        }
      }
    }
  }
}

interface TokenClientConfig {
  client_id: string
  scope: string
  callback: (response: TokenResponse) => void
  error_callback?: (error: ErrorResponse) => void
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  error?: string
}

interface ErrorResponse {
  type: string
  message: string
}

export interface GoogleUser {
  email: string
  name: string
  picture: string
}

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"

let tokenClient: TokenClient | null = null
let accessToken: string | null = null
let tokenExpiry: number | null = null

export function getClientId(): string | null {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || null
}

export function isConfigured(): boolean {
  return !!getClientId()
}

export function isGoogleLoaded(): boolean {
  return typeof window !== "undefined" && !!window.google?.accounts?.oauth2
}

export function getAccessToken(): string | null {
  if (!accessToken || !tokenExpiry) return null
  if (Date.now() >= tokenExpiry) {
    accessToken = null
    tokenExpiry = null
    return null
  }
  return accessToken
}

export function initTokenClient(
  onSuccess: (token: string) => void,
  onError: (error: string) => void
): boolean {
  const clientId = getClientId()
  if (!clientId || !isGoogleLoaded()) return false

  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: (response) => {
      if (response.error) {
        onError(response.error)
        return
      }
      accessToken = response.access_token
      tokenExpiry = Date.now() + response.expires_in * 1000
      onSuccess(response.access_token)
    },
    error_callback: (error) => {
      onError(error.message || "Authentication failed")
    },
  })

  return true
}

export function requestAccessToken(): void {
  if (!tokenClient) return
  tokenClient.requestAccessToken({ prompt: "" })
}

export function signOut(): void {
  if (accessToken) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: "POST",
    }).catch(() => {})
  }
  accessToken = null
  tokenExpiry = null
}

export async function fetchUserInfo(token: string): Promise<GoogleUser | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
    }
  } catch {
    return null
  }
}
