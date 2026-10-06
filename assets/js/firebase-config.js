const firebaseConfig = {
  apiKey: "AIzaSyAGM9QKV5SInE8QTWAztfvVPHlrkCSr_DU",
  authDomain: "http://soltanv2-815dc.firebaseapp.com",
  projectId: "soltanv2-815dc",
  storageBucket: "http://soltanv2-815dc.firebasestorage.app",
  messagingSenderId: "418169662039",
  appId: "1:418169662039:web:29e3e9f461da7365961112",
  measurementId: "G-EBDS7G7KK0"
};

// Initialize Firebase & Firestore
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = typeof firebase.auth === "function" ? firebase.auth() : null;
const storage = typeof firebase.storage === "function" ? firebase.storage() : null;
