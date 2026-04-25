import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { initializeApp } from 'firebase/app'
import { Timestamp, doc, getFirestore, writeBatch } from 'firebase/firestore'
import firebaseConfig from './firebaseConfig.mjs'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const dataFilePath = resolve(process.cwd(), 'scripts', 'leaders-import.tsv')

const normalizeText = (value) => value.replace(/\u00a0/g, ' ').trim()

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

const parseUsDateTime = (value) => {
  const normalizedValue = normalizeText(value)

  if (!normalizedValue) {
    return Timestamp.now()
  }

  const [datePart, timePart] = normalizedValue.split(' ')
  const [month, day, year] = datePart.split('/').map(Number)
  const [hour = 0, minute = 0, second = 0] = (timePart || '')
    .split(':')
    .map(Number)

  return Timestamp.fromDate(
    new Date(year, month - 1, day, hour, minute, second),
  )
}

const createDocumentId = (nationalId, timestampValue, index) => {
  const seconds =
    typeof timestampValue?.seconds === 'number'
      ? String(timestampValue.seconds)
      : Date.now().toString()

  const safeNationalId = nationalId || `leader-${index + 1}`
  return `${safeNationalId}-${seconds}-${index + 1}`
}

const padColumns = (columns) => {
  const nextColumns = [...columns]

  while (nextColumns.length < 16) {
    nextColumns.push('')
  }

  return nextColumns
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
      timestampRaw,
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

    const timestamp = parseUsDateTime(timestampRaw)
    const documentId = createDocumentId(normalizeText(nationalId), timestamp, index)

    batch.set(doc(db, 'leaders', documentId), {
      timestamp,
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

  console.log(`Imported ${rows.length} leader records into leaders collection.`)
}

main().catch((error) => {
  console.error('Leader import failed:', error)
  process.exit(1)
})
