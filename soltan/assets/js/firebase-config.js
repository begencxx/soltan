const firebaseConfig = {
  apiKey: "AIzaSyAbpEjZHaiZIiZ5E5tCjhmtMpQqGAcyEmg",
  authDomain: "soltan-restaurant.firebaseapp.com",
  projectId: "soltan-restaurant",
  storageBucket: "soltan-restaurant.firebasestorage.app",
  messagingSenderId: "237531658514",
  appId: "1:237531658514:web:15c1597666ed09bf51dbcb",
  measurementId: "G-JXH77NBMSY"
};

// Initialize Firebase & Firestore
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = typeof firebase.auth === "function" ? firebase.auth() : null;
const storage = typeof firebase.storage === "function" ? firebase.storage() : null;
