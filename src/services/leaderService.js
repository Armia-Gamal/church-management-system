import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase/config'

const leadersCollection = collection(db, 'leaders')
const leaderImageKeys = ['profile', 'idFront', 'idBack']

const sortByName = (records) =>
  [...records].sort((firstRecord, secondRecord) =>
    (firstRecord.fullName || '').localeCompare(secondRecord.fullName || '', undefined, {
      sensitivity: 'base',
    }),
  )

const normalizeFileName = (fileName) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')

const resolveImageValue = async (collectionName, recordId, imageKey, imageValue) => {
  if (imageValue instanceof File) {
    const storageRef = ref(
      storage,
      `${collectionName}/${recordId}/${imageKey}-${Date.now()}-${normalizeFileName(imageValue.name)}`,
    )
    await uploadBytes(storageRef, imageValue)
    return getDownloadURL(storageRef)
  }

  return typeof imageValue === 'string' ? imageValue.trim() : ''
}

const resolveImages = async (collectionName, recordId, images = {}, imageKeys = []) => {
  const results = await Promise.allSettled(
    imageKeys.map(async (imageKey) => ({
      imageKey,
      imageValue: await resolveImageValue(
        collectionName,
        recordId,
        imageKey,
        images?.[imageKey],
      ),
    })),
  )

  return results.reduce((resolvedImages, result, index) => {
    const imageKey = imageKeys[index]

    if (result.status === 'fulfilled') {
      resolvedImages[result.value.imageKey] = result.value.imageValue
      return resolvedImages
    }

    console.warn(`تعذر رفع صورة ${imageKey} في ${collectionName}:`, result.reason)
    resolvedImages[imageKey] =
      typeof images?.[imageKey] === 'string' ? images[imageKey].trim() : ''

    return resolvedImages
  }, {})
}

const getAll = async () => {
  const snapshot = await getDocs(leadersCollection)
  return sortByName(
    snapshot.docs.map((record) => ({
      id: record.id,
      ...record.data(),
    })),
  )
}

const add = async (data) => {
  const { images = {}, ...restData } = data
  const emptyImages = leaderImageKeys.reduce((currentImages, imageKey) => {
    currentImages[imageKey] = ''
    return currentImages
  }, {})
  const payload = {
    ...restData,
    images: emptyImages,
    timestamp: serverTimestamp(),
  }

  const recordRef = await addDoc(leadersCollection, payload)
  const uploadedImages = await resolveImages('leaders', recordRef.id, images, leaderImageKeys)

  await updateDoc(recordRef, {
    images: uploadedImages,
  })

  return {
    id: recordRef.id,
    ...restData,
    images: uploadedImages,
  }
}

const update = async (id, data) => {
  const { images = {}, ...restData } = data
  const uploadedImages = await resolveImages('leaders', id, images, leaderImageKeys)

  await updateDoc(doc(db, 'leaders', id), {
    ...restData,
    images: uploadedImages,
  })

  return {
    id,
    ...restData,
    images: uploadedImages,
  }
}

const remove = async (id) => {
  await deleteDoc(doc(db, 'leaders', id))
}

const leaderService = {
  getAll,
  add,
  update,
  delete: remove,
}

export default leaderService
