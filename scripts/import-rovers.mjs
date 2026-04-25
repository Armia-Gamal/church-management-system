import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { Timestamp, doc, getFirestore, writeBatch } from 'firebase/firestore'

const requireEnv = (key) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const firebaseConfig = {
  apiKey: requireEnv('FIREBASE_API_KEY'),
  authDomain: requireEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('FIREBASE_APP_ID'),
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const dataFilePath = resolve(process.cwd(), 'scripts', 'rovers-import.tsv')

const normalizeText = (value) => String(value || '').replace(/\u00a0/g, ' ').trim()

const parseUsDate = (value) => {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return ''
  }

  const [month, day, year] = normalizedValue.split('/').map(Number)

  if (!month || !day || !year) {
    return ''
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const padColumns = (columns) => {
  const nextColumns = [...columns]

  while (nextColumns.length < 15) {
    nextColumns.push('')
  }

  return nextColumns
}

const createDocumentId = (nationalId, index) => {
  const safeNationalId = normalizeText(nationalId) || `rover-${index + 1}`
  return `${safeNationalId}-${Date.now()}-${index + 1}`
}

const main = async () => {
  const rawContent = await readFile(dataFilePath, 'utf8')
  const rows = rawContent
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => padColumns(line.split('\t')))

  const batch = writeBatch(db)

  rows.forEach((columns, index) => {
    const [
      fullName,
      birthDate,
      address,
      nationalId,
      phone,
      whatsapp,
      education,
      graduationYear,
      job,
      email,
      service2026,
      confessionFather,
      confessionChurch,
      servantsGraduationYear,
      servantsChurch,
    ] = columns

    const documentId = createDocumentId(nationalId, index)

    batch.set(doc(db, 'rovers', documentId), {
      timestamp: Timestamp.now(),
      fullName: normalizeText(fullName),
      birthDate: parseUsDate(birthDate),
      address: normalizeText(address),
      nationalId: normalizeText(nationalId),
      phone: normalizeText(phone),
      whatsapp: normalizeText(whatsapp),
      education: normalizeText(education),
      graduationYear: normalizeText(graduationYear),
      job: normalizeText(job),
      email: normalizeText(email),
      service2026: normalizeText(service2026),
      confessionFather: normalizeText(confessionFather),
      confessionChurch: normalizeText(confessionChurch),
      servantsGraduationYear: normalizeText(servantsGraduationYear),
      servantsChurch: normalizeText(servantsChurch),
      images: {
        profile: '',
        idFront: '',
        idBack: '',
      },
    })
  })

  await batch.commit()
  console.log(`Imported ${rows.length} rover records into rovers collection.`)
}

main().catch((error) => {
  console.error('Rover import failed:', error)
  process.exit(1)
})
