// ====================================
// MÓDULO DEL MENTOR - VERSIÓN MEJORADA
// ====================================

// ===== CARGAR DASHBOARD DEL MENTOR =====
async function cargarDashboardMentor(mentorId) {
    console.log("🚀 Cargando Dashboard para Mentor:", mentorId);

    try {
        // 1. Cargar datos del perfil
        const mentorDoc = await db.collection('users').doc(mentorId).get();
        const mentor = mentorDoc.data();

        // 2. Llenar datos visuales (Nombre, Wallet, Foto, etc)
        if (document.getElementById('mentor-dash-name')) 
            document.getElementById('mentor-dash-name').innerText = mentor.name;
        
        // ⚡ CARGAR FOTO DE PERFIL
        if (document.getElementById('mentor-profile-pic')) {
            const fotoURL = mentor.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=4FBDBA`;
            document.getElementById('mentor-profile-pic').src = fotoURL;
        }
        
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
        mostrarTarifaMentor(mentor.hourly_rate);
        inicializarCalendarioMentor(mentor.availability);

        // 4. ⚡ ACTIVAR ESCUCHAS EN TIEMPO REAL ⚡
        console.log("🔥 Activando listeners en tiempo real...");
        
        escucharSolicitudesPendientes(mentorId);
        escucharClasesAceptadas(mentorId);
        verificarTarifaConfigrada(mentorId);

        
        // 5. ⚡ MOSTRAR NOTIFICACIÓN DE BIENVENIDA
        setTimeout(() => {
            mostrarNotificacionMentor('✅ Panel de mentor cargado correctamente');
        }, 500);

    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
        alert('Error al cargar dashboard: ' + error.message);
    }
}

// ===== ESCUCHAR SOLICITUDES PENDIENTES EN TIEMPO REAL =====
function escucharSolicitudesPendientes(mentorId) {
  console.log("👂 Escuchando solicitudes para:", mentorId);
  
  const unsubscribe = db.collection('sessions')
    .where('mentor_id', '==', mentorId)
    .where('status', '==', 'pending')
    .orderBy('created_at', 'desc')
    .onSnapshot((snapshot) => {
      const solicitudes = [];
      
      // ⚡ DETECTAR NUEVAS SOLICITUDES Y MOSTRAR NOTIFICACIÓN
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log("🆕 Nueva solicitud detectada:", change.doc.id);
          
          // 🔔 NOTIFICACIÓN EN TIEMPO REAL
          mostrarNotificacionMentor(`🎉 Nueva solicitud de ${data.student_name}`);
          
          // 🔊 SONIDO DE NOTIFICACIÓN
          reproducirSonidoNotificacion();
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
        badge.style.display = solicitudes.length > 0 ? 'inline-block' : 'none';
        
        // ⚡ ANIMACIÓN DE PULSO CUANDO HAY SOLICITUDES
        if (solicitudes.length > 0) {
          badge.style.animation = 'pulse 2s infinite';
        }
      }
      
      // Mostrar en UI
      mostrarSolicitudesEnUI(solicitudes);
      
    }, (error) => {
      console.error("❌ Error en listener:", error);
      setTimeout(() => {
        console.log("🔄 Reintentando conexión...");
        escucharSolicitudesPendientes(mentorId);
      }, 3000);
    });
    
  window.mentorListener = unsubscribe;
  return unsubscribe;
}

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
async function aceptarSolicitud(sessionId) {
  try {
    console.log("✅ Aceptando solicitud:", sessionId);
    
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();
    const sessionData = sessionDoc.data();
    
    await db.collection('sessions').doc(sessionId).update({
      status: 'accepted',
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // ⚡ BLOQUEAR HORARIO
    const mentorId = sessionData.mentor_id;
    const fecha = sessionData.date;
    const hora = sessionData.time;
    
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];
    
    console.log(`🔒 Bloqueando: ${diaSemana} a las ${hora}`);
    
    const mentorDoc = await db.collection('users').doc(mentorId).get();
    const availability = mentorDoc.data().availability || {};
    
    if (!availability[diaSemana]) {
      availability[diaSemana] = {};
    }
    
    availability[diaSemana][hora] = false;
    
    await db.collection('users').doc(mentorId).update({
      availability: availability
    });
    
    console.log("✅ Horario bloqueado correctamente");
    
    mostrarNotificacionMentor('✅ Solicitud aceptada y calendario actualizado', 'success');
    
    if (typeof inicializarCalendarioMentor === 'function') {
      inicializarCalendarioMentor(availability);
    }
    
  } catch (error) {
    console.error("❌ Error aceptando solicitud:", error);
    mostrarNotificacionMentor('Error al aceptar: ' + error.message, 'error');
  }
}

// ===== RECHAZAR SOLICITUD =====
async function rechazarSolicitud(sessionId) {
  try {
    await db.collection('sessions').doc(sessionId).update({
      status: 'rejected',
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    mostrarNotificacionMentor('Solicitud rechazada', 'info');
    
  } catch (error) {
    console.error("Error rechazando solicitud:", error);
  }
}

// ===== ESCUCHAR CLASES ACEPTADAS =====
function escucharClasesAceptadas(mentorId) {
  console.log("📅 Escuchando clases aceptadas para mentor:", mentorId);
  
  return db.collection('sessions')
    .where('mentor_id', '==', mentorId)
    .where('status', '==', 'accepted')
    .onSnapshot((snapshot) => {
      const clasesAceptadas = [];
      
      snapshot.forEach(doc => {
        clasesAceptadas.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📚 Clases agendadas: ${clasesAceptadas.length}`);
      
      clasesAceptadas.sort((a, b) => {
        const fechaA = new Date(a.date + 'T' + a.time);
        const fechaB = new Date(b.date + 'T' + b.time);
        return fechaA - fechaB;
      });
      
      mostrarClasesAceptadasEnUI(clasesAceptadas);
      actualizarProximaClase(clasesAceptadas);
      
    }, (error) => {
      console.error("❌ Error escuchando clases aceptadas:", error);
    });
}

