// ====================================
// FIREBASE CONFIGURATION - SAPIENS APP
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

// ⚡ MEJORAR PERSISTENCIA CON SINCRONIZACIÓN ENTRE TABS
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log("✅ Persistencia offline activada");
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("⚠️ Persistencia: Varias pestañas abiertas");
    } else if (err.code === 'unimplemented') {
      console.warn("⚠️ Persistencia no soportada por el navegador");
    } else {
      console.error("❌ Error de persistencia:", err);
    }
  });

// ====================================
// UTILIDADES GLOBALES
// ====================================

let currentUser = null;

// Escuchar cambios de autenticación
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log("✅ Usuario autenticado:", user.email);
    loadUserData(user.uid);
  } else {
    currentUser = null;
    console.log("ℹ️ Usuario no autenticado");
    mostrarPantallaInicio();
  }
});

function mostrarPantallaInicio() {
    if(document.getElementById('marketplace-screen')) 
        document.getElementById('marketplace-screen').style.display = 'none';
    if(document.getElementById('screen-mentor-dashboard')) 
        document.getElementById('screen-mentor-dashboard').style.display = 'none';
    if(document.getElementById('auth-screen')) 
        document.getElementById('auth-screen').style.display = 'none';
    
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
      
      if (userData.role === 'mentor') {
        mostrarPanelMentor(userData);
      } else {
        mostrarPanelEstudiante(userData);
      }
    }
  } catch (error) {
    console.error("Error cargando datos:", error);
    mostrarAlerta('Error cargando perfil. Por favor recarga la página.', 'error');
  }
}

// Mostrar panel MENTOR
function mostrarPanelMentor(userData) {
  document.getElementById('role-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('marketplace-screen').style.display = 'none';
  
  const dashboard = document.getElementById('screen-mentor-dashboard');
  dashboard.style.display = 'block';
  
  if (document.getElementById('mentor-dash-name')) {
    document.getElementById('mentor-dash-name').innerText = userData.name;
  }
  
  if (typeof cargarDashboardMentor === 'function') {
    cargarDashboardMentor(userData.id);
  }
}

// Mostrar panel ESTUDIANTE
function mostrarPanelEstudiante(userData) {
  document.getElementById('role-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('screen-mentor-dashboard').style.display = 'none';
  
  document.getElementById('marketplace-screen').style.display = 'block';
  
  if (document.getElementById('display-name')) {
    document.getElementById('display-name').innerText = userData.name;
  }
  
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
  const serviceFee = subtotal * 0.10;
  const iva = subtotal * 0.15;
  const total = subtotal + serviceFee + iva;
  
  return {
    subtotal: subtotal,
    serviceFee: serviceFee,
    iva: iva,
    total: total
  };
}

console.log("🔥 Firebase inicializado correctamente");