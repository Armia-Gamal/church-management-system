import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './pages/Dashboard/Dashboard'
import Leaders from './pages/Leaders/Leaders'
import Members from './pages/Members/Members'
import Rovers from './pages/Rovers/Rovers'
import './App.css'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.lang = 'ar'
    document.documentElement.dir = 'rtl'
    document.title = 'بيانات كشافه كنيسه الانبا كاراس و الانبا ابرام'
  }, [])

  return (
    <div className="app-shell" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/leaders" element={<Leaders />} />
            <Route path="/members" element={<Members />} />
            <Route path="/rovers" element={<Rovers />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
