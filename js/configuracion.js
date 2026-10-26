const SUPABASE_URL = "TU_PROJECT_URL";

const SUPABASE_KEY = "TU_PUBLISHABLE_KEY";

const supabaseCliente = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
