// ====================================
// INTEGRACIÓN DE UI CON FIREBASE
// ====================================

// Cargar y mostrar tutores cuando el estudiante inicia sesión
async function mostrarTutoresDisponibles() {
  try {
    console.log("🔍 Buscando tutores disponibles...");
    
    // Cargar tutores desde Firebase
    const tutores = await cargarTutores();
    
    if (tutores.length === 0) {
      console.log("⚠️ No se encontraron tutores");
      return;
    }
    
    console.log(`✅ ${tutores.length} tutores encontrados`);
    
    // Crear sección de tutores si no existe
    let tutoresSection = document.getElementById('tutores-disponibles');
    
    if (!tutoresSection) {
      // Buscar el contenedor principal del marketplace
      const marketplace = document.getElementById('marketplace-screen');
      
      if (marketplace) {
        tutoresSection = document.createElement('div');
        tutoresSection.id = 'tutores-disponibles';
        tutoresSection.style.cssText = `
          padding: 20px;
          margin-top: 20px;
        `;
        
        tutoresSection.innerHTML = `
          <h2 style="font-size: 24px; margin-bottom: 20px; color: #333;">
            🎓 Tutores Disponibles para Clases en Vivo
          </h2>
          <div id="tutores-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
          "></div>
        `;
        
        // Insertar al inicio del marketplace
        marketplace.insertBefore(tutoresSection, marketplace.firstChild);
      }
    }
    
    // Renderizar tutores
    const grid = document.getElementById('tutores-grid');
    if (grid) {
      grid.innerHTML = '';
      
      tutores.forEach(tutor => {
        const card = crearTarjetaTutorCompleta(tutor);
        grid.appendChild(card);
      });
    }
    
  } catch (error) {
    console.error("❌ Error mostrando tutores:", error);
  }
}

// Crear tarjeta completa de tutor
function crearTarjetaTutorCompleta(tutor) {
  const div = document.createElement('div');
  div.className = 'tutor-card-firebase';
  div.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
  `;
  
  div.onmouseover = () => {
    div.style.transform = 'translateY(-5px)';
    div.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
  };
  
  div.onmouseout = () => {
    div.style.transform = 'translateY(0)';
    div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  };
  
  const estrellas = '⭐'.repeat(Math.floor(tutor.rating));
  const materias = tutor.subjects.slice(0, 3).map(s => 
    `<span style="
      background: #E8F5E9; 
      padding: 4px 12px; 
      border-radius: 12px; 
      font-size: 12px; 
      margin-right: 5px;
      display: inline-block;
      margin-top: 5px;
      color: #2E7D32;
      font-weight: 500;
    ">${s}</span>`
  ).join('');
  
  div.innerHTML = `
    <div style="text-align: center;">
      <img src="${tutor.photo_url}" alt="${tutor.name}" 
           style="
             width: 100px; 
             height: 100px; 
             border-radius: 50%; 
             object-fit: cover;
             border: 4px solid #4FBDBA;
             margin-bottom: 15px;
           ">
      <h3 style="margin: 10px 0 5px 0; font-size: 18px; color: #333;">
        ${tutor.name}
      </h3>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        🏫 ${tutor.university}
      </p>
      <div style="margin: 10px 0;">
        ${estrellas} 
        <span style="color: #666; font-size: 14px; font-weight: 500;">
          ${tutor.rating.toFixed(1)}
        </span>
        <span style="color: #999; font-size: 12px;">
          (${tutor.reviews_count} reseñas)
        </span>
      </div>
      <p style="font-size: 20px; font-weight: bold; color: #4FBDBA; margin: 12px 0;">
        ${formatPrice(tutor.hourly_rate)}/hora
      </p>
      <div style="margin: 12px 0; text-align: left;">
        ${materias}
      </div>
      <button onclick="verDetallesTutor('${tutor.id}')" style="
        width: 100%;
        padding: 12px;
        background: #4FBDBA;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.3s;
      " onmouseover="this.style.background='#3CAEA5'" 
         onmouseout="this.style.background='#4FBDBA'">
        📅 Reservar Clase
      </button>
    </div>
  `;
  
  return div;
}

// Ver detalles del tutor
async function verDetallesTutor(tutorId) {
  try {
    const tutorDoc = await db.collection('users').doc(tutorId).get();
    const tutor = tutorDoc.data();
    
    const pricing = calculateTotalPrice(tutor.hourly_rate, 2);
    
    const mensaje = `
🎓 ${tutor.name}
🏫 ${tutor.university}
⭐ ${tutor.rating.toFixed(1)} (${tutor.reviews_count} reseñas)
💰 ${formatPrice(tutor.hourly_rate)}/hora

📚 Materias:
${tutor.subjects.join(', ')}

💵 Precio por 2 horas:
- Subtotal: ${formatPrice(pricing.subtotal)}
- Fee servicio (10%): ${formatPrice(pricing.serviceFee)}
- IVA (15%): ${formatPrice(pricing.iva)}
- TOTAL: ${formatPrice(pricing.total)}

¿Deseas reservar una clase con ${tutor.name}?
    `;
    
    if (confirm(mensaje)) {
      // Simular reserva
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1); // Mañana
      const fechaStr = fecha.toISOString().split('T')[0];
      
      await reservarTutoria(tutorId, tutor.subjects[0], fechaStr, '15:00', 2);
    }
    
  } catch (error) {
    console.error("Error viendo detalles:", error);
    alert('Error al cargar información del tutor');
  }
}

// Ejecutar cuando Firebase esté listo
if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Esperar un momento para que la UI se cargue
      setTimeout(async () => {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        // Solo mostrar tutores si es estudiante
        if (userData && userData.role === 'student') {
          mostrarTutoresDisponibles();
        }
      }, 1000);
    }
  });
}

console.log("✅ UI Integration cargado");