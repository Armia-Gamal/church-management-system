import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAWiFiUphBx-8l4Xays40USj23Zqg4cJ1o',
  authDomain: 'church-management-dae38.firebaseapp.com',
  projectId: 'church-management-dae38',
  storageBucket: 'church-management-dae38.firebasestorage.app',
  messagingSenderId: '427615898935',
  appId: '1:427615898935:web:3ab608bf32c66d96e7deb2',
  measurementId: 'G-239JQDZ4XN',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }
