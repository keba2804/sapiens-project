// ====================================
// MÓDULO DEL MENTOR
// ====================================

// ===== CARGAR DASHBOARD DEL MENTOR =====
async function cargarDashboardMentor(mentorId) {
    console.log("🚀 Cargando Dashboard para Mentor:", mentorId); // Log para verificar

    try {
        // 1. Cargar datos del perfil
        const mentorDoc = await db.collection('users').doc(mentorId).get();
        const mentor = mentorDoc.data();

        // 2. Llenar datos visuales (Nombre, Wallet, etc)
        if (document.getElementById('mentor-dash-name')) 
            document.getElementById('mentor-dash-name').innerText = mentor.name;
        
        if (document.getElementById('wallet-balance')) 
            document.getElementById('wallet-balance').textContent = "$" + (mentor.wallet_balance || 0).toFixed(2);

        // 3. CARGAR EL CALENDARIO (Solución punto 2)
        inicializarCalendarioMentor(mentor.availability);

        // 4. ACTIVAR ESCUCHA EN TIEMPO REAL (Solución punto 3)
        // Esto es lo que hace que aparezca "de una"
        escucharSolicitudesPendientes(mentorId);

    } catch (error) {
        console.error("Error cargando dashboard:", error);
    }
}

// ===== ESCUCHAR SOLICITUDES PENDIENTES EN TIEMPO REAL =====
function escucharSolicitudesPendientes(mentorId) {
  return db.collection('sessions')
    .where('mentor_id', '==', mentorId)
    .where('status', '==', 'pending')
    .orderBy('created_at', 'desc')
    .onSnapshot((snapshot) => {
      const solicitudes = [];
      snapshot.forEach(doc => {
        solicitudes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`Solicitudes pendientes: ${solicitudes.length}`);
      
      // Actualizar contador de notificaciones
      if (document.getElementById('pending-count')) {
        document.getElementById('pending-count').textContent = solicitudes.length;
      }
      
      // Mostrar en UI
      mostrarSolicitudesEnUI(solicitudes);
      
      // Reproducir sonido de notificación (opcional)
      if (solicitudes.length > 0) {
        console.log("🔔 Nueva solicitud recibida!");
      }
    });
}

// ===== MOSTRAR SOLICITUDES EN UI =====
function mostrarSolicitudesEnUI(solicitudes) {
  const container = document.getElementById('solicitudes-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (solicitudes.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999;">No tienes solicitudes pendientes</p>';
    return;
  }
  
  solicitudes.forEach(solicitud => {
    const div = document.createElement('div');
    div.className = 'solicitud-card';
    div.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 10px;
      border-left: 4px solid #4FBDBA;
    `;
    
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h3 style="margin: 0 0 5px 0;">${solicitud.student_name}</h3>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            📚 ${solicitud.subject}
          </p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            📅 ${solicitud.date} a las ${solicitud.time}
          </p>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">
            ⏱️ Duración: ${solicitud.duration} horas
          </p>
          <p style="margin: 5px 0; font-weight: bold; color: #4FBDBA;">
            💰 ${formatPrice(solicitud.price)}
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button onclick="aceptarSolicitud('${solicitud.id}')" 
                  style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
            ✓ Aceptar
          </button>
          <button onclick="rechazarSolicitud('${solicitud.id}')" 
                  style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">
            ✗ Rechazar
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

// ===== ACEPTAR SOLICITUD =====
async function aceptarSolicitud(sessionId) {
  try {
    await db.collection('sessions').doc(sessionId).update({
      status: 'accepted',
      updated_at: getTimestamp()
    });
    
    alert('¡Solicitud aceptada! La clase ha sido confirmada.');
    
  } catch (error) {
    console.error("Error aceptando solicitud:", error);
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