import { useEffect, useMemo, useState } from 'react'
import './Table.css'

const readValueByPath = (object, path) =>
  path.split('.').reduce((current, key) => current?.[key], object)

function Table({
  columns,
  data,
  emptyMessage,
  isLoading,
  onDelete,
  onEdit,
  pageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState(() => new Set())
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() =>
    columns.map((column) => column.key),
  )
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  )

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const visibleColumns = useMemo(
    () => columns.filter((column) => visibleColumnKeys.includes(column.key)),
    [columns, visibleColumnKeys],
  )
  const isCompactTable = visibleColumns.length <= 5

  const getCellValue = (row, column) => {
    if (column.render) {
      return column.render(row)
    }

    const rawValue = readValueByPath(row, column.key)
    return rawValue || 'غير متوفر'
  }

  const getMobileSummary = (row) => {
    const title = row.fullName || getCellValue(row, visibleColumns[0] || columns[0])
    const chips = [row.stage, row.phone, row.nationalId].filter(Boolean).slice(0, 2)

    return { chips, title }
  }

  useEffect(() => {
    setCurrentPage(1)
    setExpandedRows(new Set())
  }, [data])

  useEffect(() => {
    setVisibleColumnKeys((currentKeys) => {
      const nextKeys = columns.map((column) => column.key)
      const filteredKeys = currentKeys.filter((key) => nextKeys.includes(key))

      return filteredKeys.length > 0 ? filteredKeys : nextKeys
    })
  }, [columns])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)')

    const handleViewportChange = (event) => {
      setIsMobile(event.matches)
    }

    setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener('change', handleViewportChange)

    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange)
    }
  }, [])

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return data.slice(startIndex, startIndex + pageSize)
  }, [currentPage, data, pageSize])

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumnKeys((currentKeys) => {
      if (currentKeys.length === 1 && currentKeys.includes(columnKey)) {
        return currentKeys
      }

      if (currentKeys.includes(columnKey)) {
        return currentKeys.filter((key) => key !== columnKey)
      }

      return [...currentKeys, columnKey]
    })
  }

  const showAllColumns = () => {
    setVisibleColumnKeys(columns.map((column) => column.key))
  }

  const toggleRowDetails = (rowId) => {
    setExpandedRows((currentRows) => {
      const nextRows = new Set(currentRows)

      if (nextRows.has(rowId)) {
        nextRows.delete(rowId)
      } else {
        nextRows.add(rowId)
      }

      return nextRows
    })
  }

  return (
    <div className="table-shell">
      <div className="table__toolbar">
        <div className="table__toolbar-meta">
          <span className="table__toolbar-label">الأعمدة الظاهرة</span>
          <strong className="table__toolbar-count">
            {visibleColumns.length}/{columns.length}
          </strong>
        </div>

        <div className="table__toolbar-actions">
          <button
            aria-expanded={isColumnPickerOpen}
            aria-controls="table-column-picker"
            className="table__toolbar-btn"
            onClick={() => setIsColumnPickerOpen((current) => !current)}
            type="button"
          >
            اختيار الأعمدة
          </button>

          {visibleColumns.length !== columns.length ? (
            <button className="table__toolbar-btn" onClick={showAllColumns} type="button">
              إظهار الكل
            </button>
          ) : null}
        </div>
      </div>

      {isColumnPickerOpen ? (
        <div className="table__column-picker" id="table-column-picker">
          {columns.map((column) => {
            const isChecked = visibleColumnKeys.includes(column.key)

            return (
              <label className="table__column-option" key={column.key}>
                <input
                  checked={isChecked}
                  onChange={() => toggleColumnVisibility(column.key)}
                  type="checkbox"
                />
                <span>{column.label}</span>
              </label>
            )
          })}
        </div>
      ) : null}

      {!isMobile ? (
        <div className="table-scroll">
          <table className={`table ${isCompactTable ? 'table--compact' : ''}`}>
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <th key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
                <th scope="col">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td className="table__status" colSpan={visibleColumns.length + 1}>
                    جارٍ تحميل البيانات...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td className="table__status" colSpan={visibleColumns.length + 1}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.id}>
                    {visibleColumns.map((column) => {
                      const value = getCellValue(row, column)

                      return (
                        <td data-label={column.label} key={column.key}>
                          {value}
                        </td>
                      )
                    })}

                    <td className="table__actions" data-label="الإجراءات">
                      <div className="table__actions-inner">
                        <button
                          aria-label="تعديل"
                          className="table__action table__action--edit"
                          onClick={() => onEdit(row)}
                          title="تعديل"
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="table__icon"
                            viewBox="0 0 24 24"
                          >
                            <path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5zm17.7-10.3a1 1 0 0 0 0-1.4l-1.5-1.5a1 1 0 0 0-1.4 0l-1.2 1.2 4.5 4.5 1.1-1.1z" />
                          </svg>
                        </button>
                        <button
                          aria-label="حذف"
                          className="table__action table__action--delete"
                          onClick={() => onDelete(row)}
                          title="حذف"
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="table__icon"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8zM7 10h2v8H7v-8zm1 11h8a2 2 0 0 0 2-2V8H6v11a2 2 0 0 0 2 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-mobile">
          {isLoading ? (
            <p className="table__status">جارٍ تحميل البيانات...</p>
          ) : data.length === 0 ? (
            <p className="table__status">{emptyMessage}</p>
          ) : (
            paginatedData.map((row) => {
              const isExpanded = expandedRows.has(row.id)
              const { chips, title } = getMobileSummary(row)

              return (
                <article className="table-mobile__card" key={row.id}>
                  <header className="table-mobile__header">
                    <div>
                      <h3 className="table-mobile__title">{title}</h3>

                      {chips.length > 0 ? (
                        <div className="table-mobile__chips">
                          {chips.map((chipValue, index) => (
                            <span className="table-mobile__chip" key={`${row.id}-chip-${index}`}>
                              {chipValue}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <button
                      aria-expanded={isExpanded}
                      className="table-mobile__details-btn"
                      onClick={() => toggleRowDetails(row.id)}
                      type="button"
                    >
                      {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </button>
                  </header>

                  {isExpanded ? (
                    <div className="table-mobile__details">
                      {visibleColumns.map((column) => (
                        <div className="table-mobile__detail-row" key={`${row.id}-${column.key}`}>
                          <span className="table-mobile__detail-label">{column.label}</span>
                          <div className="table-mobile__detail-value">
                            {getCellValue(row, column)}
                          </div>
                        </div>
                      ))}

                      <div className="table-mobile__actions">
                        <button
                          className="table__action table__action--edit"
                          onClick={() => onEdit(row)}
                          title="تعديل"
                          type="button"
                        >
                          <svg aria-hidden="true" className="table__icon" viewBox="0 0 24 24">
                            <path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5zm17.7-10.3a1 1 0 0 0 0-1.4l-1.5-1.5a1 1 0 0 0-1.4 0l-1.2 1.2 4.5 4.5 1.1-1.1z" />
                          </svg>
                        </button>
                        <button
                          className="table__action table__action--delete"
                          onClick={() => onDelete(row)}
                          title="حذف"
                          type="button"
                        >
                          <svg aria-hidden="true" className="table__icon" viewBox="0 0 24 24">
                            <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v8h-2v-8zm4 0h2v8h-2v-8zM7 10h2v8H7v-8zm1 11h8a2 2 0 0 0 2-2V8H6v11a2 2 0 0 0 2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>
      )}

      {!isLoading && data.length > pageSize ? (
        <div className="table__pagination" role="navigation" aria-label="التنقل بين صفحات الجدول">
          <button
            className="table__page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            type="button"
          >
            السابق
          </button>

          <p className="table__page-indicator">
            صفحة {currentPage} من {totalPages}
          </p>

          <button
            className="table__page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            type="button"
          >
            التالي
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default Table
