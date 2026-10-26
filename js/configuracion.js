// Reemplaza estos valores con los de tu proyecto Supabase.
// Utiliza la clave publicable (publishable key), nunca la service_role.

const SUPABASE_URL = "https://lltmqglylffjjtpfgwdz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_e4f5RulYH-ict09gqap6NQ_2ABIYWED";

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
