// Conexión al mismo proyecto Supabase del portafolio anterior.
const SUPABASE_URL = "https://rfdcwalfemecvxvtmvea.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2N9aZ4BXhv8xrB_d6cyO_g_gVJNt0Y4";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
