// Reemplaza estos valores con los de tu proyecto Supabase.
// Utiliza la clave publicable (publishable key), nunca la service_role.

const SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "PEGA_AQUI_TU_PUBLISHABLE_KEY";

if (
    !SUPABASE_URL.startsWith("https://") ||
    SUPABASE_PUBLISHABLE_KEY.startsWith("PEGA_AQUI")
) {
    console.warn("Configura la URL y la clave publicable de Supabase.");
}

window.supabaseCliente = null;

if (
    window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_PUBLISHABLE_KEY.startsWith("PEGA_AQUI")
) {
    window.supabaseCliente = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
}
