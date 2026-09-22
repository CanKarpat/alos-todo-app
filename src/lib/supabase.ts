import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY eksik. .env dosyasını .env.example'dan oluşturup doldurun."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
