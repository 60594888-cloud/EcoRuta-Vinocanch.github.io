const db = () => window.supabaseCliente;

async function obtenerUsuario() {
    if (!db()) return null;

    const { data, error } = await db().auth.getUser();

    if (error || !data.user) return null;

    return data.user;
}

function mostrarMensaje(elemento, mensaje) {
    const destino = document.getElementById(elemento);

    if (destino) {
        destino.textContent = mensaje;
    }
}

// REGISTRO DE USUARIO
const formularioRegistro = document.getElementById("form-registro");

if (formularioRegistro) {
    formularioRegistro.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!db()) {
            mostrarMensaje("mensaje", "Primero configura Supabase.");
            return;
        }

        const email = document.getElementById("correo-registro").value;
        const password = document.getElementById("contrasena-registro").value;

        const { error } = await db().auth.signUp({
            email,
            password
        });

        mostrarMensaje(
            "mensaje",
            error
                ? error.message
                : "Registro enviado. Si se solicita, confirma tu correo electrónico."
        );
    });
}

// INICIAR SESIÓN
const formularioLogin = document.getElementById("form-login");

if (formularioLogin) {
    formularioLogin.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!db()) {
            mostrarMensaje("mensaje", "Primero configura Supabase.");
            return;
        }

        const email = document.getElementById("correo").value;
        const password = document.getElementById("contrasena").value;

        const { error } = await db().auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            mostrarMensaje("mensaje", "No se pudo iniciar sesión: " + error.message);
            return;
        }

        window.location.href = "index.html";
    });
}

// CERRAR SESIÓN
const botonCerrarSesion = document.getElementById("cerrar-sesion");

if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", async () => {
        if (!db()) return;

        await db().auth.signOut();
        window.location.href = "login.html";
    });
}

// REGISTRAR REPORTE
const formularioReporte = document.getElementById("form-reporte");

if (formularioReporte) {
    formularioReporte.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!db()) {
            mostrarMensaje("mensaje-reporte", "Primero configura Supabase.");
            return;
        }

        const usuario = await obtenerUsuario();

        if (!usuario) {
            mostrarMensaje(
                "mensaje-reporte",
                "Inicia sesión antes de registrar un reporte."
            );
            return;
        }

        const reporte = {
            usuario_id: usuario.id,
            sector: document.getElementById("sector").value,
            tipo_residuo: document.getElementById("tipo-residuo").value,
            urgencia: document.getElementById("urgencia").value,
            descripcion: document.getElementById("descripcion").value,
            estado: "pendiente"
        };

        const { error } = await db()
            .from("reportes")
            .insert(reporte);

        if (error) {
            mostrarMensaje(
                "mensaje-reporte",
                "No se pudo guardar el reporte. Revisa las tablas y permisos de Supabase."
            );
            console.error(error);
            return;
        }

        mostrarMensaje("mensaje-reporte", "Reporte registrado correctamente.");
        formularioReporte.reset();

        if (typeof cargarReportes === "function") {
            cargarReportes();
        }
    });
}

// MOSTRAR REPORTES
async function cargarReportes() {
    const contenedor = document.getElementById("lista-reportes");

    if (!contenedor || !db()) return;

    contenedor.textContent = "Cargando reportes...";

    const filtro = document.getElementById("filtro-estado")?.value || "";

    let consulta = db()
        .from("reportes")
        .select("id, sector, tipo_residuo, urgencia, descripcion, estado, creado_en")
        .order("creado_en", { ascending: false });

    if (filtro) {
        consulta = consulta.eq("estado", filtro);
    }

    const { data, error } = await consulta;

    if (error) {
        contenedor.textContent = "No se pudieron cargar los reportes.";
        console.error(error);
        return;
    }

    contenedor.replaceChildren();

    if (!data || data.length === 0) {
        contenedor.textContent = "No hay reportes para mostrar.";
        return;
    }

    data.forEach((reporte) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "reporte";

        const titulo = document.createElement("h3");
        titulo.textContent = reporte.sector;

        const tipo = document.createElement("p");
        tipo.textContent = "Residuo: " + reporte.tipo_residuo;

        const urgencia = document.createElement("p");
        urgencia.textContent = "Urgencia: " + reporte.urgencia;

        const descripcion = document.createElement("p");
        descripcion.textContent = reporte.descripcion;

        const estado = document.createElement("p");
        estado.textContent = "Estado: " + reporte.estado;

        tarjeta.append(titulo, tipo, urgencia, descripcion, estado);
        contenedor.appendChild(tarjeta);
    });
}

