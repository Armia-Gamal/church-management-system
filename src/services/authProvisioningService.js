import { auth } from '../firebase/config'

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeEmail = (value) => normalizeText(value).toLowerCase()

const createSharedAuthAccount = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email)
  const normalizedPassword = normalizeText(password)

  if (!normalizedEmail || !normalizedPassword) {
    console.warn('تعذر إنشاء حساب مشاركة: بريد أو باسورد فارغ', { email, password })
    return { created: false, skipped: true }
  }

  const apiKey = auth?.app?.options?.apiKey

  if (!apiKey) {
    throw new Error('تعذر تجهيز حساب الدخول لأن Firebase API key غير متوفر.')
  }

  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: normalizedPassword,
        returnSecureToken: false,
      }),
    })

    const result = await response.json()

    if (response.ok) {
      console.log(`تم إنشاء حساب مشاركة بنجاح: ${normalizedEmail}`)
      return { created: true }
    }

    if (result?.error?.message === 'EMAIL_EXISTS') {
      console.warn(`البريد الإلكتروني موجود بالفعل: ${normalizedEmail}`)
      return { created: false, exists: true }
    }

    console.error(`خطأ في إنشاء حساب المشاركة:`, result?.error?.message)
    throw new Error(result?.error?.message || 'تعذر إنشاء حساب تسجيل الدخول.')
  } catch (error) {
    console.error(`خطأ في اتصال Firebase Auth:`, error)
    throw error
  }
}

const authProvisioningService = {
  createSharedAuthAccount,
}

export default authProvisioningService
