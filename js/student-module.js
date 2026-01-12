// ====================================
// MÓDULO DEL ESTUDIANTE - VERSIÓN MEJORADA CON BÚSQUEDA Y ORDENAMIENTO
// ====================================

// variable global para el listener
let unsubscribeMisClases = null;
let ordenamientoActual = 'recientes';
let filtrosActivos = {};

// ===== 1. CARGAR TUTORES REALES DE FIREBASE CON ORDENAMIENTO =====
async function cargarTutores(filtroMateria = null, ordenamiento = 'recientes') {
  try {
    let query = db.collection('users')
      .where('role', '==', 'mentor');
    
    // Filtro opcional por materia
    if (filtroMateria && filtroMateria.trim() !== '') {
      query = query.where('subjects', 'array-contains', filtroMateria);
    }
    
    const snapshot = await query.get();
    const tutores = [];
    
    snapshot.forEach(doc => {
      tutores.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Aplicar ordenamiento según el criterio seleccionado
    switch(ordenamiento) {
      case 'recientes':
        // Ordenar por fecha de creación (más nuevos primero)
        tutores.sort((a, b) => {
          const fechaA = a.created_at?.toDate() || new Date(0);
          const fechaB = b.created_at?.toDate() || new Date(0);
          return fechaB - fechaA; // Descendente (más recientes primero)
        });
        break;
      
      case 'rating':
        // Ordenar por calificación (mejores primero)
        tutores.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      
      case 'precio-bajo':
        // Ordenar por precio (más barato primero)
        tutores.sort((a, b) => (a.hourly_rate || 99) - (b.hourly_rate || 99));
        break;
      
      case 'precio-alto':
        // Ordenar por precio (más caro primero)
        tutores.sort((a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
        break;
      
      case 'experiencia':
        // Ordenar por número de clases (más experimentados primero)
        tutores.sort((a, b) => (b.total_classes || 0) - (a.total_classes || 0));
        break;
      
      default:
        // Por defecto: más recientes
        tutores.sort((a, b) => {
          const fechaA = a.created_at?.toDate() || new Date(0);
          const fechaB = b.created_at?.toDate() || new Date(0);
          return fechaB - fechaA;
        });
    }
    
    console.log(`Tutores cargados: ${tutores.length} (ordenados por: ${ordenamiento})`);
    return tutores;
    
  } catch (error) {
    console.error("Error cargando tutores:", error);
    return [];
  }
}

// ===== BÚSQUEDA AVANZADA DE MENTORES =====
async function buscarMentores(criterios = {}) {
  try {
    const { 
      texto = '', 
      materia = null, 
      universidad = null, 
      precioMax = null,
      ratingMin = null,
      ordenamiento = 'recientes'
    } = criterios;
    
    console.log("🔍 Buscando mentores con criterios:", criterios);
    
    // Obtener todos los mentores
    let tutores = await cargarTutores(materia, ordenamiento);
    
    // Aplicar filtros adicionales
    tutores = tutores.filter(tutor => {
      // Filtro por texto (nombre, materias, universidad)
      if (texto && texto.trim() !== '') {
        const textoLower = texto.toLowerCase();
        const nombreMatch = tutor.name?.toLowerCase().includes(textoLower);
        const materiasMatch = tutor.subjects?.some(m => m.toLowerCase().includes(textoLower));
        const uniMatch = tutor.university?.toLowerCase().includes(textoLower);
        
        if (!nombreMatch && !materiasMatch && !uniMatch) {
          return false;
        }
      }
      
      // Filtro por universidad
      if (universidad && universidad !== 'todas') {
        if (tutor.university !== universidad) {
          return false;
        }
      }
      
      // Filtro por precio máximo
      if (precioMax && tutor.hourly_rate > precioMax) {
        return false;
      }
      
      // Filtro por rating mínimo
      if (ratingMin && (tutor.rating || 0) < ratingMin) {
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ Búsqueda completada: ${tutores.length} resultados`);
    return tutores;
    
  } catch (error) {
    console.error("❌ Error en búsqueda:", error);
    return [];
  }
}

// ===== APLICAR BÚSQUEDA DESDE LA UI =====
async function aplicarBusqueda() {
  const texto = document.getElementById('search-input-mentores')?.value || '';
  const materia = document.getElementById('filtro-materia')?.value || null;
  const universidad = document.getElementById('filtro-universidad')?.value || 'todas';
  const precioMax = parseFloat(document.getElementById('filtro-precio')?.value) || null;
  const ratingMin = parseFloat(document.getElementById('filtro-rating')?.value) || null;
  const ordenamiento = document.getElementById('select-ordenamiento')?.value || 'recientes';
  
  filtrosActivos = {
    texto,
    materia: materia && materia !== 'todas' ? materia : null,
    universidad: universidad !== 'todas' ? universidad : null,
    precioMax,
    ratingMin,
    ordenamiento
  };
  
  mostrarLoader('Buscando mentores...');
  
  try {
    const tutores = await buscarMentores(filtrosActivos);
    const gridTutores = document.getElementById('tutores-reales-grid');
    
    if (gridTutores) {
      renderizarTutores(tutores, gridTutores);
      
      // Actualizar contador
      const badge = document.getElementById('mentor-count-badge');
      if (badge) {
        badge.textContent = `${tutores.length} Encontrado${tutores.length !== 1 ? 's' : ''}`;
      }
      
      // Mostrar mensaje si no hay resultados
      if (tutores.length === 0) {
        gridTutores.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">🔍</div>
            <h3 style="color: #666; margin: 0 0 10px 0;">No encontramos mentores</h3>
            <p style="color: #999; margin: 0;">Intenta ajustar los filtros de búsqueda</p>
            <button onclick="limpiarFiltros()" style="margin-top: 20px; padding: 12px 30px; background: #4FBDBA; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
              Limpiar Filtros
            </button>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Error aplicando búsqueda:", error);
    mostrarAlerta('Error al buscar mentores', 'error');
  } finally {
    ocultarLoader();
  }
}

// ===== LIMPIAR FILTROS =====
function limpiarFiltros() {
  if (document.getElementById('search-input-mentores')) {
    document.getElementById('search-input-mentores').value = '';
  }
  if (document.getElementById('filtro-materia')) {
    document.getElementById('filtro-materia').value = 'todas';
  }
  if (document.getElementById('filtro-universidad')) {
    document.getElementById('filtro-universidad').value = 'todas';
  }
  if (document.getElementById('filtro-precio')) {
    document.getElementById('filtro-precio').value = '';
  }
  if (document.getElementById('filtro-rating')) {
    document.getElementById('filtro-rating').value = '';
  }
  if (document.getElementById('select-ordenamiento')) {
    document.getElementById('select-ordenamiento').value = 'recientes';
  }
  
  filtrosActivos = {};
  aplicarBusqueda();
}

// ===== 2. ESCUCHAR MIS CLASES (CON TIEMPO REAL MEJORADO) =====
function escucharMisClasesEstudiante(studentId) {
  console.log("👂 Estudiante escuchando cambios en sus clases:", studentId);
  
  // Evitar duplicar listeners
  if (unsubscribeMisClases) {
      unsubscribeMisClases();
  }

  // ⚡ Escucha cambios en tiempo real
  unsubscribeMisClases = db.collection('sessions')
    .where('student_id', '==', studentId)
    .orderBy('created_at', 'desc')
    .onSnapshot((snapshot) => {
      const contenedor = document.getElementById('mis-clases-container');
      if (!contenedor) return;
      
      // Detectar cambios en tiempo real
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          console.log(`🔄 Solicitud actualizada: ${change.doc.id} -> status: ${data.status}`);
          
          // Notificación visual cuando aceptan
          if (data.status === 'accepted') {
            console.log("🎉 ¡Un mentor aceptó tu solicitud!");
            // Opcional: mostrar notificación toast
            mostrarNotificacion(`✅ ¡${data.mentor_name} aceptó tu clase!`);
          }
        }
        
        if (change.type === 'added') {
          console.log(`🆕 Nueva clase agregada: ${change.doc.id}`);
        }
      });
      
      contenedor.innerHTML = ''; // Limpiar

      if (snapshot.empty) {
        contenedor.innerHTML = '<p style="color:#999; text-align:center; font-style:italic; padding:20px;">No tienes solicitudes activas. ¡Reserva una clase!</p>';
        return;
      }

      snapshot.forEach(doc => {
        const clase = doc.data();
        const claseId = doc.id;
        
        // Configuración visual de estados
        const estados = {
            'pending':   { color: '#F6E05E', texto: '⏳ Pendiente', borde: '#F6E05E', bg: '#FFFBEB' },
            'accepted':  { color: '#48BB78', texto: '✅ ¡Aceptada!', borde: '#48BB78', bg: '#F0FFF4' },
            'rejected':  { color: '#F56565', texto: '❌ Rechazada', borde: '#F56565', bg: '#FFF5F5' },
            'completed': { color: '#4299E1', texto: '🎓 Finalizada', borde: '#4299E1', bg: '#EBF8FF' }
        };

        const estado = estados[clase.status] || { color: '#ccc', texto: clase.status, borde: '#ccc', bg: '#f5f5f5' };

        // Crear tarjeta de solicitud
        const card = document.createElement('div');
        card.id = `clase-card-${claseId}`;
        card.style.cssText = `
            background: ${estado.bg};
            border-left: 5px solid ${estado.borde};
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            animation: fadeIn 0.3s ease;
        `;

        // Botón de acción según estado
        let botonAccion = '';
        if (clase.status === 'accepted') {
            botonAccion = `<button onclick="entrarSalaEstudiante('${claseId}')" style="display:block; margin-top:8px; font-size:13px; color:white; background:#48BB78; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#38A169'" onmouseout="this.style.background='#48BB78'">📹 Entrar a Sala</button>`;
        } else if (clase.status === 'completed' && !clase.rated) {
            botonAccion = `<button onclick="abrirModalCalificacion('${claseId}', '${clase.mentor_id}', '${clase.mentor_name}')" style="display:block; margin-top:8px; font-size:13px; color:white; background:#F6AD55; border:none; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:bold;">⭐ Calificar</button>`;
        }

        card.innerHTML = `
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            <div>
                <h4 style="margin:0; color:#333; font-size:16px; font-weight:700;">${clase.mentor_name}</h4>
                <p style="margin:4px 0 0; font-size:13px; color:#666;">📚 ${clase.subject}</p>
                <p style="margin:2px 0 0; font-size:12px; color:#999;">📅 ${clase.date} • ⏰ ${clase.time}</p>
                <p style="margin:2px 0 0; font-size:12px; color:#666;">⏱️ Duración: <strong>${clase.duration}h</strong></p>
            </div>
            <div style="text-align:right;">
                <span style="background: ${estado.color}20; color: ${estado.color}; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; border: 1px solid ${estado.color}40;">
                    ${estado.texto}
                </span>
                <div style="margin-top:8px;">${botonAccion}</div>
            </div>
        `;
        contenedor.appendChild(card);
      });
    }, (error) => {
      console.error("❌ Error en listener estudiante:", error);
      // Reintentar después de 3 segundos
      setTimeout(() => {
        console.log("🔄 Reintentando conexión...");
        escucharMisClasesEstudiante(studentId);
      }, 3000);
    });
}

// ===== 3. RESERVAR TUTORÍA (CONECTADO A FIREBASE) =====
async function reservarTutoria(tutorId, materia, fecha, hora, duracion = 1) {
  try {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión primero');
      return;
    }

    console.log("📝 Creando solicitud para mentor:", tutorId);

    // Feedback inmediato
    const btnReserva = event?.target; 
    if(btnReserva) { btnReserva.innerText = "Enviando..."; btnReserva.disabled = true; }

    // 1. Obtener datos reales
    const tutorDoc = await db.collection('users').doc(tutorId).get();
    const studentDoc = await db.collection('users').doc(auth.currentUser.uid).get();
    
    if (!tutorDoc.exists) throw new Error("El mentor no existe");
    
    const tutor = tutorDoc.data();
    const student = studentDoc.data();

    // 2. ⚡ CREAR LA SESIÓN CON LOGS DETALLADOS
    const sessionData = {
      student_id: auth.currentUser.uid,
      mentor_id: tutorId, // ⚡ CRÍTICO
      student_name: student.name,
      mentor_name: tutor.name,
      subject: materia,
      date: fecha,
      time: hora,
      duration: duracion,
      status: 'pending',
      rated: false,
      price: (tutor.hourly_rate || 5) * duracion,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log("💾 Guardando sesión con estos datos:", sessionData);
    
    const docRef = await db.collection('sessions').add(sessionData);
    
    console.log("✅ Sesión creada con ID:", docRef.id);
    console.log("🎯 mentor_id guardado:", tutorId);
    console.log("👤 Para el mentor:", tutor.name);

    alert(`✅ ¡Solicitud enviada a ${tutor.name}!\n\nRevisa la sección "Mis Clases" para ver cuando te acepte.`);
    
    // Restaurar botón
    if(btnReserva) { btnReserva.innerText = "Reservado"; }
    
  } catch (error) {
    console.error("❌ Error reservando:", error);
    alert('Error al reservar: ' + error.message);
    if(btnReserva) { btnReserva.innerText = "Reintentar"; btnReserva.disabled = false; }
  }
}

// ===== 4. FUNCIONES RECUPERADAS (PERFIL Y CALIFICACIÓN) =====

// Ver Perfil Completo (Recuperada)
async function verPerfilTutor(tutorId) {
  try {
    const tutorDoc = await db.collection('users').doc(tutorId).get();
    const tutor = tutorDoc.data();
    
    alert(`
    👤 PERFIL DE MENTOR
    -------------------
    Nombre: ${tutor.name}
    Universidad: ${tutor.university}
    ⭐ Rating: ${tutor.rating ? tutor.rating.toFixed(1) : '5.0'}
    💰 Tarifa: $${tutor.hourly_rate}/h
    
    📚 Materias: ${tutor.subjects.join(', ')}
    `);
  } catch (error) {
    console.error("Error viendo perfil:", error);
  }
}

// Calificar Mentor (Recuperada y Mejorada)
async function calificarMentor(sessionId, mentorId, rating) {
  try {
    // 1. Guardar reseña
    await db.collection('reviews').add({
      session_id: sessionId,
      mentor_id: mentorId,
      rating: rating,
      student_id: auth.currentUser.uid,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2. Marcar sesión como calificada
    await db.collection('sessions').doc(sessionId).update({
      rated: true
    });

    // 3. Recalcular promedio del mentor (Lógica simplificada para frontend)
    // Nota: En una app real esto se hace con Cloud Functions, pero aquí hacemos un "truco" rápido
    const reviewsSnap = await db.collection('reviews').where('mentor_id', '==', mentorId).get();
    let suma = 0;
    reviewsSnap.forEach(r => suma += r.data().rating);
    const nuevoPromedio = suma / reviewsSnap.size;

    await db.collection('users').doc(mentorId).update({
      rating: nuevoPromedio,
      reviews_count: reviewsSnap.size
    });

    alert("¡Gracias por tu calificación! ⭐");

  } catch (error) {
    console.error("Error calificando:", error);
    alert("Error al guardar calificación");
  }
}

// ===== 5. UTILIDADES DE UI =====

function entrarSalaEstudiante(sessionId) {
    // Aquí podrías redirigir a una sala real o mostrar el modal simulado
    document.getElementById('meeting-screen').style.display = 'block';
    document.getElementById('marketplace-screen').style.display = 'none';
}

function abrirModalCalificacion(sessionId, mentorId, mentorName) {
    const rating = prompt(`Califica tu clase con ${mentorName} (1-5):`);
    if (rating && rating >= 1 && rating <= 5) {
        calificarMentor(sessionId, mentorId, parseInt(rating));
    }
}

// ===== NOTIFICACIÓN TOAST (OPCIONAL) =====
function mostrarNotificacion(mensaje) {
  // Crear elemento de notificación
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #48BB78;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    font-weight: bold;
    font-size: 14px;
    z-index: 999999;
    animation: slideInRight 0.3s ease;
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
    </style>
    ${mensaje}
  `;
  
  document.body.appendChild(toast);
  
  // Auto-ocultar después de 4 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 4000);
}

console.log("✅ Módulo Estudiante MEJORADO: Búsqueda + Ordenamiento + Filtros");