import { useState } from 'react'
import authService from '../../services/authService'
import './Login.css'

const mapLoginError = (error) => {
  if (!error) {
    return 'فشل تسجيل الدخول. حاول مرة أخرى.'
  }

  if (error.code === 'auth/invalid-credential') {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
  }

  if (error.code === 'auth/too-many-requests') {
    return 'تم حظر المحاولات مؤقتًا بسبب كثرة المحاولات. حاول لاحقًا.'
  }

  if (error.code === 'auth/missing-credentials') {
    return error.message
  }

  return error.message || 'فشل تسجيل الدخول. حاول مرة أخرى.'
}

function Login({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await authService.signIn(email, password)
      onSuccess()
    } catch (error) {
      setErrorMessage(mapLoginError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="login" aria-label="تسجيل الدخول">
      <div className="login__panel">
        <p className="login__eyebrow">نظام إدارة الكشافة</p>
        <h1 className="login__title">تسجيل الدخول</h1>
        <p className="login__hint">استخدم بريدك الإلكتروني وكلمة المرور للمتابعة.</p>

        <form className="login__form" noValidate onSubmit={handleSubmit}>
          <label className="login__field">
            <span>البريد الإلكتروني</span>
            <input
              autoComplete="username"
              dir="ltr"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@domain.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="login__field">
            <span>كلمة المرور</span>
            <input
              autoComplete="current-password"
              dir="ltr"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? (
            <p className="login__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button className="login__submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Login
