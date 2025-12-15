// ====================================
// MÓDULO DEL MENTOR
// ====================================

// ===== CARGAR DASHBOARD DEL MENTOR =====
async function cargarDashboardMentor(mentorId) {
  try {
    // Obtener datos del mentor
    const mentorDoc = await db.collection('users').doc(mentorId).get();
    const mentor = mentorDoc.data();
    
    // Actualizar billetera en UI
    if (document.getElementById('wallet-balance')) {
      document.getElementById('wallet-balance').textContent = formatPrice(mentor.wallet_balance);
    }
    
    // Actualizar rating
    if (document.getElementById('mentor-rating')) {
      document.getElementById('mentor-rating').textContent = mentor.rating.toFixed(1);
    }
    if (document.getElementById('reviews-count')) {
      document.getElementById('reviews-count').textContent = mentor.reviews_count;
    }
    
    // Cargar solicitudes pendientes
    escucharSolicitudesPendientes(mentorId);
    
    // Cargar próximas clases
    escucharProximasClases(mentorId);
    
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