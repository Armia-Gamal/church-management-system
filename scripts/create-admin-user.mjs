import firebaseConfig from './firebaseConfig.mjs'

const ADMIN_EMAIL = 'church@admin.com'
const ADMIN_PASSWORD = 'Church@123'

const createAdminUser = async () => {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase API key is missing.')
  }

  const signUpEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`

  const response = await fetch(signUpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    if (result?.error?.message === 'EMAIL_EXISTS') {
      console.log('Admin user already exists in Firebase Authentication.')
      return
    }

    throw new Error(result?.error?.message || 'Failed to create admin user.')
  }

  console.log('Admin user created successfully in Firebase Authentication.')
  console.log(`Email: ${ADMIN_EMAIL}`)
}

createAdminUser().catch((error) => {
  console.error('Failed to create admin user:', error.message)
  process.exitCode = 1
})
