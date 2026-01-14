import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bhdiezeksupqkgdtfdyf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZGllemVrc3VwcWtnZHRmZHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyOTYyNDYsImV4cCI6MjA4Mzg3MjI0Nn0.hhCDhRcErB_cNVmmkOcCa-qU9bo6nPBX7aYHBW--Qkk";
console.log("Supabase URL:", SUPABASE_URL);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
