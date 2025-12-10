import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

if (!window.ENV?.SUPABASE_URL || !window.ENV?.SUPABASE_ANON_KEY) {
  console.warn("Supabase config missing. Please set window.ENV in public/env.js");
}

export const supabase = createClient(
  window.ENV?.SUPABASE_URL || "",
  window.ENV?.SUPABASE_ANON_KEY || "",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

