import './Form.css'

const getValueByPath = (object, path) =>
  path.split('.').reduce((currentValue, key) => currentValue?.[key], object) || ''

const normalizeFieldValue = (field, value) => {
  const normalizedValue = typeof value === 'string' ? value : ''

  if (field.type === 'date') {
    return normalizedValue ? normalizedValue.slice(0, 10) : ''
  }

  if (field.type === 'datetime-local') {
    return normalizedValue ? normalizedValue.replace('Z', '').slice(0, 16) : ''
  }

  return normalizedValue
}

const isImageFileValue = (value) => {
  if (value instanceof File) {
    return value.type.startsWith('image/')
  }

  if (typeof value !== 'string' || !value) {
    return false
  }

  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(value) || value.startsWith('data:image/')
}

const isPdfFileValue = (value) => {
  if (value instanceof File) {
    return value.type === 'application/pdf'
  }

  if (typeof value !== 'string' || !value) {
    return false
  }

  return /\.pdf(\?.*)?$/i.test(value) || value.startsWith('data:application/pdf')
}

const getFileStatusText = (value) => {
  if (value instanceof File) {
    return `تم اختيار الملف: ${value.name}`
  }

  if (typeof value === 'string' && value) {
    return 'يوجد ملف مرفوع حاليًا'
  }

  return 'لم يتم اختيار ملف'
}

function Form({
  errorMessage,
  fields,
  isOpen,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  title,
  values,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="form-modal" role="dialog" aria-modal="true">
      <button
        aria-label="إغلاق النموذج"
        className="form-modal__overlay"
        onClick={onClose}
        type="button"
      />

      <div className="form-modal__content">
        <div className="form-modal__header">
          <div>
            <p className="form-modal__eyebrow">نموذج البيانات</p>
            <h3 className="form-modal__title">{title}</h3>
          </div>

          <button className="form-modal__close" onClick={onClose} type="button">
            إغلاق
          </button>
        </div>

        <form className="record-form" noValidate onSubmit={onSubmit}>
          <div className="record-form__grid">
            {fields.map((field, index) => {
              const previousGroup = index > 0 ? fields[index - 1].group : ''
              const showGroupTitle = field.group && field.group !== previousGroup
              const fieldValue = getValueByPath(values, field.name)

              return (
                <div
                  className={`record-form__item ${field.fullWidth ? 'is-full' : ''}`}
                  key={field.name}
                >
                  {showGroupTitle ? (
                    <div className="record-form__section-title">{field.group}</div>
                  ) : null}

                  <label className="record-form__field">
                    <span>{field.label}</span>

                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        onChange={onChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={field.rows || 4}
                        value={normalizeFieldValue(field, fieldValue)}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        name={field.name}
                        onChange={onChange}
                        required={field.required}
                        value={normalizeFieldValue(field, fieldValue)}
                      >
                        <option value="">اختر {field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'file' ? (
                      <>
                        <input
                          accept={field.accept || 'image/*,application/pdf,.pdf'}
                          name={field.name}
                          onChange={onChange}
                          required={field.required}
                          type="file"
                        />

                        <p className="record-form__file-status">
                          {getFileStatusText(fieldValue)}
                        </p>

                        {typeof fieldValue === 'string' && fieldValue ? (
                          isImageFileValue(fieldValue) ? (
                            <div className="record-form__image-preview">
                              <img alt={field.label} src={fieldValue} />
                            </div>
                          ) : isPdfFileValue(fieldValue) ? (
                            <a
                              className="record-form__file-link"
                              href={fieldValue}
                              rel="noreferrer"
                              target="_blank"
                            >
                              عرض ملف PDF المرفوع
                            </a>
                          ) : null
                        ) : null}
                      </>
                    ) : (
                      <input
                        name={field.name}
                        onChange={onChange}
                        placeholder={field.placeholder}
                        required={field.required}
                        type={field.type}
                        value={normalizeFieldValue(field, fieldValue)}
                      />
                    )}
                  </label>
                </div>
              )
            })}
          </div>

          {errorMessage ? (
            <p className="record-form__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="record-form__actions">
            <button
              className="record-form__button record-form__button--secondary"
              onClick={onClose}
              type="button"
            >
              إلغاء
            </button>

            <button
              className="record-form__button record-form__button--primary"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Form
