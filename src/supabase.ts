console.log(environment);
console.log(environment.supabaseUrl);
console.log(environment.supabaseAnonKey);
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { environment } from './environments/environment';

export const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }

  
);









// const url = import.meta.env.VITE_SUPABASE_URL as string;
// const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// export const supabase: SupabaseClient = createClient(url, anonKey, {
//   auth: {
//     persistSession: true,
//     autoRefreshToken: true,
//     detectSessionInUrl: true,
//   },
// });
