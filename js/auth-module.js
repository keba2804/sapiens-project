// ====================================
// MÓDULO DE AUTENTICACIÓN (CORREGIDO)
// ====================================

// ===== SELECCIÓN DE ROL =====
function seleccionarRol(rol) {
  localStorage.setItem('selectedRole', rol);
  
  // CORRECCIÓN IMPORTANTE:
  // Actualizamos la variable global 'rolSeleccionado' que está en index.html.
  // Usamos try/catch para manejar si la variable fue declarada con let/var o en window.
  try {
    rolSeleccionado = rol;
  } catch (e) {
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
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      name: nombre,
      email: email,
      role: 'student',
      wallet_balance: 0,
      points: 150,
      created_at: getTimestamp(),
      photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
    });
    
    alert('¡Registro exitoso! Bienvenido a Sapiens');
    
    // UI Updates
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
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const materiasArray = typeof materias === 'string' 
      ? materias.split(',').map(m => m.trim()) 
      : materias;
    
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      name: nombre,
      email: email,
      role: 'mentor',
      university: universidad,
      subjects: materiasArray,
      hourly_rate: parseFloat(precioHora),
      wallet_balance: 0,
      rating: 5.0,
      reviews_count: 0,
      total_classes: 0,
      status: 'verified',
      availability: generarDisponibilidadInicial(),
      created_at: getTimestamp(),
      photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`
    });
    
    alert('¡Registro exitoso! Ya puedes empezar a recibir solicitudes');
    
    // Mostrar panel mentor y cargar datos
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('role-screen').style.display = 'none';
    document.getElementById('mentor-validation-screen').style.display = 'none';
    document.getElementById('screen-mentor-dashboard').style.display = 'block';
    
    if (document.getElementById('mentor-dash-name')) {
      document.getElementById('mentor-dash-name').innerText = nombre;
    }

    // Cargar datos del dashboard inmediatamente
    if (typeof cargarDashboardMentor === 'function') {
      cargarDashboardMentor(user.uid);
    }
    
  } catch (error) {
    console.error("Error en registro:", error);
    alert('Error: ' + error.message);
  }
}

function generarDisponibilidadInicial() {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
  const horarios = ['09:00', '15:00'];
  const disponibilidad = {};
  dias.forEach(dia => {
    disponibilidad[dia] = {};
    horarios.forEach(hora => {
      disponibilidad[dia][hora] = true;
    });
  });
  return disponibilidad;
}

// ===== LOGIN =====
async function iniciarSesion(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('role-screen').style.display = 'none';
    
    // Redirigir según el rol
    if (userData.role === 'mentor') {
      document.getElementById('marketplace-screen').style.display = 'none';
      document.getElementById('screen-mentor-dashboard').style.display = 'block';
      if (document.getElementById('mentor-dash-name')) {
        document.getElementById('mentor-dash-name').innerText = userData.name;
      }
      // Cargar datos específicos del mentor
      if (typeof cargarDashboardMentor === 'function') {
        cargarDashboardMentor(user.uid);
      }
    } else {
      document.getElementById('screen-mentor-dashboard').style.display = 'none';
      document.getElementById('marketplace-screen').style.display = 'block';
      if (document.getElementById('display-name')) {
        document.getElementById('display-name').innerText = userData.name;
      }
      // Cargar tutores para el estudiante
      if (typeof mostrarTutoresDisponibles === 'function') {
         mostrarTutoresDisponibles();
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
      if (user) resolve(user);
      else resolve(null);
    });
  });
}