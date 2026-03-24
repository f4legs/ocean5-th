import { createClient } from '@supabase/supabase-js'

// Server-only client using service_role key — bypasses RLS
// Only import this in API routes (app/api/*), never in client components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
)
