// ====================================
// MÓDULO DEL ESTUDIANTE
// ====================================

// ===== CARGAR TUTORES DISPONIBLES =====
async function cargarTutores(filtroMateria = null) {
  try {
    let query = db.collection('users')
      .where('role', '==', 'mentor')
      .where('status', '==', 'verified');
    
    // Aplicar filtro de materia si existe
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
    
    // Ordenar por rating
    tutores.sort((a, b) => b.rating - a.rating);
    
    console.log(`Tutores cargados: ${tutores.length}`);
    return tutores;
    
  } catch (error) {
    console.error("Error cargando tutores:", error);
    return [];
  }
}

// ===== BUSCAR TUTORES =====
async function buscarTutores(materia) {
  const tutores = await cargarTutores(materia);
  mostrarTutoresEnUI(tutores);
}

// ===== MOSTRAR TUTORES EN LA UI =====
function mostrarTutoresEnUI(tutores) {
  const container = document.getElementById('tutors-list');
  if (!container) {
    console.log("Contenedor 'tutors-list' no encontrado");
    return;
  }
  
  container.innerHTML = '';
  
  if (tutores.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#999;">No se encontraron tutores</p>';
    return;
  }
  
  tutores.forEach(tutor => {
    const card = crearTarjetaTutor(tutor);
    container.appendChild(card);
  });
}

// ===== CREAR TARJETA DE TUTOR =====
function crearTarjetaTutor(tutor) {
  const div = document.createElement('div');
  div.className = 'tutor-card';
  div.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.3s;
  `;
  
  div.onmouseover = () => div.style.transform = 'scale(1.02)';
  div.onmouseout = () => div.style.transform = 'scale(1)';
  div.onclick = () => verPerfilTutor(tutor.id);
  
  const estrellas = '⭐'.repeat(Math.floor(tutor.rating));
  const materias = tutor.subjects.slice(0, 3).map(s => 
    `<span style="background:#E8F5E9; padding:4px 8px; border-radius:12px; font-size:11px; margin-right:4px;">${s}</span>`
  ).join('');
  
  div.innerHTML = `
    <div style="text-align:center;">
      <img src="${tutor.photo_url}" alt="${tutor.name}" 
           style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
      <h3 style="margin: 10px 0 5px 0;">${tutor.name}</h3>
      <p style="color: #666; font-size: 13px; margin: 0;">${tutor.university}</p>
      <div style="margin: 8px 0;">
        ${estrellas} <span style="color:#666; font-size:13px;">${tutor.rating.toFixed(1)}</span>
      </div>
      <p style="font-size: 18px; font-weight: bold; color: #4FBDBA; margin: 8px 0;">
        ${formatPrice(tutor.hourly_rate)}/hora
      </p>
      <div style="margin-top: 8px;">
        ${materias}
      </div>
    </div>
  `;
  
  return div;
}

// ===== VER PERFIL COMPLETO DEL TUTOR =====
async function verPerfilTutor(tutorId) {
  try {
    const tutorDoc = await db.collection('users').doc(tutorId).get();
    const tutor = tutorDoc.data();
    
    // Cargar reseñas
    const reviewsSnapshot = await db.collection('reviews')
      .where('mentor_id', '==', tutorId)
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();
    
    const reviews = [];
    reviewsSnapshot.forEach(doc => reviews.push(doc.data()));
    
    // Mostrar en modal o alert (simplificado para demo)
    alert(`
📚 ${tutor.name}
🏫 ${tutor.university}
⭐ ${tutor.rating.toFixed(1)} (${tutor.reviews_count} reseñas)
💰 ${formatPrice(tutor.hourly_rate)}/hora
📖 Materias: ${tutor.subjects.join(', ')}
    `);
    
  } catch (error) {
    console.error("Error cargando perfil:", error);
  }
}

// ===== RESERVAR TUTORÍA =====
async function reservarTutoria(tutorId, materia, fecha, hora, duracion = 2) {
  try {
    if (!currentUser) {
      alert('Debes iniciar sesión primero');
      return;
    }
    
    // Obtener datos del tutor
    const tutorDoc = await db.collection('users').doc(tutorId).get();
    const tutor = tutorDoc.data();
    
    // Obtener datos del estudiante
    const studentDoc = await db.collection('users').doc(currentUser.uid).get();
    const student = studentDoc.data();
    
    // Calcular precios
    const pricing = calculateTotalPrice(tutor.hourly_rate, duracion);
    
    // Crear sesión en Firestore
    const sessionRef = await db.collection('sessions').add({
      student_id: currentUser.uid,
      mentor_id: tutorId,
      student_name: student.name,
      mentor_name: tutor.name,
      subject: materia,
      date: fecha,
      time: hora,
      duration: duracion,
      status: 'pending',
      price: pricing.total,
      breakdown: pricing,
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    });
    
    alert('¡Solicitud enviada! El mentor la revisará pronto.');
    return sessionRef.id;
    
  } catch (error) {
    console.error("Error reservando tutoría:", error);
    alert('Error al reservar: ' + error.message);
  }
}

// ===== CALIFICAR MENTOR =====
async function calificarMentor(sessionId, mentorId, rating, comentario) {
  try {
    // Obtener datos del estudiante
    const studentDoc = await db.collection('users').doc(currentUser.uid).get();
    const student = studentDoc.data();
    
    // Crear reseña
    await db.collection('reviews').add({
      session_id: sessionId,
      mentor_id: mentorId,
      student_id: currentUser.uid,
      student_name: student.name,
      rating: rating,
      comment: comentario,
      created_at: getTimestamp()
    });
    
    // Recalcular rating del mentor
    const reviewsSnapshot = await db.collection('reviews')
      .where('mentor_id', '==', mentorId)
      .get();
    
    let totalRating = 0;
    let count = 0;
    reviewsSnapshot.forEach(doc => {
      totalRating += doc.data().rating;
      count++;
    });
    
    const newAvgRating = totalRating / count;
    
    // Actualizar mentor
    await db.collection('users').doc(mentorId).update({
      rating: newAvgRating,
      reviews_count: count
    });
    
    // Marcar sesión como calificada
    await db.collection('sessions').doc(sessionId).update({
      rated: true
    });
    
    alert('¡Gracias por tu calificación!');
    
  } catch (error) {
    console.error("Error calificando:", error);
  }
}