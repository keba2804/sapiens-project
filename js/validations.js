// ====================================
// VALIDACIONES Y SEGURIDAD - SAPIENS
// ====================================

// ===== VALIDAR EMAIL =====
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ===== VALIDAR CONTRASEÑA =====
function validarPassword(password) {
  if (password.length < 6) {
    return { valido: false, mensaje: "La contraseña debe tener al menos 6 caracteres" };
  }
  return { valido: true };
}

// ===== VALIDAR FECHA =====
function validarFecha(fecha) {
  const fechaObj = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (fechaObj < hoy) {
    return { valido: false, mensaje: "No puedes reservar en el pasado" };
  }
  
  return { valido: true };
}

// ===== SANITIZAR INPUT =====
function sanitizarInput(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ===== VERIFICAR CONEXIÓN A INTERNET =====
function verificarConexion() {
  return navigator.onLine;
}

// ===== MOSTRAR ALERTA PERSONALIZADA =====
function mostrarAlerta(mensaje, tipo = 'info') {
  const colores = {
    success: '#48BB78',
    error: '#F56565',
    warning: '#F6AD55',
    info: '#4299E1'
  };
  
  const iconos = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const alerta = document.createElement('div');
  alerta.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px 40px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    z-index: 99999999;
    min-width: 300px;
    text-align: center;
    animation: fadeIn 0.3s ease;
  `;
  
  alerta.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -60%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
      }
    </style>
    <div style="font-size: 48px; margin-bottom: 15px;">${iconos[tipo]}</div>
    <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.6;">${mensaje}</p>
    <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 30px; background: ${colores[tipo]}; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px;">
      Entendido
    </button>
  `;
  
  document.body.appendChild(alerta);
  
  setTimeout(() => {
    if (document.body.contains(alerta)) {
      alerta.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(alerta)) {
          document.body.removeChild(alerta);
        }
      }, 300);
    }
  }, 5000);
}

// ===== LOADER GLOBAL =====
function mostrarLoader(mensaje = 'Cargando...') {
  const existente = document.getElementById('global-loader');
  if (existente) return;
  
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 999999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;
  
  loader.innerHTML = `
    <div style="width: 60px; height: 60px; border: 5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <p style="color: white; margin-top: 20px; font-size: 16px; font-weight: bold;">${mensaje}</p>
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  
  document.body.appendChild(loader);
}

function ocultarLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(loader)) {
        document.body.removeChild(loader);
      }
    }, 300);
  }
}

// ===== VALIDAR DISPONIBILIDAD DE FIRESTORE =====
async function verificarFirestore() {
  try {
    if (typeof db === 'undefined') {
      console.log("⏳ Esperando inicialización de Firestore...");
      return false;
    }
    
    await db.collection('_health_check').doc('test').set({ 
      timestamp: firebase.firestore.FieldValue.serverTimestamp() 
    });
    
    console.log("✅ Firestore conectado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Firestore desconectado:", error);
    mostrarAlerta('Error de conexión. Por favor verifica tu internet.', 'error');
    return false;
  }
}

// ===== DETECTAR CAMBIOS DE CONECTIVIDAD =====
window.addEventListener('online', () => {
  console.log("✅ Conexión restaurada");
  if (typeof mostrarNotificacionMentor === 'function') {
    mostrarNotificacionMentor('✅ Conexión restaurada', 'success');
  } else {
    mostrarAlerta('✅ Conexión restaurada', 'success');
  }
});

window.addEventListener('offline', () => {
  console.log("⚠️ Sin conexión");
  if (typeof mostrarNotificacionMentor === 'function') {
    mostrarNotificacionMentor('⚠️ Sin conexión a internet', 'warning');
  } else {
    mostrarAlerta('⚠️ Sin conexión a internet', 'warning');
  }
});

// ===== VERIFICAR AL CARGAR =====
window.addEventListener('load', () => {
  setTimeout(() => {
    verificarFirestore();
  }, 2000);
});

console.log("✅ Módulo de validaciones cargado");