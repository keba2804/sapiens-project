// ====================================
// UI INTEGRATION - VERSIÓN FINAL CORREGIDA
// ====================================

let tutoresCache = {};
let reservaActual = null;

async function cargarInterfazEstudiante(user) {
    console.log("🚀 UI Estudiante iniciada");
    
    const marketplace = document.getElementById('marketplace-screen');
    if(!marketplace) return;

    const defaultFeed = document.getElementById('default-feed');
    if(defaultFeed) defaultFeed.style.display = 'block';

    // PANEL MIS CLASES
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
            <div id="mis-clases-container"><p style="color:#718096; padding:10px;">No tienes solicitudes activas</p></div>
        `;
        const header = marketplace.querySelector('.header');
        if(header && header.nextSibling) header.parentNode.insertBefore(divClases, header.nextSibling);
    }

    if (typeof escucharMisClasesEstudiante === 'function') {
        escucharMisClasesEstudiante(user.uid);
    }

    // GRID MENTORES
    let gridTutores = document.getElementById('tutores-reales-grid');
    if (!gridTutores) {
        const section = document.createElement('div');
        section.className = 'section-container';
        section.style.marginBottom = '60px';
        section.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <h3 style="font-size: 22px; color: #1A202C; margin:0;">🔴 Mentores en Vivo</h3>
                <span id="mentor-count-badge" style="background:#F0FFF4; color:#2F855A; padding:6px 15px; border-radius:20px; font-size:12px; border:1px solid #C6F6D5;">Cargando...</span>
            </div>
            <div id="tutores-reales-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;"></div>
        `;
        if(defaultFeed) defaultFeed.parentNode.insertBefore(section, defaultFeed);
        else marketplace.appendChild(section);
        gridTutores = document.getElementById('tutores-reales-grid');
    }

    if (typeof cargarTutores === 'function') {
        const tutores = await cargarTutores();
        console.log(`📚 ${tutores.length} mentores cargados`);
        
        const badge = document.getElementById('mentor-count-badge');
        if(badge) badge.textContent = `${tutores.length} Disponibles`;
        
        tutores.forEach(t => tutoresCache[t.id] = t);
        renderizarTutores(tutores, gridTutores);
    }
}

