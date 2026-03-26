import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

function getSupabasePublicConfig(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return { url, publishableKey }
}

export function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
  if (!match) return null

  const token = match[1].trim()
  return token.length > 0 ? token : null
}

export function createAuthenticatedSupabaseClient(accessToken: string): SupabaseClient {
  const { url, publishableKey } = getSupabasePublicConfig()

  return createClient(url, publishableKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  })
}

export async function getAuthenticatedUser(userClient: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser()

  if (error) return null
  return user
}

export async function getAuthenticatedUserFromToken(accessToken: string): Promise<User | null> {
  const userClient = createAuthenticatedSupabaseClient(accessToken)
  return getAuthenticatedUser(userClient)
}
