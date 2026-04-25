import { useEffect, useState } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import Form from '../../components/Form/Form'
import getFirebaseErrorMessage from '../../firebase/errorMessages'
import memberService from '../../services/memberService'
import './Members.css'

const formatNumber = (value) => new Intl.NumberFormat('ar-EG').format(value)
const stageOptions = [
  'براعم اولاد',
  'براعم بنات',
  'أشبال',
  'زهرات',
  'كشافة',
  'مرشدات',
  'جواله اولاد',
  'جواله بنات',
  'متقدم',
  'رائدات',
]
const normalizeTextValue = (value) => (typeof value === 'string' ? value.trim() : '')
const statusOptions = ['نشط', 'غير نشط']
const SCOUT_START_YEAR = 2000
const currentYear = new Date().getFullYear()
const scoutYearOptions = Array.from(
  { length: Math.max(currentYear - SCOUT_START_YEAR + 1, 1) },
  (_, index) => String(SCOUT_START_YEAR + index),
)
const normalizeStatusValue = (value) =>
  statusOptions.includes(normalizeTextValue(value)) ? normalizeTextValue(value) : 'نشط'
const normalizeImageValue = (value) => {
  if (value instanceof File) {
    return value
  }

  return normalizeTextValue(value)
}
const isImageUrl = (value) => /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(value)
const isPdfUrl = (value) => /\.pdf(\?.*)?$/i.test(value)
const formatDateTime = (value) => {
  if (!value) {
    return 'غير متوفر'
  }

  const normalizedDate =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : typeof value === 'string'
        ? new Date(value)
        : value?.seconds
          ? new Date(value.seconds * 1000)
          : null

  if (!normalizedDate || Number.isNaN(normalizedDate.getTime())) {
    return 'غير متوفر'
  }

  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(normalizedDate)
}

const NOTE_PREVIEW_LIMIT = 120

function NotePreview({ note }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const normalizedNote = normalizeTextValue(note)

  if (!normalizedNote) {
    return <span className="table__empty-image">لا يوجد</span>
  }

  const isLongNote = normalizedNote.length > NOTE_PREVIEW_LIMIT
  const visibleNote =
    isLongNote && !isExpanded
      ? `${normalizedNote.slice(0, NOTE_PREVIEW_LIMIT)}...`
      : normalizedNote

  return (
    <div className="table__note-preview">
      <p className="table__note-text">{visibleNote}</p>
      {isLongNote ? (
        <button
          className="table__note-toggle"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? 'عرض أقل' : 'عرض المزيد'}
        </button>
      ) : null}
    </div>
  )
}

const renderImagePreview = (imageUrl, altText) =>
  imageUrl ? (
    isPdfUrl(imageUrl) ? (
      <a className="table__image-link" href={imageUrl} rel="noreferrer" target="_blank">
        <span className="table__empty-image">فتح PDF</span>
      </a>
    ) : (
      <a
        className="table__image-link"
        href={imageUrl}
        rel="noreferrer"
        target="_blank"
        title={altText}
      >
        {isImageUrl(imageUrl) ? (
          <img alt={altText} className="table__image" src={imageUrl} />
        ) : (
          <span className="table__empty-image">فتح الملف</span>
        )}
      </a>
    )
  ) : (
    <span className="table__empty-image">لا يوجد</span>
  )

const columns = [
  {
    key: 'timestamp',
    label: 'التاريخ',
    render: (member) => formatDateTime(member.timestamp),
  },
  { key: 'stage', label: 'المرحلة' },
  { key: 'fullName', label: 'الاسم رباعي' },
  { key: 'birthDate', label: 'تاريخ الميلاد' },
  { key: 'nationalId', label: 'الرقم القومي' },
  { key: 'phone', label: 'رقم الهاتف' },
  { key: 'parentPhone', label: 'رقم هاتف ولي الأمر' },
  { key: 'address', label: 'العنوان' },
  {
    key: 'scoutEntryYear',
    label: 'تاريخ دخول الكشافه',
    render: (member) => normalizeTextValue(member.scoutEntryYear) || 'غير متوفر',
  },
  {
    key: 'note',
    label: 'ملاحظة',
    render: (member) => <NotePreview note={member.note} />,
  },
  {
    key: 'images.profile',
    label: 'الصورة الشخصية',
    render: (member) => renderImagePreview(member.images?.profile, 'الصورة الشخصية'),
  },
  {
    key: 'images.document',
    label: 'صورة المستند',
    render: (member) => renderImagePreview(member.images?.document, 'صورة المستند'),
  },
  {
    key: 'scoutEntryYear',
    label: 'تاريخ دخول الكشافه',
    render: (member) => normalizeTextValue(member.scoutEntryYear) || 'غير متوفر',
  },
  {
    key: 'status',
    label: 'الحالة',
    render: (member) => normalizeStatusValue(member.status),
  },
]

