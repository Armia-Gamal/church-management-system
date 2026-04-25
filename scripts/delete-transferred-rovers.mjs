import { initializeApp } from 'firebase/app'
import { doc, getDocs, getFirestore, query, writeBatch, where, collection } from 'firebase/firestore'
import firebaseConfig from './firebaseConfig.mjs'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const roverNationalIds = [
  '30709250103429',
  '30609172500021',
  '30609120101985',
  '30305071400034',
  '30607221401715',
  '30607272600186',
  '30605041401323',
  '30707121401585',
  '30709271401993',
  '30706221401217',
  '30709281403584',
  '30609172500071',
  '30404250102974',
  '30707121401569',
  '30611231401575',
  '30801191403417',
]

const chunk = (items, size) => {
  const chunks = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

const main = async () => {
  const roversCollection = collection(db, 'rovers')
  const batches = chunk(roverNationalIds, 30)
  const matchedSnapshots = await Promise.all(
    batches.map((idChunk) => getDocs(query(roversCollection, where('nationalId', 'in', idChunk)))),
  )

  const matchedDocs = matchedSnapshots.flatMap((snapshot) => snapshot.docs)

  if (matchedDocs.length === 0) {
    console.log('No matching rover records were found.')
    return
  }

  const deleteBatch = writeBatch(db)

  matchedDocs.forEach((record) => {
    deleteBatch.delete(doc(db, 'rovers', record.id))
  })

  await deleteBatch.commit()

  console.log(`Deleted ${matchedDocs.length} rover records from Firestore.`)
}

main().catch((error) => {
  console.error('Cleanup failed:', error)
  process.exit(1)
})