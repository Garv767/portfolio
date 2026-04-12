import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are missing. Curated features will be disabled.");
}

// Only initialize if we have a URL, otherwise export a dummy object to prevent app crash
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey || '') 
  : { 
      from: () => ({ 
        select: () => ({ 
          order: () => Promise.resolve({ data: [], error: null }),
          match: () => Promise.resolve({ data: [], error: null })
        }) 
      }),
      auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) }
    };
