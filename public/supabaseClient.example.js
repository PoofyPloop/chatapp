import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_KEY = "your-anon-key";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export { supabase };