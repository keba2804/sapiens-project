// ====================================
// FIREBASE CONFIGURATION - SAPIENS APP
// ====================================
// Instrucciones: 
// 1. Ve a https://console.firebase.google.com
// 2. Crea un nuevo proyecto llamado "Sapiens"
// 3. Activa Authentication (Email/Password)
// 4. Activa Firestore Database (modo test)
// 5. Copia tus credenciales aquí abajo

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

// Habilitar persistencia offline
db.enablePersistence()
  .catch((err) => {
    console.log("Persistencia no disponible:", err.code);
  });

// ====================================
// UTILIDADES GLOBALES
// ====================================

// Usuario actual en sesión
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
  }
});

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

// Mostrar panel según rol
function mostrarPanelMentor(userData) {
  document.getElementById('marketplace-screen').style.display = 'none';
  document.getElementById('screen-mentor-dashboard').style.display = 'block';
  if (document.getElementById('mentor-dash-name')) {
    document.getElementById('mentor-dash-name').innerText = userData.name;
  }
}

function mostrarPanelEstudiante(userData) {
  document.getElementById('screen-mentor-dashboard').style.display = 'none';
  document.getElementById('marketplace-screen').style.display = 'block';
  if (document.getElementById('display-name')) {
    document.getElementById('display-name').innerText = userData.name;
  }
}

// Función para obtener timestamp
function getTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}

// Formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

// Calcular precio total con fees
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