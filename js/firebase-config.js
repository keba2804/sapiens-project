// ====================================
// FIREBASE CONFIGURATION - SAPIENS APP (CORREGIDO)
// ====================================

const firebaseConfig = {
  apiKey: "AIzaSyAsbgxT3P0FOvM6O5FCvaku28Ze1SYAICI",
  authDomain: "sapiens-be9ab.firebaseapp.com",
  projectId: "sapiens-be9ab",
  storageBucket: "sapiens-be9ab.firebasestorage.app",
  messagingSenderId: "545088137894",
  appId: "1:545088137894:web:c0e440b0eddbcb6c0e6267",
  measurementId: "G-0J72MG4DHY"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

db.enablePersistence().catch((err) => {
    console.log("Persistencia no disponible:", err.code);
});

// ====================================
// UTILIDADES GLOBALES
// ====================================

let currentUser = null;

// Escuchar cambios de autenticación
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log("Usuario autenticado:", user.email);
    loadUserData(user.uid);
  } else {
    currentUser = null;
    console.log("Usuario no autenticado");
    // Si no hay usuario, asegurarnos de que se ve la pantalla de inicio/roles
    mostrarPantallaInicio();
  }
});

function mostrarPantallaInicio() {
    // Ocultar paneles internos
    if(document.getElementById('marketplace-screen')) 
        document.getElementById('marketplace-screen').style.display = 'none';
    if(document.getElementById('screen-mentor-dashboard')) 
        document.getElementById('screen-mentor-dashboard').style.display = 'none';
    if(document.getElementById('auth-screen')) 
        document.getElementById('auth-screen').style.display = 'none';
    
    // Mostrar pantalla de roles
    if(document.getElementById('role-screen')) 
        document.getElementById('role-screen').style.display = 'block';
}

// Cargar datos del usuario
async function loadUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Actualizar UI según el rol
      if (userData.role === 'mentor') {
        mostrarPanelMentor(userData);
      } else {
        mostrarPanelEstudiante(userData);
      }
    }
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

// Mostrar panel MENTOR (CORREGIDO PARA EVITAR SUPERPOSICIÓN)
function mostrarPanelMentor(userData) {
  // 1. Ocultar TODAS las otras pantallas obligatoriamente
  document.getElementById('role-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('marketplace-screen').style.display = 'none';
  
  // 2. Mostrar Dashboard Mentor
  const dashboard = document.getElementById('screen-mentor-dashboard');
  dashboard.style.display = 'block';
  
  // 3. Cargar datos básicos
  if (document.getElementById('mentor-dash-name')) {
    document.getElementById('mentor-dash-name').innerText = userData.name;
  }
  
  // 4. IMPORTANTE: Disparar la carga del calendario y métricas
  // Esto llena el calendario que ahora ves vacío
  if (typeof cargarDashboardMentor === 'function') {
    cargarDashboardMentor(userData.id);
  }
}

// Mostrar panel ESTUDIANTE
// Mostrar panel ESTUDIANTE (MODIFICADO PARA FERIA)
function mostrarPanelEstudiante(userData) {
  // 1. Ocultar otras pantallas
  document.getElementById('role-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('screen-mentor-dashboard').style.display = 'none';
  
  // 2. Mostrar Marketplace
  document.getElementById('marketplace-screen').style.display = 'block';
  
  if (document.getElementById('display-name')) {
    document.getElementById('display-name').innerText = userData.name;
  }
  
  // 3. CARGAR INTERFAZ REALISTA
  // Esta función está en js/ui-integration.js
  if (typeof cargarInterfazEstudiante === 'function') {
    cargarInterfazEstudiante({ uid: userData.id });
  }
}

function getTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

function calculateTotalPrice(hourlyRate, hours = 1) {
  const subtotal = hourlyRate * hours;
  const serviceFee = subtotal * 0.10; // 10% fee
  const iva = subtotal * 0.15; // 15% IVA Ecuador
  const total = subtotal + serviceFee + iva;
  
  return {
    subtotal: subtotal,
    serviceFee: serviceFee,
    iva: iva,
    total: total
  };
}