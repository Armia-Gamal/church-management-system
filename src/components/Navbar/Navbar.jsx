import './Navbar.css'

function Navbar({ onMenuClick }) {
  return (
    <header className="navbar">
      <button
        aria-label="فتح القائمة"
        className="navbar__menu"
        onClick={onMenuClick}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="navbar__bar" aria-hidden="true" />
    </header>
  )
}

export default Navbar
