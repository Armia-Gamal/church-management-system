import './SearchBar.css'

function SearchBar({ buttonLabel, onAdd, onChange, placeholder, value }) {
  return (
    <div className="searchbar">
      <label className="searchbar__field">
        <span className="searchbar__icon" aria-hidden="true" />
        <input
          className="searchbar__input"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
      </label>

      {onAdd ? (
        <button className="searchbar__button" onClick={onAdd} type="button">
          {buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
