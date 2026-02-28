import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJtTTuIHvpxLO9DyZYsLsbGYRSUIMdY2c",
  authDomain: "shop-agentic.firebaseapp.com",
  projectId: "shop-agentic",
  storageBucket: "shop-agentic.firebasestorage.app",
  messagingSenderId: "172605200348",
  appId: "1:172605200348:web:d2fa243bd8e12e56f32119",
  measurementId: "G-DXC5J1PRQV",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
