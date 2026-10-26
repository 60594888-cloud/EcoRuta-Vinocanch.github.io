// Configuración pública del cliente Supabase para EcoRuta.
// La clave publishable puede usarse en el navegador; protege la base de datos
// mediante políticas RLS y nunca coloques aquí una clave service_role.
const SUPABASE_URL = "https://lltmqglylffjjtpfgwdz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_e4f5RulY-ict09gqap6NQ_2ABIYWED";

const configuracionLista =
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("TU_PROYECTO") &&
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") &&
    SUPABASE_PUBLISHABLE_KEY !== "sb_publishable_TU_CLAVE";

window.supabaseCliente = null;

if (window.supabase && configuracionLista) {
    window.supabaseCliente = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
} else if (!configuracionLista) {
    console.warn("EcoRuta: completa js/configuracion.js con tu proyecto Supabase.");
} else {
    console.warn("EcoRuta: no se cargó la librería de Supabase.");
}
