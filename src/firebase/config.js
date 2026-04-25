import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const requireEnv = (key) => {
  const value = import.meta.env[key]

  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`)
  }

  return value
}

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, db, storage }
