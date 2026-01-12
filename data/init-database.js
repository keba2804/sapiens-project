// ====================================
// SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
// ====================================
// Este script crea datos de prueba en Firestore
// Ejecútalo UNA VEZ desde la consola del navegador

async function inicializarBaseDatos() {
  console.log("🚀 Inicializando base de datos de Sapiens...");
  
  try {
    // ===== CREAR MENTORES DE PRUEBA =====
    const mentores = [
      {
        id: "mentor_luis",
        name: "Luis Medina",
        email: "luis@sapiens.demo",
        role: "mentor",
        university: "ESPOL",
        subjects: ["Cálculo", "Límites y Derivadas", "Integrales"],
        hourly_rate: 4,
        wallet_balance: 120,
        rating: 4.9,
        reviews_count: 32,
        total_classes: 45,
        status: "verified",
        photo_url: "https://ui-avatars.com/api/?name=Luis+Medina&background=4A90E2",
        availability: {
          lunes: { "0900": true, "1500": true },
          martes: { "0900": true, "1500": false },
          miercoles: { "0900": true, "1500": true },
          jueves: { "0900": false, "1500": true },
          viernes: { "0900": true, "1500": true }
        },
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        id: "mentor_maria",
        name: "María Pérez",
        email: "maria@sapiens.demo",
        role: "mentor",
        university: "ESPOL",
        subjects: ["Python", "Programación", "Algoritmos"],
        hourly_rate: 5,
        wallet_balance: 85,
        rating: 4.8,
        reviews_count: 28,
        total_classes: 38,
        status: "verified",
        photo_url: "https://ui-avatars.com/api/?name=Maria+Perez&background=E24A90",
        availability: {
          lunes: { "0900": true, "1500": true },
          martes: { "0900": true, "1500": true },
          miercoles: { "0900": false, "1500": true },
          jueves: { "0900": true, "1500": true },
          viernes: { "0900": true, "1500": false }
        },
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        id: "mentor_frank",
        name: "Frank Vera",
        email: "frank@sapiens.demo",
        role: "mentor",
        university: "UCSG",
        subjects: ["Física", "Mecánica", "Vectores"],
        hourly_rate: 6,
        wallet_balance: 200,
        rating: 5.0,
        reviews_count: 15,
        total_classes: 20,
        status: "verified",
        photo_url: "https://ui-avatars.com/api/?name=Frank+Vera&background=90E24A",
        availability: {
          lunes: { "0900": true, "1500": true },
          martes: { "0900": true, "1500": true },
          miercoles: { "0900": true, "1500": true },
          jueves: { "0900": true, "1500": true },
          viernes: { "0900": false, "1500": true }
        },
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        id: "mentor_ana",
        name: "Ana Reyes",
        email: "ana@sapiens.demo",
        role: "mentor",
        university: "ESPOL",
        subjects: ["Química", "Laboratorio", "Estequiometría"],
        hourly_rate: 4.5,
        wallet_balance: 95,
        rating: 4.7,
        reviews_count: 22,
        total_classes: 30,
        status: "verified",
        photo_url: "https://ui-avatars.com/api/?name=Ana+Reyes&background=A94AE2",
        availability: {
          lunes: { "0900": false, "1500": true },
          martes: { "0900": true, "1500": true },
          miercoles: { "0900": true, "1500": false },
          jueves: { "0900": true, "1500": true },
          viernes: { "0900": true, "1500": true }
        },
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    console.log("📝 Creando mentores...");
    for (const mentor of mentores) {
      const mentorId = mentor.id;
      delete mentor.id;
      await db.collection('users').doc(mentorId).set(mentor);
      console.log(`✓ Mentor ${mentor.name} creado`);
    }
    
    // ===== CREAR RESEÑAS DE EJEMPLO =====
    const reviews = [
      {
        mentor_id: "mentor_luis",
        student_id: "demo_student_1",
        student_name: "Carlos López",
        rating: 5,
        comment: "Excelente profesor, muy claro explicando límites y derivadas. ¡Lo recomiendo!",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        mentor_id: "mentor_luis",
        student_id: "demo_student_2",
        student_name: "Sofía Mendoza",
        rating: 5,
        comment: "Me ayudó mucho con el examen de cálculo. Paciente y didáctico.",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        mentor_id: "mentor_maria",
        student_id: "demo_student_3",
        student_name: "Diego Ramírez",
        rating: 5,
        comment: "Aprendí Python desde cero. Muy buena metodología.",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        mentor_id: "mentor_frank",
        student_id: "demo_student_4",
        student_name: "Valentina Torres",
        rating: 5,
        comment: "Domina completamente física. Las clases son super dinámicas.",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    console.log("📝 Creando reseñas...");
    for (const review of reviews) {
      await db.collection('reviews').add(review);
    }
    console.log(`✓ ${reviews.length} reseñas creadas`);
    
    // ===== CREAR RECURSOS DE EJEMPLO =====
    const resources = [
      {
        mentor_id: "mentor_luis",
        title: "Guía Python Básico",
        type: "pdf",
        price: 2.50,
        url: "https://storage.sapiens.app/guides/python-basico.pdf",
        sales_count: 35,
        description: "Un PDF de 2 páginas con los comandos esenciales.",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        mentor_id: "mentor_luis",
        title: "Formulario Física 1",
        type: "pdf",
        price: 1.50,
        url: "https://storage.sapiens.app/guides/fisica-formulario.pdf",
        sales_count: 8,
        description: "Todas las fórmulas de cinemática y dinámica.",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        mentor_id: "mentor_maria",
        title: "Simulador Cálculo",
        type: "simulator",
        price: 4.00,
        url: "https://sapiens.app/simulators/calculo",
        sales_count: 12,
        description: "10 problemas interactivos de física.",
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    console.log("📝 Creando recursos...");
    for (const resource of resources) {
      await db.collection('resources').add(resource);
    }
    console.log(`✓ ${resources.length} recursos creados`);
    
    console.log("✅ ¡Base de datos inicializada correctamente!");
    console.log("🎯 Ahora puedes registrar usuarios y empezar a probar");
    
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
  }
}

// ===== FUNCIÓN PARA LIMPIAR =====
async function limpiarBaseDatos() {
  if (!confirm("⚠️ ¿Estás seguro? Esto eliminará TODOS los datos.")) {
    return;
  }
  
  console.log("🧹 Limpiando base de datos...");
  
  try {
    const collections = ['users', 'reviews', 'resources', 'sessions'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      for (const doc of snapshot.docs) {
        await doc.ref.delete();
      }
      console.log(`✓ ${snapshot.size} documentos eliminados de ${collectionName}`);
    }
    
    console.log("✅ Base de datos limpiada");
    
  } catch (error) {
    console.error("❌ Error limpiando:", error);
  }
}

console.log("📌 Ejecuta: inicializarBaseDatos()");