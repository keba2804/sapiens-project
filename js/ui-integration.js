// ====================================
// INTEGRACIÓN DE UI - DETALLES DEL PRODUCTO (FIXED)
// ====================================

let tutoresCache = {}; // Almacén temporal de datos

async function cargarInterfazEstudiante(user) {
    console.log("🚀 UI Estudiante iniciada");
    
    const marketplace = document.getElementById('marketplace-screen');
    if(!marketplace) return;

    // 1. RESTAURAR FEED ESTÁTICO (Cursos grabados)
    const defaultFeed = document.getElementById('default-feed');
    if(defaultFeed) defaultFeed.style.display = 'block';

    // 2. INYECTAR PANEL "MIS CLASES" (Si no existe)
    if (!document.getElementById('mis-clases-section')) {
        const divClases = document.createElement('div');
        divClases.id = 'mis-clases-section';
        divClases.style.cssText = `margin-bottom: 40px; background: #EBF8FF; padding: 30px; border-radius: 20px; border: 1px solid #BEE3F8;`;
        divClases.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
                <span style="font-size:28px;">📅</span>
                <div>
                    <h3 style="margin:0; color:#2A4365; font-size: 20px;">Mis Solicitudes</h3>
                    <p style="margin:0; font-size:13px; color:#718096;">Estado de tus reservas</p>
                </div>
            </div>
            <div id="mis-clases-container"><p style="color:#718096; padding:10px;">Cargando...</p></div>
        `;
        const header = marketplace.querySelector('.header');
        if(header && header.nextSibling) header.parentNode.insertBefore(divClases, header.nextSibling);
    }

    // 3. LISTENERS
    if (typeof escucharMisClasesEstudiante === 'function') escucharMisClasesEstudiante(user.uid);

    // 4. GRID DE MENTORES REALES
    let gridTutores = document.getElementById('tutores-reales-grid');
    if (!gridTutores) {
        const section = document.createElement('div');
        section.className = 'section-container';
        section.style.marginBottom = '60px';
        section.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <h3 style="font-size: 22px; color: #1A202C; margin:0;">Mentores en Vivo</h3>
                <span style="background:#F0FFF4; color:#2F855A; padding:6px 15px; border-radius:20px; font-size:12px; border:1px solid #C6F6D5;">Online</span>
            </div>
            <div id="tutores-reales-grid" class="grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;"></div>
        `;
        if(defaultFeed) defaultFeed.parentNode.insertBefore(section, defaultFeed);
        else marketplace.appendChild(section);
        gridTutores = document.getElementById('tutores-reales-grid');
    }

    // 5. CARGAR Y RENDERIZAR
    if (typeof cargarTutores === 'function') {
        const tutores = await cargarTutores();
        // Guardamos los datos para usarlos al abrir el detalle
        tutores.forEach(t => tutoresCache[t.id] = t);
        renderizarTutores(tutores, gridTutores);
    }
}

