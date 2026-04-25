import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import authProvisioningService from './authProvisioningService'

const roversCollection = collection(db, 'rovers')
const roverImageKeys = ['profile', 'idFront', 'idBack']
const accessCollection = collection(db, 'memberStageAccess')

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeEmail = (value) => normalizeText(value).toLowerCase()
const normalizeStatus = (value) => (normalizeText(value) === 'غير نشط' ? 'غير نشط' : 'نشط')

const provisionSharedAuthIfNeeded = async ({ email, sharedMemberStage }) => {
  const normalizedEmail = normalizeEmail(email)
  const normalizedSharedMemberStage = normalizeText(sharedMemberStage)

  if (!normalizedEmail || !normalizedSharedMemberStage) {
    return
  }

  await authProvisioningService.createSharedAuthAccount({
    email: normalizedEmail,
    password: normalizedEmail,
  })
}

const syncMemberStageAccess = async ({ email, fullName, sharedMemberStage }) => {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return
  }

  await setDoc(
    doc(accessCollection, normalizedEmail),
    {
      email: normalizedEmail,
      fullName: normalizeText(fullName),
      memberStageAccess: normalizeText(sharedMemberStage),
      sourceType: 'rover',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}


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
  const snapshot = await getDocs(roversCollection)
  return sortByName(
    snapshot.docs.map((record) => ({
      id: record.id,
      ...record.data(),
    })),
  )
}

const add = async (data) => {
  const { images = {}, ...restData } = data
  const emptyImages = roverImageKeys.reduce((currentImages, imageKey) => {
    currentImages[imageKey] = ''
    return currentImages
  }, {})
  const payload = {
    ...restData,
    status: normalizeStatus(restData.status),
    images: emptyImages,
    timestamp: serverTimestamp(),
  }

  const recordRef = await addDoc(roversCollection, payload)
  const uploadedImages = await resolveImages('rovers', recordRef.id, images, roverImageKeys)

  await updateDoc(recordRef, {
    images: uploadedImages,
  })

  await syncMemberStageAccess(payload)
  await provisionSharedAuthIfNeeded(payload)

  return {
    id: recordRef.id,
    ...payload,
    images: uploadedImages,
  }
}

const update = async (id, data) => {
  const { images = {}, ...restData } = data
  const payload = {
    ...restData,
    status: normalizeStatus(restData.status),
  }
  const uploadedImages = await resolveImages('rovers', id, images, roverImageKeys)

  await updateDoc(doc(db, 'rovers', id), {
    ...payload,
    images: uploadedImages,
  })

  await syncMemberStageAccess(payload)
  await provisionSharedAuthIfNeeded(payload)

  return {
    id,
    ...payload,
    images: uploadedImages,
  }
}

const remove = async (id) => {
  await deleteDoc(doc(db, 'rovers', id))
}

const roverService = {
  getAll,
  add,
  update,
  delete: remove,
}

export default roverService
