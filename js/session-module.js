// ====================================
// MÓDULO DE SALA DE CLASES EN VIVO
// ====================================

let currentSessionId = null;
let chatListener = null;

// ===== ENTRAR A LA SALA =====
async function entrarSala(sessionId) {
  try {
    currentSessionId = sessionId;
    
    // Actualizar estado de la sesión a "activa"
    await db.collection('sessions').doc(sessionId).update({
      status: 'active',
      started_at: getTimestamp()
    });
    
    console.log("Sesión iniciada:", sessionId);
    alert("¡Sala iniciada! En una app real, aquí iniciaría la videollamada.");
    
  } catch (error) {
    console.error("Error entrando a la sala:", error);
  }
}

// ===== INICIAR CHAT EN TIEMPO REAL =====
function iniciarChat(sessionId) {
  // Escuchar mensajes en tiempo real
  chatListener = db.collection('sessions')
    .doc(sessionId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .onSnapshot((snapshot) => {
      console.log(`Mensajes en el chat: ${snapshot.size}`);
      
      snapshot.forEach(doc => {
        const mensaje = doc.data();
        console.log(`${mensaje.sender_name}: ${mensaje.text}`);
      });
    });
}

// ===== ENVIAR MENSAJE =====
async function enviarMensaje(sessionId, texto) {
  try {
    if (!texto.trim()) return;
    
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const userName = userDoc.data().name;
    
    await db.collection('sessions')
      .doc(sessionId)
      .collection('messages')
      .add({
        sender_id: currentUser.uid,
        sender_name: userName,
        text: texto,
        timestamp: getTimestamp(),
        type: 'text'
      });
    
    console.log("Mensaje enviado");
    
  } catch (error) {
    console.error("Error enviando mensaje:", error);
  }
}

// ===== FINALIZAR CLASE =====
async function finalizarClase(sessionId) {
  try {
    if (!confirm('¿Estás seguro de finalizar la clase?')) return;
    
    await finalizarClaseFirebase(sessionId);
    
    // Detener listener del chat
    if (chatListener) {
      chatListener();
    }
    
  } catch (error) {
    console.error("Error finalizando clase:", error);
  }
}