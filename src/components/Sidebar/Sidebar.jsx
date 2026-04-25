import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const defaultNavItems = [
  { label: 'لوحة التحكم', to: '/' },
  { label: 'القادة', to: '/leaders' },
  { label: 'القادة البنات', to: '/rovers' },
  { label: 'الأعضاء', to: '/members' },
]

function Sidebar({ isOpen, navItems = defaultNavItems, onClose, onLogout }) {
  return (
    <>
      <button
        aria-label="إغلاق القائمة"
        className={`sidebar-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        type="button"
      />

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar__top">
          <div>
            <p className="sidebar__eyebrow">نظام الإدارة الكنسية</p>
            <h1 className="sidebar__brand">بيانات كشافه كنيسه الانبا كاراس و الانبا ابرام</h1>
          </div>

          <button className="sidebar__close" onClick={onClose} type="button">
            إغلاق
          </button>
        </div>

        <p className="sidebar__summary">
          منصة موحدة لإدارة بيانات القادة والأعضاء والقادة البنات وربطها مباشرة بقاعدة
          البيانات.
        </p>

        <nav aria-label="القائمة الرئيسية" className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'is-active' : ''}`
              }
              end={item.to === '/'}
              onClick={onClose}
              to={item.to}
            >
              <span className="sidebar__link-marker" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={onLogout} type="button">
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
