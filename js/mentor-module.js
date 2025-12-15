// ====================================
// MÓDULO DEL MENTOR
// ====================================

// ===== CARGAR DASHBOARD DEL MENTOR =====
// ===== CARGAR DASHBOARD DEL MENTOR =====
async function cargarDashboardMentor(mentorId) {
    console.log("🚀 Cargando Dashboard para Mentor:", mentorId);

    try {
        // 1. Cargar datos del perfil
        const mentorDoc = await db.collection('users').doc(mentorId).get();
        const mentor = mentorDoc.data();

        // 2. Llenar datos visuales (Nombre, Wallet, etc)
        if (document.getElementById('mentor-dash-name')) 
            document.getElementById('mentor-dash-name').innerText = mentor.name;
        
        if (document.getElementById('wallet-balance')) 
            document.getElementById('wallet-balance').textContent = "$" + (mentor.wallet_balance || 0).toFixed(2);
        
        if (document.getElementById('mentor-rating'))
            document.getElementById('mentor-rating').textContent = (mentor.rating || 5.0).toFixed(1);
        
        if (document.getElementById('reviews-count-text')) {
            const reviewsText = mentor.reviews_count > 0 
                ? `${mentor.reviews_count} reseñas`
                : 'Nuevo Mentor';
            document.getElementById('reviews-count-text').textContent = reviewsText;
        }

        // 3. CARGAR EL CALENDARIO
        inicializarCalendarioMentor(mentor.availability);

        // 4. ⚡ ACTIVAR ESCUCHA EN TIEMPO REAL ⚡
        console.log("🔥 Activando listener de solicitudes...");
        
        // DIAGNÓSTICO
        console.log("📋 DIAGNÓSTICO:");
        console.log("  - Mentor ID:", mentorId);
        console.log("  - Esperando solicitudes con status='pending'");
        
        escucharSolicitudesPendientes(mentorId);
        verificarTarifaConfigrada(mentorId);
        
        // TEST: Verificar solicitudes existentes
        setTimeout(async () => {
            const testQuery = await db.collection('sessions')
                .where('mentor_id', '==', mentorId)
                .get();
            console.log(`🔍 TEST: Total de sesiones para este mentor: ${testQuery.size}`);
            
            if (testQuery.size > 0) {
                testQuery.forEach(doc => {
                    const data = doc.data();
                    console.log(`  - Sesión ${doc.id}: status=${data.status}, student=${data.student_name}`);
                });
            } else {
                console.log("  ℹ️ No hay sesiones aún. Esperando nuevas solicitudes...");
            }
        }, 1000);

    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
    }
}

