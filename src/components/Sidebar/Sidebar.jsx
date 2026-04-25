import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { label: 'لوحة التحكم', to: '/' },
  { label: 'القادة', to: '/leaders' },
  { label: 'الأعضاء', to: '/members' },
  { label: 'الجوالة', to: '/rovers' },
]

function Sidebar({ isOpen, onClose }) {
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
            <h1 className="sidebar__brand">بيانات الكنيسة</h1>
          </div>

          <button className="sidebar__close" onClick={onClose} type="button">
            إغلاق
          </button>
        </div>

        <p className="sidebar__summary">
          منصة موحدة لإدارة بيانات القادة والأعضاء والجوالة وربطها مباشرة بقاعدة
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
      </aside>
    </>
  )
}

export default Sidebar