// ===== RENDERIZAR TARJETAS (CLICK -> DETALLES) =====
function renderizarTutores(tutores, contenedor) {
    contenedor.innerHTML = '';
    
    if (tutores.length === 0) {
        contenedor.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No hay mentores disponibles. Registra uno en modo incógnito.</p>';
        return;
    }

    tutores.forEach(tutor => {
        const foto = tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}`;
        const materia = (tutor.subjects && tutor.subjects[0]) ? tutor.subjects[0] : 'General';
        
        const card = document.createElement('div');
        card.className = 'tutor-card';
        card.style.cursor = 'pointer';
        
        // AL CLICK: Ejecutar función de abrir detalles
        card.onclick = () => verDetallesReal(tutor.id);

        card.innerHTML = `
            <div style="position:relative;">
                <img src="${foto}" class="main-img" style="height: 180px; object-fit: cover; border-radius: 12px 12px 0 0; width: 100%;">
                <div style="position:absolute; top:10px; right:10px; background:white; padding:4px 8px; border-radius:10px; font-size:12px; font-weight:bold;">$${tutor.hourly_rate}/h</div>
            </div>
            <div style="padding: 15px;">
                <div class="stars" style="color:#F2C94C;">★★★★★</div>
                <h4 style="margin: 5px 0; color: #333;">${tutor.name}</h4>
                <p class="desc" style="font-size: 13px; color: #666;">Experto en <strong>${materia}</strong>. ${tutor.university}.</p>
                <button class="btn-main" style="width:100%; margin-top:10px;">Ver Perfil Completo</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// ==========================================
// FUNCIÓN CLAVE: ABRIR DETALLES (FIXED)
// ==========================================
function verDetallesReal(tutorId) {
    console.log("Abriendo detalles para:", tutorId);
    
    const tutor = tutoresCache[tutorId];
    if (!tutor) {
        console.error("Error: Tutor no encontrado en cache");
        return;
    }

    const materia = (tutor.subjects && tutor.subjects[0]) ? tutor.subjects[0] : 'Clase';
    
    // 1. OBTENER ELEMENTOS DEL DOM (Usando los IDs de tu index.html original)
    const view = document.getElementById('course-details-view');
    const marketplace = document.getElementById('marketplace-screen');
    
    if (!view) {
        console.error("No existe el div 'course-details-view' en el HTML");
        return;
    }

    // 2. RELLENAR DATOS
    setSafeText('detail-title', `Clase Particular: ${materia}`);
    setSafeText('detail-tutor-name', tutor.name);
    setSafeText('detail-student-role', tutor.university || 'Mentor Verificado');
    setSafeText('detail-price', `$${tutor.hourly_rate} / hora`);
    
    // Imágenes
    const imgMateria = obtenerImagenMateria(materia);
    const imgPerfil = tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}`;
    
    setSafeSrc('detail-hero-img', imgPerfil);          // Foto grande izquierda (Hero)
    setSafeSrc('detail-tutor-avatar-small', imgPerfil); // Avatar pequeño
    setSafeSrc('detail-course-img', imgMateria);       // Imagen sidebar derecha

    // 3. CONFIGURAR BOTÓN "RESERVAR" (Sidebar derecho)
    // Buscamos el botón dentro del sidebar para reemplazarlo y quitar eventos viejos
    const sidebar = view.querySelector('.booking-sidebar');
    const oldBtn = sidebar ? sidebar.querySelector('button') : null;
    
    if (oldBtn) {
        const newBtn = oldBtn.cloneNode(true);
        newBtn.innerText = "📅 Solicitar Reserva";
        newBtn.onclick = () => iniciarReservaDesdeDetalle(tutor.id, materia, tutor.name, tutor.hourly_rate);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    }

    // 4. CONFIGURAR BOTÓN "VOLVER"
    const backBtn = view.querySelector('.btn-back');
    if (backBtn) {
        backBtn.onclick = () => {
            view.style.display = 'none';
            marketplace.style.display = 'block';
            window.scrollTo(0,0);
        };
    }

    // 5. CAMBIAR PANTALLA
    if(marketplace) marketplace.style.display = 'none';
    view.style.display = 'block'; // Mostrar detalles
    window.scrollTo(0, 0);
}

// ===== LÓGICA DE RESERVA FINAL =====
function iniciarReservaDesdeDetalle(tutorId, materia, nombre, precio) {
    if(!confirm(`¿Confirmar reserva con ${nombre} por $${precio}?`)) return;
    
    // Fecha automática para demo (Hoy + 1h)
    const hoy = new Date();
    const fecha = hoy.toISOString().split('T')[0];
    const hora = (hoy.getHours() + 1).toString().padStart(2, '0') + ":00";
    
    if (typeof reservarTutoria === 'function') {
        reservarTutoria(tutorId, materia, fecha, hora);
        
        // Volver al home
        setTimeout(() => {
            document.getElementById('course-details-view').style.display = 'none';
            document.getElementById('marketplace-screen').style.display = 'block';
            window.scrollTo(0,0);
        }, 1500);
    }
}

// --- UTILIDADES ---
function setSafeText(id, txt) { const el = document.getElementById(id); if(el) el.innerText = txt; }
function setSafeSrc(id, src) { const el = document.getElementById(id); if(el) el.src = src; }

function obtenerImagenMateria(materia) {
    const m = materia.toLowerCase();
    if(m.includes('python')) return 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=600&q=80';
    if(m.includes('fisica')) return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80';
    if(m.includes('calculo')) return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80';
}

// Listener de seguridad
if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user && document.getElementById('marketplace-screen')?.style.display !== 'none') {
            setTimeout(() => cargarInterfazEstudiante(user), 500);
        }
    });
}