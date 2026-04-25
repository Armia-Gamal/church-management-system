import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { Timestamp, doc, getFirestore, writeBatch } from 'firebase/firestore'

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
const db = getFirestore(app)

const dataFilePath = resolve(process.cwd(), 'scripts', 'members-import.tsv')

const normalizeText = (value) => String(value || '').replace(/\u00a0/g, ' ').trim()

const normalizeDigits = (value) =>
  normalizeText(value)
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))

const parseFlexibleDate = (value) => {
  const normalizedValue = normalizeDigits(value)

  if (!normalizedValue) {
    return ''
  }

  const parts = normalizedValue.split('/').map((part) => Number(part))

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return ''
  }

  let [day, month, year] = parts

  if (year < 1900 && year > 0) {
    year += 2000
  }

  if (day <= 12 && month > 12) {
    const swappedDay = month
    month = day
    day = swappedDay
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return ''
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const padColumns = (columns) => {
  const nextColumns = [...columns]

  while (nextColumns.length < 7) {
    nextColumns.push('')
  }

  return nextColumns
}

const createDocumentId = (nationalId, index) => {
  const safeNationalId = normalizeDigits(nationalId) || `member-${index + 1}`
  return `${safeNationalId}-${Date.now()}-${index + 1}`
}

const main = async () => {
  const rawContent = await readFile(dataFilePath, 'utf8')
  const rows = rawContent
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => padColumns(line.split('\t')))

  if (rows.length > 500) {
    throw new Error('File has more than 500 rows, split import into smaller batches.')
  }

  const batch = writeBatch(db)

  rows.forEach((columns, index) => {
    const [stage, fullName, birthDate, nationalId, phone, parentPhone, address] = columns
    const documentId = createDocumentId(nationalId, index)

    batch.set(doc(db, 'members', documentId), {
      timestamp: Timestamp.now(),
      stage: normalizeText(stage),
      fullName: normalizeText(fullName),
      birthDate: parseFlexibleDate(birthDate),
      nationalId: normalizeDigits(nationalId),
      phone: normalizeDigits(phone),
      parentPhone: normalizeDigits(parentPhone),
      address: normalizeText(address),
      images: {
        profile: '',
        document: '',
      },
    })
  })

  await batch.commit()
  console.log(`Imported ${rows.length} member records into members collection.`)
}

main().catch((error) => {
  console.error('Member import failed:', error)
  process.exit(1)
})
