import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth } from '../firebase/config'
import { db } from '../firebase/config'

const ADMIN_EMAIL = 'church@admin.com'

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const createAuthError = (code, message) => ({
  code,
  message,
})

const signIn = async (email, password) => {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail || !password) {
    throw createAuthError('auth/missing-credentials', 'يرجى إدخال البريد الإلكتروني وكلمة المرور.')
  }

  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password)
  return credential.user
}

const watchAuthState = (onChange) =>
  onAuthStateChanged(auth, async (user) => {
    onChange(user || null)
  })

const logout = () => signOut(auth)

const getAccessProfile = async (user) => {
  const normalizedEmail = normalizeEmail(user?.email)

  if (!normalizedEmail) {
    return {
      role: 'no-access',
    }
  }

  if (normalizedEmail === ADMIN_EMAIL) {
    return {
      role: 'admin',
      email: normalizedEmail,
    }
  }

  const accessDoc = await getDoc(doc(db, 'memberStageAccess', normalizedEmail))

  if (!accessDoc.exists()) {
    return {
      role: 'no-access',
      email: normalizedEmail,
    }
  }

  const accessData = accessDoc.data() || {}
  const memberStageAccess =
    typeof accessData.memberStageAccess === 'string'
      ? accessData.memberStageAccess.trim()
      : ''

  if (!memberStageAccess) {
    return {
      role: 'no-access',
      email: normalizedEmail,
    }
  }

  return {
    role: 'shared-member-stage',
    email: normalizedEmail,
    memberStageAccess,
    sourceType: accessData.sourceType || '',
  }
}

const authService = {
  signIn,
  watchAuthState,
  logout,
  getAccessProfile,
}

export default authService
