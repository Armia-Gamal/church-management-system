import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './pages/Dashboard/Dashboard'
import Leaders from './pages/Leaders/Leaders'
import Login from './pages/Login/Login'
import Members from './pages/Members/Members'
import Rovers from './pages/Rovers/Rovers'
import authService from './services/authService'
import './App.css'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAccessLoading, setIsAccessLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [accessProfile, setAccessProfile] = useState({ role: 'no-access' })

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
    document.title = 'بيانات كشافه كنيسه الانبا كاراس و الانبا ابرام'
  }, [])

  useEffect(() => {
    const unsubscribe = authService.watchAuthState((user) => {
      setCurrentUser(user)
      setIsAuthLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isMounted = true

    const resolveAccessProfile = async () => {
      if (!currentUser) {
        if (isMounted) {
          setAccessProfile({ role: 'no-access' })
          setIsAccessLoading(false)
        }
        return
      }

      if (isMounted) {
        setIsAccessLoading(true)
      }

      try {
        const profile = await authService.getAccessProfile(currentUser)

        if (isMounted) {
          setAccessProfile(profile)
        }
      } catch {
        if (isMounted) {
          setAccessProfile({ role: 'no-access' })
        }
      } finally {
        if (isMounted) {
          setIsAccessLoading(false)
        }
      }
    }

    void resolveAccessProfile()

    return () => {
      isMounted = false
    }
  }, [currentUser])

  const handleLogout = async () => {
    await authService.logout()
    setIsSidebarOpen(false)
  }

  if (isAuthLoading || (currentUser && isAccessLoading)) {
    return (
      <div className="app-auth-loading" role="status" aria-live="polite">
        جارٍ التحقق من تسجيل الدخول...
      </div>
    )
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSuccess={() => {}} />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    )
  }

  if (accessProfile.role === 'no-access') {
    return (
      <div className="app-auth-loading" role="status" aria-live="polite">
        لا توجد صلاحية دخول لهذا الحساب.
        <button className="sidebar__logout" onClick={handleLogout} type="button">
          تسجيل الخروج
        </button>
      </div>
    )
  }

  const isAdmin = accessProfile.role === 'admin'
  const navItems = isAdmin
    ? [
        { label: 'لوحة التحكم', to: '/' },
        { label: 'القادة', to: '/leaders' },
        { label: 'القادة البنات', to: '/rovers' },
        { label: 'الأعضاء', to: '/members' },
      ]
    : [{ label: 'الأعضاء', to: '/members' }]

  return (
    <div className="app-shell" dir="rtl">
      <Sidebar
        isOpen={isSidebarOpen}
        navItems={navItems}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="app-main">
        <button
          aria-label="فتح القائمة"
          className="app-mobile-menu"
          onClick={() => setIsSidebarOpen((current) => !current)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <main className="app-content">
          <Routes>
            {isAdmin ? <Route path="/" element={<Dashboard />} /> : null}
            {isAdmin ? <Route path="/leaders" element={<Leaders />} /> : null}
            {isAdmin ? <Route path="/rovers" element={<Rovers />} /> : null}
            <Route path="/members" element={<Members accessProfile={accessProfile} />} />
            <Route
              path="/login"
              element={<Navigate replace to={isAdmin ? '/' : '/members'} />}
            />
            <Route
              path="*"
              element={<Navigate replace to={isAdmin ? '/' : '/members'} />}
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