const createEmptyForm = () => ({
  status: 'نشط',
  stage: '',
  fullName: '',
  birthDate: '',
  nationalId: '',
  phone: '',
  parentPhone: '',
  address: '',
  scoutEntryYear: '',
  note: '',
  images: {
    profile: '',
    document: '',
  },
})

const formFields = [
  {
    name: 'status',
    label: 'الحالة',
    type: 'select',
    required: true,
    options: statusOptions,
  },
  {
    name: 'stage',
    label: 'المرحلة',
    type: 'select',
    required: true,
    options: stageOptions,
  },
  { name: 'fullName', label: 'الاسم رباعي', type: 'text', required: true },
  { name: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
  { name: 'nationalId', label: 'الرقم القومي', type: 'text', required: true },
  { name: 'phone', label: 'رقم الهاتف', type: 'tel', required: true },
  { name: 'parentPhone', label: 'رقم هاتف ولي الأمر', type: 'tel' },
  { name: 'address', label: 'العنوان', type: 'text', fullWidth: true },
  {
    name: 'note',
    label: 'ملاحظة',
    type: 'textarea',
    fullWidth: true,
    group: 'بيانات إضافية',
  },
  {
    name: 'scoutEntryYear',
    label: 'تاريخ دخول الكشافه',
    type: 'select',
    options: scoutYearOptions,
    fullWidth: true,
    group: 'بيانات إضافية',
  },
  {
    name: 'images.profile',
    label: 'الصورة الشخصية',
    type: 'file',
    accept: 'image/*,application/pdf,.pdf',
    fullWidth: true,
    group: 'الصور',
  },
  {
    name: 'images.document',
    label: 'صورة المستند',
    type: 'file',
    accept: 'image/*,application/pdf,.pdf',
    fullWidth: true,
  },
]

function Members({ accessProfile }) {
  const isSharedStageUser = accessProfile?.role === 'shared-member-stage'
  const sharedMemberStage = normalizeTextValue(accessProfile?.memberStageAccess)
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStages, setSelectedStages] = useState(
    isSharedStageUser && sharedMemberStage ? [sharedMemberStage] : [],
  )
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  const [isStageFilterOpen, setIsStageFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [formValues, setFormValues] = useState(createEmptyForm())
  const [error, setError] = useState('')

  const loadMembers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const records =
        isSharedStageUser && sharedMemberStage
          ? await memberService.getByStage(sharedMemberStage)
          : await memberService.getAll()
      setMembers(records)
    } catch (loadError) {
      setError(
        getFirebaseErrorMessage(loadError, 'تعذر تحميل بيانات الأعضاء.'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadInitialMembers = async () => {
      try {
        const records =
          isSharedStageUser && sharedMemberStage
            ? await memberService.getByStage(sharedMemberStage)
            : await memberService.getAll()

        if (isMounted) {
          setMembers(records)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            getFirebaseErrorMessage(loadError, 'تعذر تحميل بيانات الأعضاء.'),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialMembers()

    return () => {
      isMounted = false
    }
  }, [isSharedStageUser, sharedMemberStage])

  useEffect(() => {
    if (!isSharedStageUser) {
      return
    }

    setSelectedStages(sharedMemberStage ? [sharedMemberStage] : [])
  }, [isSharedStageUser, sharedMemberStage])

  useEffect(() => {
    if (!error) {
      return undefined
    }

    const timerId = window.setTimeout(() => {
      setError('')
    }, 5000)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [error])

  const filteredMembers = members.filter((member) => {
    const target =
      `${member.fullName || ''} ${member.phone || ''} ${member.nationalId || ''}`.toLowerCase()

    const matchesSearch = target.includes(searchTerm.trim().toLowerCase())
    const matchesStage = isSharedStageUser
      ? member.stage === sharedMemberStage
      : selectedStages.length === 0 || selectedStages.includes(member.stage)
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(normalizeStatusValue(member.status))

    return matchesSearch && matchesStage && matchesStatus
  })

  const selectedStageCount = selectedStages.length
  const selectedStatusCount = selectedStatuses.length
  const statusCounts = members.reduce(
    (counts, member) => {
      const currentStatus = normalizeStatusValue(member.status)

      if (currentStatus === 'غير نشط') {
        counts.inactive += 1
      } else {
        counts.active += 1
      }

      return counts
    },
    { active: 0, inactive: 0 },
  )

  const toggleStage = (stage) => {
    if (isSharedStageUser) {
      return
    }

    setSelectedStages((currentStages) =>
      currentStages.includes(stage)
        ? currentStages.filter((currentStage) => currentStage !== stage)
        : [...currentStages, stage],
    )
  }

  const toggleStatus = (status) => {
    setSelectedStatuses((currentStatuses) =>
      currentStatuses.includes(status)
        ? currentStatuses.filter((currentStatus) => currentStatus !== status)
        : [...currentStatuses, status],
    )
  }

  const clearStageFilter = () => {
    if (isSharedStageUser) {
      return
    }

    setSelectedStages([])
  }

  const clearStatusFilter = () => {
    setSelectedStatuses([])
  }

  const handleAddClick = () => {
    setSelectedMember(null)
    setFormValues(createEmptyForm())
    setError('')
    setIsFormOpen(true)
  }

  const handleEdit = (member) => {
    setSelectedMember(member)
    setFormValues({
      ...createEmptyForm(),
      ...member,
      images: {
        ...createEmptyForm().images,
        ...member.images,
      },
    })
    setError('')
    setIsFormOpen(true)
  }

  const handleDelete = async (member) => {
    const shouldDelete = window.confirm(
      `هل تريد حذف بيانات ${member.fullName || 'هذا العضو'}؟`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await memberService.delete(member.id)
      await loadMembers()
    } catch (deleteError) {
      setError(
        getFirebaseErrorMessage(deleteError, 'تعذر حذف بيانات العضو الآن.'),
      )
    }
  }

  const handleChange = (event) => {
    const { files, name, type, value } = event.target
    const path = name.split('.')
    const nextValue = type === 'file' ? files?.[0] || null : value

    setFormValues((current) => {
      const nextValues = { ...current }
      let pointer = nextValues

      path.slice(0, -1).forEach((key) => {
        pointer[key] = { ...(pointer[key] || {}) }
        pointer = pointer[key]
      })

      pointer[path[path.length - 1]] = nextValue

      return nextValues
    })
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedMember(null)
    setFormValues(createEmptyForm())
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      status: normalizeStatusValue(formValues.status),
      stage: normalizeTextValue(formValues.stage),
      fullName: normalizeTextValue(formValues.fullName),
      birthDate: formValues.birthDate,
      nationalId: normalizeTextValue(formValues.nationalId),
      phone: normalizeTextValue(formValues.phone),
      parentPhone: normalizeTextValue(formValues.parentPhone),
      address: normalizeTextValue(formValues.address),
      scoutEntryYear: normalizeTextValue(formValues.scoutEntryYear),
      note: normalizeTextValue(formValues.note),
      images: {
        profile: normalizeImageValue(formValues.images.profile),
        document: normalizeImageValue(formValues.images.document),
      },
    }

    if (!payload.stage || !payload.fullName || !payload.phone || !payload.nationalId) {
      setError('المرحلة والاسم رباعي ورقم الهاتف والرقم القومي حقول مطلوبة.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      if (selectedMember) {
        await memberService.update(selectedMember.id, payload)
      } else {
        await memberService.add(payload)
      }

      handleCloseForm()
      await loadMembers()
    } catch (saveError) {
      setError(
        getFirebaseErrorMessage(saveError, 'تعذر حفظ بيانات العضو الآن.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="records-page">
      <div className="records-page__header">
        <div>
          <p className="records-page__eyebrow">قسم البيانات</p>
          <h2 className="records-page__title">بيانات الأعضاء</h2>
          <p className="records-page__copy">
            {isSharedStageUser && sharedMemberStage
              ? `عرض أعضاء مرحلة ${sharedMemberStage} فقط حسب المشاركة المخصصة لهذا الحساب.`
              : 'عرض وإدارة كامل أعمدة الأعضاء مع المرحلة والعنوان وصور المستندات.'}
          </p>
        </div>

        <div className="records-page__chips">
          <span>الإجمالي {formatNumber(members.length)}</span>
          <span>النشط {formatNumber(statusCounts.active)}</span>
          <span>غير النشط {formatNumber(statusCounts.inactive)}</span>
        </div>
      </div>

      <SearchBar
        buttonLabel={isSharedStageUser ? '' : 'إضافة عضو'}
        onAdd={isSharedStageUser ? undefined : handleAddClick}
        onChange={setSearchTerm}
        placeholder="ابحث بالاسم أو رقم الهاتف أو الرقم القومي"
        value={searchTerm}
      />

      {isSharedStageUser && sharedMemberStage ? (
        <div className="records-page__chips">
          <span>المرحلة المخصصة: {sharedMemberStage}</span>
        </div>
      ) : null}

      {!isSharedStageUser ? (
        <div className="records-page__filters-grid">
        <div className="records-page__filter-row">
          <div className="records-page__filter-shell">
            <div className="records-page__filter-header">
              <button
                aria-expanded={isStageFilterOpen}
                aria-controls="members-stage-filter"
                className="records-page__filter-trigger"
                onClick={() => setIsStageFilterOpen((current) => !current)}
                type="button"
              >
                <span>فلتر المرحلة</span>
                <strong>
                  {selectedStageCount > 0 ? `${selectedStageCount} مختارة` : 'الكل'}
                </strong>
              </button>

              {selectedStageCount > 0 ? (
                <button
                  className="records-page__filter-clear"
                  onClick={clearStageFilter}
                  type="button"
                >
                  مسح الفلتر
                </button>
              ) : null}
            </div>

            {isStageFilterOpen ? (
              <div className="records-page__filter-panel" id="members-stage-filter">
                {stageOptions.map((stage) => {
                  const isChecked = selectedStages.includes(stage)

                  return (
                    <label className={`records-page__filter-option ${isChecked ? 'is-active' : ''}`} key={stage}>
                      <input
                        checked={isChecked}
                        onChange={() => toggleStage(stage)}
                        type="checkbox"
                      />
                      <span>{stage}</span>
                    </label>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="records-page__filter-row">
          <div className="records-page__filter-shell">
            <div className="records-page__filter-header">
              <button
                aria-expanded={isStatusFilterOpen}
                aria-controls="members-status-filter"
                className="records-page__filter-trigger"
                onClick={() => setIsStatusFilterOpen((current) => !current)}
                type="button"
              >
                <span>فلتر الحالة</span>
                <strong>
                  {selectedStatusCount > 0 ? `${selectedStatusCount} مختارة` : 'الكل'}
                </strong>
              </button>

              {selectedStatusCount > 0 ? (
                <button
                  className="records-page__filter-clear"
                  onClick={clearStatusFilter}
                  type="button"
                >
                  مسح الفلتر
                </button>
              ) : null}
            </div>

            {isStatusFilterOpen ? (
              <div className="records-page__filter-panel" id="members-status-filter">
                {statusOptions.map((status) => {
                  const isChecked = selectedStatuses.includes(status)

                  return (
                    <label className={`records-page__filter-option ${isChecked ? 'is-active' : ''}`} key={status}>
                      <input
                        checked={isChecked}
                        onChange={() => toggleStatus(status)}
                        type="checkbox"
                      />
                      <span>{status}</span>
                    </label>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      ) : null}

      <Table
        columns={columns}
        data={filteredMembers}
        emptyMessage={
          searchTerm
            ? 'لا توجد نتائج مطابقة لبحث الأعضاء.'
            : 'لا توجد بيانات أعضاء حتى الآن. ابدأ بإضافة أول سجل.'
        }
        isLoading={isLoading}
        showActions={!isSharedStageUser}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {!isSharedStageUser ? (
        <Form
          errorMessage={error}
          fields={formFields}
          isOpen={isFormOpen}
          isSubmitting={isSaving}
          onChange={handleChange}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          title={selectedMember ? 'تعديل بيانات عضو' : 'إضافة عضو'}
          values={formValues}
        />
      ) : null}
    </section>
  )
}

export default Members
