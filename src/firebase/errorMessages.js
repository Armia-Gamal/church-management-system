const codeMessages = {
  'permission-denied': 'صلاحيات فايرستور الحالية تمنع حفظ البيانات.',
  'storage/unauthorized': 'صلاحيات التخزين الحالية تمنع رفع الصور.',
  'storage/unauthenticated': 'يجب تسجيل الدخول قبل رفع الصور.',
  'storage/bucket-not-found': 'خدمة Firebase Storage غير مفعلة أو الحاوية غير موجودة.',
  'storage/project-not-found': 'إعداد مشروع Firebase Storage غير مكتمل.',
  'storage/quota-exceeded': 'تم تجاوز السعة المسموحة للتخزين في Firebase Storage.',
  'storage/unknown': 'حدث خطأ غير متوقع أثناء رفع الصور إلى Firebase Storage.',
}

const getFirebaseErrorMessage = (error, fallbackMessage) => {
  if (!error) {
    return fallbackMessage
  }

  const errorCode = error.code || ''

  if (codeMessages[errorCode]) {
    return codeMessages[errorCode]
  }

  return `${fallbackMessage}${error.message ? ` (${error.message})` : ''}`
}

export default getFirebaseErrorMessage