// ===== MOSTRAR CLASES ACEPTADAS EN UI =====
function mostrarClasesAceptadasEnUI(clases) {
  const container = document.getElementById('clases-aceptadas-container');
  if (!container) return;
  
  container.innerHTML = '';
  const badge = document.getElementById('clases-count');
  if (badge) badge.textContent = clases.length;
  
  if (clases.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; background:white; border-radius:16px; border:2px dashed #E2E8F0;">
        <div style="font-size:40px; margin-bottom:10px; opacity:0.5;">📭</div>
        <p style="color:#999; margin:0; font-size:14px;">No tienes clases agendadas</p>
      </div>
    `;
    return;
  }
  
  clases.forEach(clase => {
    const fechaObj = new Date(clase.date + 'T' + clase.time);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const div = document.createElement('div');
    div.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border-left: 4px solid #48BB78;
      transition: transform 0.2s;
      cursor: pointer;
    `;
    
    div.onmouseover = () => div.style.transform = 'translateY(-3px)';
    div.onmouseout = () => div.style.transform = 'translateY(0)';
    
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(clase.student_name)}&background=48BB78&color=fff" 
                 style="width:40px; height:40px; border-radius:50%; border:2px solid #48BB78;">
            <div>
              <h4 style="margin:0; font-size:16px; color:#333;">${clase.student_name}</h4>
              <span style="background:#F0FFF4; color:#48BB78; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">
                Confirmada
              </span>
            </div>
          </div>
          
          <div style="margin-left:50px;">
            <p style="margin:5px 0; color:#666; font-size:14px;">📚 <strong>${clase.subject}</strong></p>
            <p style="margin:5px 0; color:#666; font-size:13px;">📅 ${fechaFormateada} • ⏰ ${clase.time}</p>
            <p style="margin:5px 0; color:#666; font-size:13px;">⏱️ Duración: <strong>${clase.duration}h</strong></p>
            <p style="margin:8px 0 0 0; font-weight:bold; color:#48BB78; font-size:16px;">💰 ${formatPrice(clase.price)}</p>
          </div>
        </div>
        
        <div>
          <button onclick="iniciarSalaMentor('${clase.id}')" 
                  style="background:#48BB78; color:white; border:none; padding:10px 20px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:13px; transition:0.2s;"
                  onmouseover="this.style.background='#38A169'" 
                  onmouseout="this.style.background='#48BB78'">
            📹 Iniciar Clase
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

// ===== ACTUALIZAR TARJETA DE PRÓXIMA CLASE =====
function actualizarProximaClase(clases) {
  const emptyCard = document.getElementById('empty-state-card');
  const nextClassCard = document.getElementById('next-class-card');
  
  if (clases.length === 0) {
    if (emptyCard) emptyCard.style.display = 'flex';
    if (nextClassCard) nextClassCard.style.display = 'none';
    return;
  }
  
  const proximaClase = clases[0];
  const fechaObj = new Date(proximaClase.date + 'T' + proximaClase.time);
  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  if (emptyCard) emptyCard.style.display = 'none';
  if (nextClassCard) {
    nextClassCard.style.display = 'flex';
    nextClassCard.innerHTML = `
      <div class="stat-title"><span>📅 Próxima Clase</span></div>
      <div style="margin-top:10px;">
        <h4 style="margin:0 0 5px 0; font-size:18px; color:#333;">${proximaClase.student_name}</h4>
        <p style="margin:0; font-size:13px; color:#666;">📚 ${proximaClase.subject}</p>
        <p style="margin:5px 0; font-size:14px; color:#4FBDBA; font-weight:bold;">📅 ${fechaFormateada} • ⏰ ${proximaClase.time}</p>
      </div>
      <button onclick="iniciarSalaMentor('${proximaClase.id}')" style="margin-top:15px; width:100%; padding:10px; background:#48BB78; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px;">
        📹 Iniciar Ahora
      </button>
    `;
  }
}

// ===== CALENDARIO =====
let disponibilidadTemporal = {};

function inicializarCalendarioMentor(disponibilidadActual = {}) {
    const contenedor = document.getElementById('calendar-grid');
    if (!contenedor) return;

    disponibilidadTemporal = disponibilidadActual || {};

    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    const horas = ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'];

    let html = '';
    html += '<div style="grid-column: 1/-1; display: grid; grid-template-columns: 60px repeat(5, 1fr); gap: 5px; margin-bottom: 10px;">';
    html += '<div></div>';
    dias.forEach(d => {
        html += `<div style="text-align: center; font-weight: bold; text-transform: capitalize; color: #555;">${d}</div>`;
    });
    html += '</div>';

    horas.forEach(hora => {
        html += `<div style="display: grid; grid-template-columns: 60px repeat(5, 1fr); gap: 5px; margin-bottom: 5px;">`;
        html += `<div style="display:flex; align-items:center; justify-content:flex-end; padding-right:10px; font-size:12px; font-weight:bold; color:#666;">${hora}</div>`;

        dias.forEach(dia => {
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

    html += `
        <div style="margin-top: 20px; text-align: right;">
            <button onclick="guardarHorarioFirebase()" class="btn-primary" style="width: auto; padding: 10px 30px;">
                💾 Guardar Mi Horario
            </button>
        </div>
    `;

    contenedor.innerHTML = html;
    contenedor.style.display = 'block';
}

window.toggleHora = function(dia, hora, elemento) {
    if (!disponibilidadTemporal[dia]) disponibilidadTemporal[dia] = {};

    const estadoActual = elemento.getAttribute('data-activo') === 'true';
    const nuevoEstado = !estadoActual;

    disponibilidadTemporal[dia][hora] = nuevoEstado;

    elemento.setAttribute('data-activo', nuevoEstado);
    elemento.style.background = nuevoEstado ? '#4FBDBA' : '#EDF2F7';
    elemento.style.color = nuevoEstado ? 'white' : '#A0AEC0';
    elemento.innerText = nuevoEstado ? '✓' : '·';
};

window.guardarHorarioFirebase = async function() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        await db.collection('users').doc(user.uid).update({
            availability: disponibilidadTemporal
        });
        mostrarNotificacionMentor("✅ Horario actualizado correctamente", 'success');
    } catch (e) {
        console.error(e);
        mostrarNotificacionMentor("Error al guardar horario", 'error');
    }
};

// ===== VERIFICAR TARIFA =====
async function verificarTarifaConfigrada(mentorId) {
  try {
    const mentorDoc = await db.collection('users').doc(mentorId).get();
    const mentor = mentorDoc.data();
    
    const card = document.getElementById('tarifa-action-card');
    if (!card) return;
    
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

async function validarTarifa() {
    const rateInput = document.getElementById('mentor-rate');
    const precio = parseFloat(rateInput.value);
    
    if (!precio || precio <= 0) {
        mostrarNotificacionMentor("Por favor ingresa un precio válido", 'warning');
        return;
    }

    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        await db.collection('users').doc(user.uid).update({
            hourly_rate: precio,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        mostrarNotificacionMentor(`✅ Tarifa configurada: $${precio}/hora`, 'success');
        
        const card = document.getElementById('tarifa-action-card');
        if (card) card.style.display = 'none';

    } catch (error) {
        console.error("Error guardando tarifa:", error);
        mostrarNotificacionMentor("Error al guardar la tarifa", 'error');
    }
}

// ===== SISTEMA DE NOTIFICACIONES =====
function mostrarNotificacionMentor(mensaje, tipo = 'success') {
  const colores = {
    success: '#48BB78',
    info: '#4299E1',
    warning: '#F6AD55',
    error: '#F56565'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colores[tipo]};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    font-weight: bold;
    font-size: 14px;
    z-index: 999999;
    animation: slideInRight 0.3s ease;
    max-width: 350px;
  `;
  
  toast.innerHTML = `
    <style>
      @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
    ${mensaje}
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

function reproducirSonidoNotificacion() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log('Audio no disponible');
  }
}

// ===== MOSTRAR TARIFA EN DASHBOARD =====
function mostrarTarifaMentor(tarifa) {
    // Buscar si existe algún elemento que muestre la tarifa en el dashboard
    const tarifaCard = document.getElementById('tarifa-action-card');
    
    if (tarifaCard && tarifa && tarifa > 0) {
        // Si tiene tarifa configurada, ocultar el card de "Acción Requerida"
        tarifaCard.style.display = 'none';
        console.log("✅ Tarifa configurada: $" + tarifa);
    } else if (tarifaCard) {
        // Si no tiene tarifa, mostrar el card
        tarifaCard.style.display = 'block';
        console.log("⚠️ Tarifa no configurada");
    }
}