function renderizarTutores(tutores, contenedor) {
    contenedor.innerHTML = '';
    
    if (tutores.length === 0) {
        contenedor.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#999; padding:40px;">No hay mentores disponibles</p>';
        return;
    }

    tutores.forEach(tutor => {
        const foto = tutor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}`;
        const materia = (tutor.subjects && tutor.subjects[0]) ? tutor.subjects[0] : 'General';
        const rating = tutor.rating || 5.0;
        const estrellas = '★'.repeat(Math.floor(rating));
        
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            cursor: pointer;
            transition: transform 0.2s;
            overflow: hidden;
            border: 1px solid #f0f0f0;
        `;
        card.onmouseover = () => card.style.transform = 'translateY(-5px)';
        card.onmouseout = () => card.style.transform = 'translateY(0)';
        
        card.onclick = () => abrirModalPerfilMentor(tutor.id);

        card.innerHTML = `
            <div style="position:relative;">
                <img src="${foto}" style="height: 180px; object-fit: cover; width: 100%;">
                <div style="position:absolute; top:10px; right:10px; background:white; padding:6px 12px; border-radius:20px; font-size:13px; font-weight:bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    💰 $${tutor.hourly_rate}/h
                </div>
            </div>
            <div style="padding: 20px;">
                <div style="color:#F2C94C; font-size:16px; margin-bottom:8px;">
                    ${estrellas} <span style="color:#666; font-size:13px;">${rating.toFixed(1)}</span>
                </div>
                <h4 style="margin: 5px 0; color: #333; font-size:18px;">${tutor.name}</h4>
                <p style="font-size: 13px; color: #666; margin:8px 0;">📚 ${materia}</p>
                <p style="font-size: 12px; color: #999; margin:5px 0;">🏫 ${tutor.university}</p>
                <div style="margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
                    <button style="width:100%; padding:12px; background:#4FBDBA; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">
                        Ver Perfil Completo →
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// ==========================================
// MODAL DE PERFIL - CON SCROLL ARREGLADO
// ==========================================
async function abrirModalPerfilMentor(tutorId) {
    console.log("🔍 Abriendo perfil:", tutorId);
    
    const tutor = tutoresCache[tutorId];
    if (!tutor) return;

    const materia = (tutor.subjects && tutor.subjects[0]) ? tutor.subjects[0] : 'Tutoría';
    const allMaterias = tutor.subjects ? tutor.subjects.join(', ') : materia;
    const rating = tutor.rating || 5.0;
    const estrellas = '★★★★★';
    
    // CARGAR RESEÑAS
    let resenasHTML = '';
    try {
        const reviewsSnap = await db.collection('reviews')
            .where('mentor_id', '==', tutorId)
            .limit(3)
            .get();
        
        if (!reviewsSnap.empty) {
            reviewsSnap.forEach(doc => {
                const r = doc.data();
                const rEstrellas = '★'.repeat(r.rating || 5);
                resenasHTML += `
                    <div style="background:white; padding:25px; border-radius:16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom:20px;">
                        <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(r.student_name || 'Estudiante')}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">
                            <div>
                                <strong style="display:block;">${r.student_name || 'Estudiante'} (Estudiante)</strong>
                                <span style="color:#F2C94C;">${rEstrellas}</span>
                            </div>
                        </div>
                        <p style="margin:0; font-size:14px; color:#555; line-height:1.6; font-style:italic;">"${r.comment || 'Excelente mentor'}"</p>
                    </div>
                `;
            });
        } else {
            resenasHTML = '<p style="text-align:center; color:#999; padding:40px;">Este mentor aún no tiene reseñas</p>';
        }
    } catch (error) {
        resenasHTML = '<p style="text-align:center; color:#666; padding:20px;">Las reseñas estarán disponibles pronto</p>';
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'modal-perfil-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 999999;
        overflow-y: scroll;
        padding: 20px 0;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #F7F9FC;
        border-radius: 0;
        max-width: 1200px;
        width: 90%;
        margin: 0 auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideIn 0.3s;
        position: relative;
    `;
    
    modal.innerHTML = `
        <style>
            @keyframes slideIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        </style>
        
        <div style="background:white; padding:20px 40px; border-bottom:1px solid #eee; position:sticky; top:0; z-index:10;">
            <button id="btn-volver-perfil" style="background:none; border:none; color:#666; font-size:16px; cursor:pointer; display:flex; align-items:center; gap:8px; padding:0; margin-bottom:10px;">
                <span style="font-size:20px;">←</span> Volver a resultados
            </button>
        </div>
        
        <div style="padding:40px; background:white; margin-bottom:40px;">
            <div style="display:flex; align-items:center; gap:40px;">
                <img src="${tutor.photo_url}" style="width:180px; height:220px; object-fit:cover; border-radius:15px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                <div style="flex:1;">
                    <h2 style="font-size:32px; color:#333; margin:0 0 15px 0;">Preparación Examen: ${materia}</h2>
                    <div style="display:flex; align-items:center; gap:10px; font-size:16px; color:#555; margin-bottom:15px;">
                        <img src="${tutor.photo_url}" style="width:30px; height:30px; border-radius:50%;">
                        <span>Impartido por: <strong>${tutor.name}</strong> (<span style="color:#4FBDBA; font-weight:bold;">Tutor Verificado ✓</span>) | Estudiante de ${tutor.university}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1.8fr 1fr; gap:50px; padding:0 40px 40px; align-items:start;">
            <div>
                <div style="background:#EBF6FB; padding:30px; border-radius:20px; display:flex; align-items:center; gap:40px; margin-bottom:40px;">
                    <div style="text-align:center;">
                        <div style="font-size:48px; font-weight:800; color:#333; line-height:1;">${rating.toFixed(1)}</div>
                        <div style="color:#F2C94C; font-size:18px; margin:10px 0;">${estrellas}</div>
                        <span style="font-size:13px; color:#777;">Top Rating</span>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:13px; color:#777;">
                            <span>5 Stars</span>
                            <div style="flex:1; height:8px; background:#e0e0e0; border-radius:4px; overflow:hidden;">
                                <div style="height:100%; background:#4FBDBA; border-radius:4px; width:100%;"></div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px; font-size:13px; color:#777;">
                            <span>4 Stars</span>
                            <div style="flex:1; height:8px; background:#e0e0e0; border-radius:4px; overflow:hidden;">
                                <div style="height:100%; background:#4FBDBA; border-radius:4px; width:15%;"></div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px; font-size:13px; color:#777;">
                            <span>3 Stars</span>
                            <div style="flex:1; height:8px; background:#e0e0e0; border-radius:4px; overflow:hidden;">
                                <div style="height:100%; background:#4FBDBA; border-radius:4px; width:5%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3 style="margin:0 0 20px 0; font-size:20px;">Lo que dicen los estudiantes</h3>
                ${resenasHTML}
            </div>
            
            <div>
                <div style="background:white; padding:30px; border-radius:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border:1px solid #eee; position:sticky; top:80px;">
                    <img src="${obtenerImagenMateria(materia)}" style="width:100%; height:180px; object-fit:cover; border-radius:15px; margin-bottom:25px;">
                    
                    <div style="text-align:center; margin-bottom:25px;">
                        <span style="display:block; font-size:36px; font-weight:900; color:#333;">$${tutor.hourly_rate} por hora</span>
                    </div>
                    
                    <button id="btn-reservar-${tutorId}" style="width:100%; padding:15px; font-size:18px; background:#4FBDBA; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer; margin-bottom:30px; transition:0.3s;">
                        Reservar Tutoría Ahora
                    </button>
                    
                    <h4 style="margin:0 0 15px 0; font-size:16px;">¿Qué incluye esta tutoría?</h4>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px; font-size:14px; color:#555;">
                        <span style="font-size:18px;">📹</span>
                        <span>Sesión 1-a-1 con ${tutor.name.split(' ')[0]}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px; font-size:14px; color:#555;">
                        <span style="font-size:18px;">📚</span>
                        <span>${allMaterias}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px; font-size:14px; color:#555;">
                        <span style="font-size:18px;">💬</span>
                        <span>Chat en vivo</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:30px; font-size:14px; color:#555;">
                        <span style="font-size:18px;">🎓</span>
                        <span>${tutor.total_classes || 0} clases</span>
                    </div>
                    
                    <h4 style="margin:0 0 10px 0; font-size:14px;">Comparte:</h4>
                    <div style="display:flex; gap:15px; font-size:24px;">
                        <span style="cursor:pointer;">🐦</span>
                        <span style="cursor:pointer;">📘</span>
                        <span style="cursor:pointer;">🔗</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div style="padding:40px; border-top:1px solid #eee; background:white; margin-top:40px;">
            <h3 style="margin:0 0 25px 0; font-size:22px;">Material de estudio incluido</h3>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:25px;">
                <div style="background:linear-gradient(135deg, #4a5568 0%, #2d3748 100%); color:white; padding:25px; border-radius:16px;">
                    <span style="background:#e53e3e; color:white; padding:5px 12px; border-radius:4px; font-size:12px; font-weight:bold; display:inline-block; margin-bottom:15px;">PDF</span>
                    <h4 style="margin:0 0 10px 0; font-size:18px;">Formulario de Conceptos</h4>
                    <p style="margin:0; font-size:13px; color:#ccc;">Fórmulas esenciales</p>
                </div>
                <div style="background:linear-gradient(135deg, #4a5568 0%, #2d3748 100%); color:white; padding:25px; border-radius:16px;">
                    <span style="background:#38a169; color:white; padding:5px 12px; border-radius:4px; font-size:12px; font-weight:bold; display:inline-block; margin-bottom:15px;">SIMULADOR</span>
                    <h4 style="margin:0 0 10px 0; font-size:18px;">Ejercicios Prácticos</h4>
                    <p style="margin:0; font-size:13px; color:#ccc;">20 ejercicios interactivos</p>
                </div>
                <div style="background:linear-gradient(135deg, #4a5568 0%, #2d3748 100%); color:white; padding:25px; border-radius:16px;">
                    <span style="background:#e53e3e; color:white; padding:5px 12px; border-radius:4px; font-size:12px; font-weight:bold; display:inline-block; margin-bottom:15px;">PDF</span>
                    <h4 style="margin:0 0 10px 0; font-size:18px;">Guía de Proyectos</h4>
                    <p style="margin:0; font-size:13px; color:#ccc;">3 proyectos finales</p>
                </div>
            </div>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // BOTÓN VOLVER FUNCIONAL
    document.getElementById('btn-volver-perfil').onclick = function() {
        cerrarModalPerfil();
    };
    
    // BOTÓN RESERVAR
    document.getElementById(`btn-reservar-${tutorId}`).onclick = function() {
        iniciarProcesoReserva(tutorId, materia);
    };
}

function cerrarModalPerfil() {
    const overlay = document.getElementById('modal-perfil-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = 'auto';
    }
}

// ==========================================
// PROCESO DE RESERVA - FORMATO CORRECTO
// ==========================================
function iniciarProcesoReserva(tutorId, materia) {
    cerrarModalPerfil();
    
    const tutor = tutoresCache[tutorId];
    if (!tutor) return;
    
    console.log("📅 Disponibilidad ORIGINAL del mentor:", tutor.availability);
    
    // FIX: NORMALIZAR FORMATO DE AVAILABILITY
    let availability = tutor.availability || {};
    
    // Si está vacío, crear horario por defecto
    if (Object.keys(availability).length === 0) {
        availability = {
            lunes: { '09:00': true, '15:00': true },
            martes: { '09:00': true, '15:00': true },
            miercoles: { '09:00': true, '15:00': true },
            jueves: { '09:00': true, '15:00': true },
            viernes: { '09:00': true, '15:00': true }
        };
        console.log("⚠️ Mentor sin horario, usando horario por defecto");
    }
    
    // NORMALIZAR: Convertir '09:00' a '0900' si es necesario
    const availabilityNormalizada = {};
    Object.keys(availability).forEach(dia => {
        availabilityNormalizada[dia] = {};
        Object.keys(availability[dia]).forEach(hora => {
            // Permitir ambos formatos: '09:00' y '0900'
            const horaKey = hora.includes(':') ? hora : hora.slice(0,2) + ':' + hora.slice(2);
            availabilityNormalizada[dia][horaKey] = availability[dia][hora];
        });
    });
    
    console.log("✅ Disponibilidad NORMALIZADA:", availabilityNormalizada);
    
    reservaActual = {
        tutorId: tutorId,
        tutorName: tutor.name,
        tutorPhoto: tutor.photo_url,
        materia: materia,
        precioHora: tutor.hourly_rate,
        availability: availabilityNormalizada,
        sesiones: []
    };
    
    abrirModalReserva();
}

function abrirModalReserva() {
    const overlay = document.createElement('div');
    overlay.id = 'modal-reserva-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 9999999;
        overflow-y: scroll;
        padding: 20px 0;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #F7F9FC;
        border-radius: 0;
        max-width: 1100px;
        width: 90%;
        margin: 0 auto;
        animation: slideIn 0.3s;
    `;
    
    const horariosHTML = generarCalendarioHorarios();
    
    modal.innerHTML = `
        <div style="background:white; padding:20px 40px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:10;">
            <button id="btn-volver-reserva" style="background:none; border:none; color:#666; font-size:16px; cursor:pointer; display:flex; align-items:center; gap:8px; padding:0;">
                <span style="font-size:20px;">←</span> Volver
            </button>
            <h2 style="margin:0; color:#333; font-weight:800;">SAPIENS Checkout</h2>
        </div>
        
        <div style="display:flex; gap:40px; padding:40px;">
            <div style="flex:1.5; background:white; padding:40px; border-radius:20px; box-shadow: 0 5px 20px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 20px 0;">📅 Selecciona tus sesiones</h3>
                <p style="color:#666; font-size:14px; margin-bottom:30px;">Puedes reservar múltiples sesiones en diferentes días y horas</p>
                ${horariosHTML}
                
                <div id="sesiones-seleccionadas" style="margin-top:30px; padding-top:30px; border-top:2px solid #eee;">
                    <h4 style="margin:0 0 15px 0;">Sesiones añadidas:</h4>
                    <div id="lista-sesiones">
                        <p style="color:#999; font-style:italic;">No has añadido ninguna sesión aún</p>
                    </div>
                </div>
            </div>
            
            <div style="flex:1; background:#EBF8FF; padding:30px; border-radius:20px; position:sticky; top:100px; height:fit-content;">
                <h3 style="margin:0 0 20px 0;">Resumen</h3>
                
                <div style="display:flex; gap:15px; margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid rgba(0,0,0,0.1);">
                    <img src="${reservaActual.tutorPhoto}" style="width:80px; height:60px; border-radius:10px; object-fit:cover;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">${reservaActual.materia}</div>
                        <div style="font-size:12px; color:#666;">con ${reservaActual.tutorName}</div>
                        <div style="font-size:12px; color:#666;">$${reservaActual.precioHora.toFixed(2)}/hora</div>
                    </div>
                </div>
                
                <div id="resumen-sesiones"></div>
                
                <div style="font-size:14px; color:#555; margin-bottom:12px; display:flex; justify-content:space-between;">
                    <span>Subtotal</span>
                    <span id="subtotal-precio">$0.00</span>
                </div>
                <div style="font-size:14px; color:#555; margin-bottom:12px; display:flex; justify-content:space-between;">
                    <span>Cuota (10%)</span>
                    <span id="fee-precio">$0.00</span>
                </div>
                <div style="font-size:14px; color:#555; margin-bottom:20px; padding-bottom:15px; border-bottom:2px solid rgba(0,0,0,0.1); display:flex; justify-content:space-between;">
                    <span>IVA (15%)</span>
                    <span id="iva-precio">$0.00</span>
                </div>
                
                <div style="font-size:18px; font-weight:800; color:#333; display:flex; justify-content:space-between; margin-bottom:30px;">
                    <span>Total</span>
                    <span id="total-precio" style="color:#4FBDBA;">$0.00</span>
                </div>
                
                <button id="btn-confirmar-reserva" disabled style="width:100%; padding:18px; font-size:18px; background:#ccc; color:white; border:none; border-radius:12px; font-weight:bold; cursor:not-allowed;">
                    Confirmar Reserva
                </button>
            </div>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // BOTÓN VOLVER
    document.getElementById('btn-volver-reserva').onclick = function() {
        cerrarModalReserva();
        setTimeout(() => abrirModalPerfilMentor(reservaActual.tutorId), 100);
    };
    
    document.getElementById('btn-confirmar-reserva').onclick = function() {
        confirmarReservaFinal();
    };
    
    actualizarResumen();
}

function generarCalendarioHorarios() {
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const horas = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    
    let html = '<div style="overflow-x:auto;"><table style="width:100%; border-collapse:separate; border-spacing:8px;">';
    html += '<tr><th style="padding:10px; text-align:left;"></th>';
    
    dias.forEach(dia => {
        html += `<th style="padding:10px; text-align:center; font-weight:bold; text-transform:capitalize; color:#333;">${dia}</th>`;
    });
    html += '</tr>';
    
    const availability = reservaActual.availability || {};
    
    horas.forEach(hora => {
        html += `<tr><td style="padding:10px; font-weight:600; color:#666;">${hora}</td>`;
        dias.forEach((dia, idx) => {
            const fecha = obtenerProximaFecha(idx);
            // FIX: Buscar con formato '09:00'
            const disponible = availability[dia] && availability[dia][hora] === true;
            
            console.log(`${dia} ${hora}: disponible=${disponible}`);
            
            if (disponible) {
                html += `<td style="padding:0;"><button class="slot-disponible" data-fecha="${fecha}" data-hora="${hora}" style="width:100%; padding:12px; background:#E0F2F1; color:#4FBDBA; border:2px solid transparent; border-radius:8px; cursor:pointer; font-weight:600; transition:0.2s;" onmouseover="this.style.borderColor='#4FBDBA'" onmouseout="this.style.borderColor='transparent'">Disponible</button></td>`;
            } else {
                html += `<td style="padding:0;"><div style="padding:12px; background:#f5f5f5; color:#999; border-radius:8px; text-align:center; font-size:12px;">No disponible</div></td>`;
            }
        });
        html += '</tr>';
    });
    
    html += '</table></div>';
    
    setTimeout(() => {
        document.querySelectorAll('.slot-disponible').forEach(btn => {
            btn.onclick = function() {
                const fecha = this.getAttribute('data-fecha');
                const hora = this.getAttribute('data-hora');
                agregarSesion(fecha, hora);
            };
        });
    }, 100);
    
    return html;
}

function obtenerProximaFecha(diaIndex) {
    const hoy = new Date();
    const diff = (diaIndex + 1 - hoy.getDay() + 7) % 7 || 7;
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + diff);
    return fecha.toISOString().split('T')[0];
}

function agregarSesion(fecha, hora) {
    const existe = reservaActual.sesiones.find(s => s.fecha === fecha && s.hora === hora);
    if (existe) {
        alert('Ya agregaste esta sesión');
        return;
    }
    
    reservaActual.sesiones.push({
        fecha: fecha,
        hora: hora,
        duracion: 1
    });
    
    actualizarListaSesiones();
    actualizarResumen();
}

function eliminarSesion(index) {
    reservaActual.sesiones.splice(index, 1);
    actualizarListaSesiones();
    actualizarResumen();
}

function cambiarDuracionSesion(index, cambio) {
    reservaActual.sesiones[index].duracion += cambio;
    if (reservaActual.sesiones[index].duracion < 0.5) reservaActual.sesiones[index].duracion = 0.5;
    if (reservaActual.sesiones[index].duracion > 4) reservaActual.sesiones[index].duracion = 4;
    actualizarListaSesiones();
    actualizarResumen();
}

function actualizarListaSesiones() {
    const lista = document.getElementById('lista-sesiones');
    
    if (reservaActual.sesiones.length === 0) {
        lista.innerHTML = '<p style="color:#999; font-style:italic;">No has añadido ninguna sesión aún</p>';
        return;
    }
    
    lista.innerHTML = '';
    reservaActual.sesiones.forEach((sesion, idx) => {
        const fechaFormateada = new Date(sesion.fecha + 'T00:00:00').toLocaleDateString('es-ES', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const div = document.createElement('div');
        div.style.cssText = 'background:white; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid #4FBDBA;';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <div style="font-weight:bold; font-size:13px;">📅 ${fechaFormateada}</div>
                    <div style="font-size:12px; color:#666;">⏰ ${sesion.hora}</div>
                </div>
                <button onclick="eliminarSesion(${idx})" style="background:#f44336; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:12px;">✕</button>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <button onclick="cambiarDuracionSesion(${idx}, -0.5)" style="width:25px; height:25px; background:#4FBDBA; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">-</button>
                <span style="font-size:13px; font-weight:600;">${sesion.duracion}h</span>
                <button onclick="cambiarDuracionSesion(${idx}, 0.5)" style="width:25px; height:25px; background:#4FBDBA; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">+</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function actualizarResumen() {
    let horasTotales = 0;
    reservaActual.sesiones.forEach(s => horasTotales += s.duracion);
    
    const subtotal = reservaActual.precioHora * horasTotales;
    const fee = subtotal * 0.10;
    const iva = subtotal * 0.15;
    const total = subtotal + fee + iva;
    
    document.getElementById('subtotal-precio').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('fee-precio').textContent = '$' + fee.toFixed(2);
    document.getElementById('iva-precio').textContent = '$' + iva.toFixed(2);
    document.getElementById('total-precio').textContent = '$' + total.toFixed(2);
    
    const resumenDiv = document.getElementById('resumen-sesiones');
    resumenDiv.innerHTML = `
        <div style="background:white; padding:15px; border-radius:10px; margin-bottom:20px;">
            <div style="font-size:14px; font-weight:bold; margin-bottom:5px;">${reservaActual.sesiones.length} sesión(es)</div>
            <div style="font-size:13px; color:#666;">${horasTotales} hora(s) totales</div>
        </div>
    `;
    
    const btnConfirmar = document.getElementById('btn-confirmar-reserva');
    if (reservaActual.sesiones.length > 0) {
        btnConfirmar.disabled = false;
        btnConfirmar.style.background = '#4FBDBA';
        btnConfirmar.style.cursor = 'pointer';
    } else {
        btnConfirmar.disabled = true;
        btnConfirmar.style.background = '#ccc';
        btnConfirmar.style.cursor = 'not-allowed';
    }
}

function cerrarModalReserva() {
    const overlay = document.getElementById('modal-reserva-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
        document.body.style.overflow = 'auto';
    }
}

function confirmarReservaFinal() {
    if (reservaActual.sesiones.length === 0) {
        alert('Agrega al menos una sesión');
        return;
    }
    
    cerrarModalReserva();
    
    if (typeof reservarTutoria === 'function') {
        reservaActual.sesiones.forEach(sesion => {
            reservarTutoria(
                reservaActual.tutorId,
                reservaActual.materia,
                sesion.fecha,
                sesion.hora,
                sesion.duracion
            );
        });
    }
    
    alert(`✅ ¡Reserva confirmada!\n\n${reservaActual.sesiones.length} sesión(es) enviada(s) a ${reservaActual.tutorName}`);
    reservaActual = null;
}

function obtenerImagenMateria(materia) {
    const m = materia.toLowerCase();
    if(m.includes('python')) return 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=600&q=80';
    if(m.includes('fisica')) return 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80';
    if(m.includes('calculo') || m.includes('estadistica')) return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80';
    return 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80';
}

if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
        if (user) {
            const marketplace = document.getElementById('marketplace-screen');
            if (marketplace && marketplace.style.display !== 'none') {
                setTimeout(() => cargarInterfazEstudiante(user), 500);
            }
        }
    });
}

console.log("✅ UI FINAL: Scroll arreglado + Formato availability correcto + Multi-sesión");