// MAPA DE PRIORIDADES
async function cargarMapa() {
    const contenedor = document.getElementById("mapa-sectores");

    if (!contenedor || !db()) return;

    contenedor.textContent = "Cargando información...";

    const sectores = [
        "Entrada principal",
        "Zona de frutas y verduras",
        "Zona de carnes",
        "Zona de comidas",
        "Zona de residuos"
    ];

    const { data, error } = await db()
        .from("reportes")
        .select("sector, urgencia, estado")
        .in("estado", ["pendiente", "aprobado"]);

    if (error) {
        contenedor.textContent = "No se pudo cargar el mapa.";
        console.error(error);
        return;
    }

    contenedor.replaceChildren();

    sectores.forEach((nombreSector) => {
        const reportesSector = (data || []).filter(
            (reporte) => reporte.sector === nombreSector
        );

        const cantidad = reportesSector.length;
        const urgentes = reportesSector.filter(
            (reporte) => reporte.urgencia === "Alta"
        ).length;

        let nivel = "baja";
        let textoNivel = "Prioridad baja";

        if (cantidad >= 4 || urgentes >= 2) {
            nivel = "alta";
            textoNivel = "Prioridad alta";
        } else if (cantidad >= 2 || urgentes === 1) {
            nivel = "media";
            textoNivel = "Prioridad media";
        }

        const tarjeta = document.createElement("article");
        tarjeta.className = "sector " + nivel;

        const titulo = document.createElement("h3");
        titulo.textContent = nombreSector;

        const total = document.createElement("p");
        total.textContent = "Reportes activos: " + cantidad;

        const prioridad = document.createElement("p");
        prioridad.textContent = textoNivel;

        tarjeta.append(titulo, total, prioridad);
        contenedor.appendChild(tarjeta);
    });
}

// CARGAR PUNTOS DEL USUARIO
async function cargarPuntos() {
    const elemento = document.getElementById("mis-puntos");

    if (!elemento || !db()) return;

    const usuario = await obtenerUsuario();

    if (!usuario) {
        elemento.textContent = "Inicia sesión";
        return;
    }

    const { data, error } = await db()
        .from("perfiles")
        .select("puntos")
        .eq("id", usuario.id)
        .maybeSingle();

    if (error) {
        elemento.textContent = "No disponible";
        console.error(error);
        return;
    }

    elemento.textContent = data?.puntos ?? 0;
}

// MOSTRAR RECOMPENSAS
async function cargarRecompensas() {
    const contenedor = document.getElementById("lista-recompensas");

    if (!contenedor || !db()) return;

    const { data, error } = await db()
        .from("recompensas")
        .select("id, nombre, descripcion, costo_puntos, disponible")
        .eq("disponible", true)
        .order("costo_puntos", { ascending: true });

    if (error) {
        contenedor.textContent = "No se pudieron cargar las recompensas.";
        console.error(error);
        return;
    }

    contenedor.replaceChildren();

    if (!data || data.length === 0) {
        contenedor.textContent = "Todavía no hay recompensas disponibles.";
        return;
    }

    data.forEach((recompensa) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";

        const titulo = document.createElement("h3");
        titulo.textContent = recompensa.nombre;

        const descripcion = document.createElement("p");
        descripcion.textContent = recompensa.descripcion || "";

        const costo = document.createElement("p");
        costo.textContent = "Costo: " + recompensa.costo_puntos + " puntos";

        const boton = document.createElement("button");
        boton.textContent = "Solicitar canje";

        boton.addEventListener("click", () => solicitarCanje(recompensa.id));

        tarjeta.append(titulo, descripcion, costo, boton);
        contenedor.appendChild(tarjeta);
    });
}

// SOLICITAR CANJE
async function solicitarCanje(recompensaId) {
    if (!db()) return;

    const usuario = await obtenerUsuario();

    if (!usuario) {
        alert("Inicia sesión antes de solicitar una recompensa.");
        return;
    }

    alert(
        "La solicitud de canje requiere configurar una función segura en Supabase. " +
        "No se descontarán puntos hasta implementar esa función."
    );
}