// ===== ESCUCHAR SOLICITUDES PENDIENTES EN TIEMPO REAL =====
// ===== ESCUCHAR SOLICITUDES PENDIENTES EN TIEMPO REAL =====
// ===== ESCUCHAR SOLICITUDES PENDIENTES EN TIEMPO REAL =====
function escucharSolicitudesPendientes(mentorId) {
  console.log("👂 Escuchando solicitudes para:", mentorId);
  
  // ⚡ CRÍTICO: Retornar el listener para que permanezca activo
  const unsubscribe = db.collection('sessions')
    .where('mentor_id', '==', mentorId)
    .where('status', '==', 'pending')
    .orderBy('created_at', 'desc')
    .onSnapshot((snapshot) => {
      const solicitudes = [];
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log("🆕 Nueva solicitud detectada:", change.doc.id);
        }
      });
      
      snapshot.forEach(doc => {
        solicitudes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📬 Solicitudes actualizadas: ${solicitudes.length}`);
      
      // Actualizar badge
      const badge = document.getElementById('pending-badge');
      if (badge) {
        badge.textContent = solicitudes.length;
        badge.style.display = 'inline-block';
      }
      
      // Mostrar en UI
      mostrarSolicitudesEnUI(solicitudes);
      
      if (solicitudes.length > 0) {
        console.log("🔔 Hay solicitudes pendientes!");
      }
    }, (error) => {
      console.error("❌ Error en listener:", error);
      // Reintentar conexión después de 3 segundos
      setTimeout(() => {
        console.log("🔄 Reintentando conexión...");
        escucharSolicitudesPendientes(mentorId);
      }, 3000);
    });
    
  // Guardar referencia para poder cancelar después si es necesario
  window.mentorListener = unsubscribe;
  return unsubscribe;
}
// ===== MOSTRAR SOLICITUDES EN UI =====
// ===== MOSTRAR SOLICITUDES EN UI =====
function mostrarSolicitudesEnUI(solicitudes) {
  const container = document.getElementById('solicitudes-container');
  if (!container) {
    console.warn("⚠️ No se encontró 'solicitudes-container'");
    return;
  }
  
  container.innerHTML = '';
  
  if (solicitudes.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; background:white; border-radius:16px; border:2px dashed #E2E8F0;">
        <div style="font-size:48px; margin-bottom:15px; opacity:0.5;">📭</div>
        <p style="color:#999; margin:0;">No tienes solicitudes pendientes</p>
        <p style="color:#CBD5E0; margin:5px 0 0 0; font-size:12px;">Las nuevas aparecerán aquí</p>
      </div>
    `;
    return;
  }
  
  solicitudes.forEach(solicitud => {
    const div = document.createElement('div');
    div.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border-left: 4px solid #4FBDBA;
      animation: slideIn 0.3s ease;
    `;
    
    div.innerHTML = `
      <style>
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      </style>
      
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(solicitud.student_name)}&background=4FBDBA&color=fff" 
                 style="width:40px; height:40px; border-radius:50%;">
            <div>
              <h3 style="margin:0; font-size:16px;">${solicitud.student_name}</h3>
              <span style="background:#E0F2F1; color:#4FBDBA; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">
                Estudiante
              </span>
            </div>
          </div>
          
          <div style="margin-left:50px;">
            <p style="margin:5px 0; color:#666; font-size:14px;">📚 <strong>${solicitud.subject}</strong></p>
            <p style="margin:5px 0; color:#666; font-size:13px;">📅 ${solicitud.date} • ⏰ ${solicitud.time}</p>
            <p style="margin:5px 0; color:#666; font-size:13px;">⏱️ Duración: <strong>${solicitud.duration}h</strong></p>
            <p style="margin:8px 0 0 0; font-weight:bold; color:#4FBDBA; font-size:16px;">💰 ${formatPrice(solicitud.price)}</p>
          </div>
        </div>
        
        <div style="display:flex; gap:10px;">
          <button onclick="aceptarSolicitud('${solicitud.id}')" 
                  style="background:#48BB78; color:white; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; font-weight:bold;">
            ✓ Aceptar
          </button>
          <button onclick="rechazarSolicitud('${solicitud.id}')" 
                  style="background:#FED7D7; color:#E53E3E; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; font-weight:bold;">
            ✗ Rechazar
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
  
  console.log(`✅ ${solicitudes.length} solicitud(es) renderizadas`);
}
// ===== ACEPTAR SOLICITUD =====
// ===== ACEPTAR SOLICITUD =====
async function aceptarSolicitud(sessionId) {
  try {
    console.log("✅ Aceptando solicitud:", sessionId);
    
    // 1. Obtener datos de la sesión
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    const sessionData = sessionDoc.data();
    
    // 2. Actualizar estado de la sesión
    await db.collection('sessions').doc(sessionId).update({
      status: 'accepted',
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 3. ⚡ BLOQUEAR EL HORARIO EN LA DISPONIBILIDAD DEL MENTOR
    const mentorId = sessionData.mentor_id;
    const fecha = sessionData.date; // "2025-01-15"
    const hora = sessionData.time;  // "09:00"
    
    // Convertir fecha a día de la semana
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    console.log(`🔒 Bloqueando: ${diaSemana} a las ${hora}`);
    
    // Actualizar disponibilidad
    const mentorDoc = await db.collection('users').doc(mentorId).get();
    const availability = mentorDoc.data().availability || {};
    
    if (!availability[diaSemana]) {
      availability[diaSemana] = {};
    }
    
    // Marcar como NO disponible (false)
    availability[diaSemana][hora] = false;
    
    await db.collection('users').doc(mentorId).update({
      availability: availability
    });
    
    console.log("✅ Horario bloqueado correctamente");
    
    alert('¡Solicitud aceptada! La clase ha sido confirmada y el horario bloqueado.');
    
    // Recargar calendario para mostrar cambios
    if (typeof inicializarCalendarioMentor === 'function') {
      inicializarCalendarioMentor(availability);
    }
    
  } catch (error) {
    console.error("❌ Error aceptando solicitud:", error);
    alert('Error al aceptar: ' + error.message);
  }
}
// ===== RECHAZAR SOLICITUD =====
async function rechazarSolicitud(sessionId) {
  try {
    await db.collection('sessions').doc(sessionId).update({
      status: 'rejected',
      updated_at: getTimestamp()
    });
    
    alert('Solicitud rechazada');
    
  } catch (error) {
    console.error("Error rechazando solicitud:", error);
  }
}

// ===== ESCUCHAR PRÓXIMAS CLASES =====
function escucharProximasClases(mentorId) {
  return db.collection('sessions')
    .where('mentor_id', '==', mentorId)
    .where('status', 'in', ['accepted', 'active'])
    .orderBy('created_at', 'desc')
    .onSnapshot((snapshot) => {
      const clases = [];
      snapshot.forEach(doc => {
        clases.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`Próximas clases: ${clases.length}`);
    });
}

// ===== FINALIZAR CLASE =====
async function finalizarClaseFirebase(sessionId) {
  try {
    // Obtener datos de la sesión
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    const session = sessionDoc.data();
    
    // Actualizar estado a completada
    await db.collection('sessions').doc(sessionId).update({
      status: 'completed',
      completed_at: getTimestamp()
    });
    
    // Transferir dinero a la billetera del mentor (85% del precio, 15% comisión)
    const mentorGain = session.price * 0.85;
    
    await db.collection('users').doc(session.mentor_id).update({
      wallet_balance: firebase.firestore.FieldValue.increment(mentorGain),
      total_classes: firebase.firestore.FieldValue.increment(1)
    });
    
    // Crear transacción
    await db.collection('transactions').add({
      session_id: sessionId,
      mentor_id: session.mentor_id,
      student_id: session.student_id,
      amount: mentorGain,
      type: 'class_payment',
      created_at: getTimestamp()
    });
    
    alert('¡Clase finalizada! El pago ha sido procesado.');
    
  } catch (error) {
    console.error("Error finalizando clase:", error);
  }
}

// En js/mentor-module.js

// Variable temporal para guardar los cambios antes de enviarlos a Firebase
let disponibilidadTemporal = {};

function inicializarCalendarioMentor(disponibilidadActual = {}) {
    const contenedor = document.getElementById('calendar-grid');
    if (!contenedor) return;

    // Guardamos lo que viene de Firebase o iniciamos vacío
    disponibilidadTemporal = disponibilidadActual || {};

    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const horas = ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'];

    let html = '';

    // 1. Crear encabezados de días
    html += '<div style="grid-column: 1/-1; display: grid; grid-template-columns: 60px repeat(5, 1fr); gap: 5px; margin-bottom: 10px;">';
    html += '<div></div>'; // Espacio para la columna de horas
    dias.forEach(d => {
        html += `<div style="text-align: center; font-weight: bold; text-transform: capitalize; color: #555;">${d}</div>`;
    });
    html += '</div>';

    // 2. Crear filas por hora
    horas.forEach(hora => {
        html += `<div style="display: grid; grid-template-columns: 60px repeat(5, 1fr); gap: 5px; margin-bottom: 5px;">`;
        
        // Etiqueta de hora
        html += `<div style="display:flex; align-items:center; justify-content:flex-end; padding-right:10px; font-size:12px; font-weight:bold; color:#666;">${hora}</div>`;

        // Botones por día
        dias.forEach(dia => {
            // Verificar si esta hora ya está activa en la BD
            // Nota: Normalizamos quitando los ':' si tu BD usa formato '0900', o dejándolos si usa '09:00'
            const estaActivo = disponibilidadTemporal[dia] && disponibilidadTemporal[dia][hora] === true;
            
            const colorBg = estaActivo ? '#4FBDBA' : '#EDF2F7';
            const colorTxt = estaActivo ? 'white' : '#A0AEC0';

            html += `
                <div onclick="toggleHora('${dia}', '${hora}', this)" 
                     style="background: ${colorBg}; color: ${colorTxt}; border-radius: 6px; cursor: pointer; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 14px; transition: all 0.2s;"
                     data-activo="${estaActivo}">
                     ${estaActivo ? '✓' : '·'}
                </div>
            `;
        });
        html += `</div>`;
    });

    // 3. Botón de guardar cambios
    html += `
        <div style="margin-top: 20px; text-align: right;">
            <button onclick="guardarHorarioFirebase()" class="btn-primary" style="width: auto; padding: 10px 30px;">
                💾 Guardar Mi Horario
            </button>
        </div>
    `;

    contenedor.innerHTML = html;
    // Quitamos el estilo grid original del contenedor para usar el nuestro interno más flexible
    contenedor.style.display = 'block'; 
}

// Función para marcar/desmarcar (visual y lógica)
window.toggleHora = function(dia, hora, elemento) {
    // Inicializar el día si no existe
    if (!disponibilidadTemporal[dia]) disponibilidadTemporal[dia] = {};

    // Cambiar estado
    const estadoActual = elemento.getAttribute('data-activo') === 'true';
    const nuevoEstado = !estadoActual;

    // Actualizar lógica
    disponibilidadTemporal[dia][hora] = nuevoEstado;

    // Actualizar visual
    elemento.setAttribute('data-activo', nuevoEstado);
    elemento.style.background = nuevoEstado ? '#4FBDBA' : '#EDF2F7';
    elemento.style.color = nuevoEstado ? 'white' : '#A0AEC0';
    elemento.innerText = nuevoEstado ? '✓' : '·';
};

// Función para guardar en la BD
window.guardarHorarioFirebase = async function() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        await db.collection('users').doc(user.uid).update({
            availability: disponibilidadTemporal
        });
        alert("✅ Horario actualizado. Los estudiantes ahora verán tu nueva disponibilidad.");
    } catch (e) {
        console.error(e);
        alert("Error al guardar horario");
    }
};

// ===== VERIFICAR SI NECESITA CONFIGURAR TARIFA =====
async function verificarTarifaConfigrada(mentorId) {
  try {
    const mentorDoc = await db.collection('users').doc(mentorId).get();
    const mentor = mentorDoc.data();
    
    const card = document.getElementById('tarifa-action-card');
    if (!card) return;
    
    // Si ya tiene tarifa configurada (mayor a 0), ocultar la tarjeta
    if (mentor.hourly_rate && mentor.hourly_rate > 0) {
      card.style.display = 'none';
      console.log("✅ Tarifa ya configurada: $" + mentor.hourly_rate);
    } else {
      card.style.display = 'block';
      console.log("⚠️ Tarifa pendiente de configuración");
    }
  } catch (error) {
    console.error("Error verificando tarifa:", error);
  }
}

// ===== GUARDAR TARIFA (SOLO PRIMERA VEZ) =====
async function validarTarifa() {
    const rateInput = document.getElementById('mentor-rate');
    const precio = parseFloat(rateInput.value);
    
    if (!precio || precio <= 0) {
        alert("Por favor ingresa un precio válido (ej: 5)");
        return;
    }

    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("Error: No estás autenticado");
            return;
        }

        const btn = event.target;
        const textoOriginal = btn.innerText;
        btn.innerText = "Guardando...";
        btn.disabled = true;

        // Guardar en Firebase
        await db.collection('users').doc(user.uid).update({
            hourly_rate: precio,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`✅ Tarifa configurada: $${precio}/hora`);
        
        // ⚡ OCULTAR LA TARJETA PERMANENTEMENTE
        const card = document.getElementById('tarifa-action-card');
        if (card) {
            card.style.display = 'none';
        }

    } catch (error) {
        console.error("Error guardando tarifa:", error);
        alert("Hubo un error al guardar la tarifa.");
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}