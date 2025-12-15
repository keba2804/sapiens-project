// ====================================
// MÓDULO DEL ESTUDIANTE (VERSIÓN COMPLETA FERIA)
// ====================================

// variable global para el listener
let unsubscribeMisClases = null;

// ===== 1. CARGAR TUTORES REALES DE FIREBASE =====
async function cargarTutores(filtroMateria = null) {
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
    
    // Ordenar por rating (los mejores primero)
    tutores.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    console.log(`Tutores cargados: ${tutores.length}`);
    return tutores;
    
  } catch (error) {
    console.error("Error cargando tutores:", error);
    return [];
  }
}

// ===== 2. ESCUCHAR MIS CLASES (CORE DEL MATCH EN FERIA) =====
function escucharMisClasesEstudiante(studentId) {
  // Evitar duplicar listeners
  if (unsubscribeMisClases) {
      unsubscribeMisClases();
  }

  // Escucha cambios en tiempo real
  unsubscribeMisClases = db.collection('sessions')
    .where('student_id', '==', studentId)
    .orderBy('created_at', 'desc')
    .onSnapshot((snapshot) => {
      const contenedor = document.getElementById('mis-clases-container');
      if (!contenedor) return;
      
      contenedor.innerHTML = ''; // Limpiar

      if (snapshot.empty) {
        contenedor.innerHTML = '<p style="color:#999; text-align:center; font-style:italic;">No tienes solicitudes activas. ¡Reserva una clase!</p>';
        return;
      }

      snapshot.forEach(doc => {
        const clase = doc.data();
        const claseId = doc.id;
        
        // Configuración visual de estados
        const estados = {
            'pending':   { color: '#F6E05E', texto: '⏳ Pendiente', borde: '#F6E05E' },
            'accepted':  { color: '#48BB78', texto: '✅ ¡Aceptada!', borde: '#48BB78' },
            'rejected':  { color: '#F56565', texto: '❌ Rechazada', borde: '#F56565' },
            'completed': { color: '#4299E1', texto: '🎓 Finalizada', borde: '#4299E1' }
        };

        const estado = estados[clase.status] || { color: '#ccc', texto: clase.status, borde: '#ccc' };

        // Crear tarjeta de solicitud
        const card = document.createElement('div');
        card.style.cssText = `
            background: white;
            border-left: 5px solid ${estado.borde};
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s;
        `;

        // Botón de acción según estado
        let botonAccion = '';
        if (clase.status === 'accepted') {
            botonAccion = `<button onclick="entrarSalaEstudiante('${claseId}')" style="display:block; margin-top:5px; font-size:12px; color:white; background:#48BB78; border:none; padding:5px 10px; border-radius:15px; cursor:pointer; font-weight:bold;">📹 Entrar a Sala</button>`;
        } else if (clase.status === 'completed' && !clase.rated) {
            botonAccion = `<button onclick="abrirModalCalificacion('${claseId}', '${clase.mentor_id}', '${clase.mentor_name}')" style="display:block; margin-top:5px; font-size:12px; color:white; background:#F6AD55; border:none; padding:5px 10px; border-radius:15px; cursor:pointer;">⭐ Calificar</button>`;
        }

        card.innerHTML = `
            <div>
                <h4 style="margin:0; color:#333; font-size:15px;">${clase.mentor_name}</h4>
                <p style="margin:4px 0 0; font-size:13px; color:#666;">📚 ${clase.subject}</p>
                <p style="margin:2px 0 0; font-size:12px; color:#999;">📅 ${clase.date} • ⏰ ${clase.time}</p>
            </div>
            <div style="text-align:right;">
                <span style="background: ${estado.color}20; color: ${estado.color}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid ${estado.color}40;">
                    ${estado.texto}
                </span>
                <div style="margin-top:5px;">${botonAccion}</div>
            </div>
        `;
        contenedor.appendChild(card);
      });
    });
}

// ===== 3. RESERVAR TUTORÍA (CONECTADO A FIREBASE) =====
async function reservarTutoria(tutorId, materia, fecha, hora, duracion = 1) {
  try {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión primero');
      return;
    }

    // Feedback inmediato
    const btnReserva = event?.target; 
    if(btnReserva) { btnReserva.innerText = "Enviando..."; btnReserva.disabled = true; }

    // 1. Obtener datos reales
    const tutorDoc = await db.collection('users').doc(tutorId).get();
    const studentDoc = await db.collection('users').doc(auth.currentUser.uid).get();
    
    if (!tutorDoc.exists) throw new Error("El mentor no existe");
    
    const tutor = tutorDoc.data();
    const student = studentDoc.data();

    // 2. Crear la sesión
    await db.collection('sessions').add({
      student_id: auth.currentUser.uid,
      mentor_id: tutorId,
      student_name: student.name,
      mentor_name: tutor.name,
      subject: materia,
      date: fecha,
      time: hora,
      duration: duracion,
      status: 'pending', // Estado inicial
      rated: false,
      price: (tutor.hourly_rate || 5) * duracion,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`✅ ¡Solicitud enviada a ${tutor.name}!\n\nRevisa la sección "Mis Clases" para ver cuando te acepte.`);
    
    // Restaurar botón (aunque la lista se actualiza sola)
    if(btnReserva) { btnReserva.innerText = "Reservado"; }
    
  } catch (error) {
    console.error("Error reservando:", error);
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