// PANEL ADMINISTRADOR
async function comprobarAdministrador() {
    const elemento = document.getElementById("estado-admin");

    if (!elemento || !db()) return;

    const usuario = await obtenerUsuario();

    if (!usuario) {
        elemento.textContent = "Debes iniciar sesión.";
        return;
    }

    const { data, error } = await db()
        .from("perfiles")
        .select("rol")
        .eq("id", usuario.id)
        .maybeSingle();

    if (error || !data || data.rol !== "administrador") {
        elemento.textContent = "Tu cuenta no tiene permisos de administrador.";
        return;
    }

    elemento.textContent = "Sesión de administrador verificada.";
    cargarReportesAdmin();
}

// MOSTRAR REPORTES EN ADMINISTRACIÓN
async function cargarReportesAdmin() {
    const contenedor = document.getElementById("reportes-admin");

    if (!contenedor || !db()) return;

    contenedor.textContent = "Cargando reportes...";

    const usuario = await obtenerUsuario();

    if (!usuario) {
        contenedor.textContent = "Inicia sesión para continuar.";
        return;
    }

    const { data: perfil, error: errorPerfil } = await db()
        .from("perfiles")
        .select("rol")
        .eq("id", usuario.id)
        .maybeSingle();

    if (errorPerfil || perfil?.rol !== "administrador") {
        contenedor.textContent = "Acceso no autorizado.";
        return;
    }

    const filtro = document.getElementById("filtro-admin")?.value || "";

    let consulta = db()
        .from("reportes")
        .select("id, sector, tipo_residuo, urgencia, descripcion, estado")
        .order("creado_en", { ascending: false });

    if (filtro) {
        consulta = consulta.eq("estado", filtro);
    }

    const { data, error } = await consulta;

    if (error) {
        contenedor.textContent = "No se pudieron cargar los reportes.";
        console.error(error);
        return;
    }

    contenedor.replaceChildren();

    if (!data || data.length === 0) {
        contenedor.textContent = "No hay reportes para mostrar.";
        return;
    }

    data.forEach((reporte) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "reporte";

        const titulo = document.createElement("h3");
        titulo.textContent = reporte.sector;

        const detalle = document.createElement("p");
        detalle.textContent =
            reporte.tipo_residuo + " | Urgencia: " + reporte.urgencia;

        const descripcion = document.createElement("p");
        descripcion.textContent = reporte.descripcion;

        const estado = document.createElement("p");
        estado.textContent = "Estado actual: " + reporte.estado;

        tarjeta.append(titulo, detalle, descripcion, estado);

        ["aprobado", "resuelto", "rechazado"].forEach((nuevoEstado) => {
            const boton = document.createElement("button");
            boton.textContent = nuevoEstado.charAt(0).toUpperCase() +
                nuevoEstado.slice(1);

            boton.addEventListener("click", () => {
                actualizarEstadoReporte(reporte.id, nuevoEstado);
            });

            tarjeta.appendChild(boton);
        });

        contenedor.appendChild(tarjeta);
    });
}

// ACTUALIZAR ESTADO DE REPORTE
async function actualizarEstadoReporte(id, estado) {
    if (!db()) return;

    const usuario = await obtenerUsuario();

    if (!usuario) {
        alert("Debes iniciar sesión.");
        return;
    }

    const { data: perfil, error: errorPerfil } = await db()
        .from("perfiles")
        .select("rol")
        .eq("id", usuario.id)
        .maybeSingle();

    if (errorPerfil || perfil?.rol !== "administrador") {
        alert("No tienes permisos de administrador.");
        return;
    }

    const { error } = await db()
        .from("reportes")
        .update({ estado })
        .eq("id", id);

    if (error) {
        alert("No se pudo actualizar. Revisa las políticas de Supabase.");
        console.error(error);
        return;
    }

    cargarReportesAdmin();
    cargarReportes();
    cargarMapa();
}

// INICIALIZAR LAS FUNCIONES DE CADA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
    if (!db()) {
        console.warn("Supabase no está configurado.");
        return;
    }

    cargarReportes();
    cargarMapa();
    cargarPuntos();
    cargarRecompensas();
    comprobarAdministrador();
});


// MENÚ RESPONSIVE
document.addEventListener("DOMContentLoaded", function () {
    const botonMenu = document.getElementById("menu-toggle");
    const menu = document.getElementById("nav");

    if (botonMenu && menu) {
        botonMenu.addEventListener("click", function () {
            const abierto = menu.classList.toggle("open");

            botonMenu.setAttribute("aria-expanded", abierto);

            botonMenu.setAttribute(
                "aria-label",
                abierto ? "Cerrar menú" : "Abrir menú"
            );

            botonMenu.textContent = abierto ? "✕" : "☰";
        });
    }
});

