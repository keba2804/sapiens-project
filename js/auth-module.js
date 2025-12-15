// ====================================
// MÓDULO DE AUTENTICACIÓN
// ====================================

// ===== SELECCIÓN DE ROL =====
// ===== SELECCIÓN DE ROL =====
function seleccionarRol(rol) {
  localStorage.setItem('selectedRole', rol);
  
  // Guardar el rol en variable global
  if (typeof window.rolSeleccionado !== 'undefined') {
    window.rolSeleccionado = rol;
  }
  
  // Activar la pantalla de autenticación del HTML
  const roleScreen = document.getElementById('role-screen');
  const authScreen = document.getElementById('auth-screen');
  
  if (roleScreen && authScreen) {
    roleScreen.style.display = 'none';
    authScreen.style.display = 'flex';
  }
  
  console.log("Rol seleccionado:", rol);
}

// ===== REGISTRO DE ESTUDIANTE =====
async function registrarEstudiante(email, password, nombre) {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Crear documento en Firestore
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      name: nombre,
      email: email,
      role: 'student',
      wallet_balance: 0,
      points: 150, // Puntos iniciales de bienvenida
      created_at: getTimestamp(),
      photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
    });
    
    alert('¡Registro exitoso! Bienvenido a Sapiens');
    
    // Mostrar marketplace
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('role-screen').style.display = 'none';
    document.getElementById('marketplace-screen').style.display = 'block';
    if (document.getElementById('display-name')) {
      document.getElementById('display-name').innerText = nombre;
    }
    
  } catch (error) {
    console.error("Error en registro:", error);
    alert('Error: ' + error.message);
  }
}

// ===== REGISTRO DE MENTOR =====
async function registrarMentor(email, password, nombre, universidad, materias, precioHora) {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Procesar materias (convertir string a array)
    const materiasArray = typeof materias === 'string' 
      ? materias.split(',').map(m => m.trim()) 
      : materias;
    
    // Crear documento en Firestore
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      name: nombre,
      email: email,
      role: 'mentor',
      university: universidad,
      subjects: materiasArray,
      hourly_rate: parseFloat(precioHora),
      wallet_balance: 0,
      rating: 5.0, // Rating inicial perfecto
      reviews_count: 0,
      total_classes: 0,
      status: 'verified', // Auto-verificado para la feria
      availability: generarDisponibilidadInicial(),
      created_at: getTimestamp(),
      photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
    });
    
    alert('¡Registro exitoso! Ya puedes empezar a recibir solicitudes');
    
    // Mostrar panel mentor
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('role-screen').style.display = 'none';
    document.getElementById('mentor-validation-screen').style.display = 'none';
    document.getElementById('screen-mentor-dashboard').style.display = 'block';
    if (document.getElementById('mentor-dash-name')) {
      document.getElementById('mentor-dash-name').innerText = nombre;
    }
    
  } catch (error) {
    console.error("Error en registro:", error);
    alert('Error: ' + error.message);
  }
}

// Generar disponibilidad inicial (todos los slots libres)
function generarDisponibilidadInicial() {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const horarios = ['09:00', '15:00'];
  const disponibilidad = {};
  
  dias.forEach(dia => {
    disponibilidad[dia] = {};
    horarios.forEach(hora => {
      disponibilidad[dia][hora] = true; // true = libre
    });
  });
  
  return disponibilidad;
}

// ===== LOGIN =====
async function iniciarSesion(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Obtener datos del usuario
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    // Ocultar pantallas de autenticación
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('role-screen').style.display = 'none';
    
    // Redirigir según el rol
    if (userData.role === 'mentor') {
      document.getElementById('marketplace-screen').style.display = 'none';
      document.getElementById('screen-mentor-dashboard').style.display = 'block';
      if (document.getElementById('mentor-dash-name')) {
        document.getElementById('mentor-dash-name').innerText = userData.name;
      }
    } else {
      document.getElementById('screen-mentor-dashboard').style.display = 'none';
      document.getElementById('marketplace-screen').style.display = 'block';
      if (document.getElementById('display-name')) {
        document.getElementById('display-name').innerText = userData.name;
      }
    }
    
  } catch (error) {
    console.error("Error en login:", error);
    alert('Error: ' + error.message);
  }
}

// ===== CERRAR SESIÓN =====
async function cerrarSesionFirebase() {
  try {
    await auth.signOut();
    localStorage.clear();
    window.location.reload();
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    window.location.reload();
  }
}

// ===== VERIFICAR AUTENTICACIÓN =====
function verificarAutenticacion() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
}