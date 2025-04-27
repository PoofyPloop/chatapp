import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ldfgcvuuwtpjwqosaaqp.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmdjdnV1d3Rwandxb3NhYXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NTEwOTUsImV4cCI6MjA2MTEyNzA5NX0.-uUwwOjFaXGurwYG_2YPy-3uCqI4BPeMEv44m6EaWxA";
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };