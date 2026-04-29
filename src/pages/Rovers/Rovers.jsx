import { useEffect, useState } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import Form from '../../components/Form/Form'
import getFirebaseErrorMessage from '../../firebase/errorMessages'
import roverService from '../../services/roverService'
import { validateDobMatchesEgyptianNationalId } from '../../utils/egyptianNationalId'
import { generateParticipantCode } from '../../utils/participantCode'
import './Rovers.css'

const formatNumber = (value) => new Intl.NumberFormat('ar-EG').format(value)
const normalizeTextValue = (value) => (typeof value === 'string' ? value.trim() : '')
const statusOptions = ['نشط', 'غير نشط']
const memberStageShareOptions = [
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
    render: (rover) => formatDateTime(rover.timestamp),
  },
  { key: 'fullName', label: 'الاسم رباعي' },
  { key: 'participantCode', label: 'الكود' },
  { key: 'birthDate', label: 'تاريخ الميلاد' },
  { key: 'address', label: 'العنوان' },
  { key: 'nationalId', label: 'الرقم القومي' },
  { key: 'phone', label: 'رقم الهاتف' },
  { key: 'whatsapp', label: 'رقم الواتساب' },
  { key: 'education', label: 'المؤهل الدراسي' },
  { key: 'graduationYear', label: 'سنة التخرج' },
  { key: 'job', label: 'الوظيفة' },
  { key: 'email', label: 'البريد الإلكتروني' },
  { key: 'service2026', label: 'الخدمة' },
  { key: 'confessionFather', label: 'أب الاعتراف' },
  { key: 'confessionChurch', label: 'الكنيسة' },
  { key: 'servantsGraduationYear', label: 'سنة تخرج إعداد خدام' },
  { key: 'servantsChurch', label: 'كنيسة إعداد خدام' },
  {
    key: 'scoutEntryYear',
    label: 'تاريخ دخول الكشافه',
    render: (rover) => normalizeTextValue(rover.scoutEntryYear) || 'غير متوفر',
  },
  {
    key: 'note',
    label: 'ملاحظة',
    render: (rover) => <NotePreview note={rover.note} />,
  },
  {
    key: 'images.profile',
    label: 'الصورة الشخصية',
    render: (rover) => renderImagePreview(rover.images?.profile, 'الصورة الشخصية'),
  },
  {
    key: 'images.idFront',
    label: 'البطاقة الأمامية',
    render: (rover) => renderImagePreview(rover.images?.idFront, 'البطاقة الأمامية'),
  },
  {
    key: 'images.idBack',
    label: 'البطاقة الخلفية',
    render: (rover) => renderImagePreview(rover.images?.idBack, 'البطاقة الخلفية'),
  },
  {
    key: 'status',
    label: 'الحالة',
    render: (rover) => normalizeStatusValue(rover.status),
  },
  {
    key: 'sharedMemberStage',
    label: 'مشاركة مرحلة الأعضاء',
    render: (rover) => normalizeTextValue(rover.sharedMemberStage) || 'لا توجد مشاركة',
  },
]

const createEmptyForm = () => ({
  status: 'نشط',
  sharedMemberStage: '',
  fullName: '',
  birthDate: '',
  address: '',
  nationalId: '',
  phone: '',
  whatsapp: '',
  education: '',
  graduationYear: '',
  job: '',
  email: '',
  service2026: '',
  confessionFather: '',
  confessionChurch: '',
  servantsGraduationYear: '',
  servantsChurch: '',
  scoutEntryYear: '',
  note: '',
  images: {
    idFront: '',
    idBack: '',
    profile: '',
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
    name: 'sharedMemberStage',
    label: 'مشاركة مرحلة من الأعضاء',
    type: 'select',
    options: memberStageShareOptions,
  },
  { name: 'fullName', label: 'الاسم رباعي', type: 'text', required: true },
  { name: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
  { name: 'address', label: 'العنوان', type: 'text' },
  { name: 'nationalId', label: 'الرقم القومي', type: 'text', required: true },
  { name: 'phone', label: 'رقم الهاتف', type: 'tel', required: true },
  { name: 'whatsapp', label: 'رقم الواتساب', type: 'tel' },
  { name: 'education', label: 'المؤهل الدراسي', type: 'text' },
  { name: 'graduationYear', label: 'سنة التخرج', type: 'text' },
  { name: 'job', label: 'الوظيفة', type: 'text' },
  { name: 'email', label: 'البريد الإلكتروني', type: 'email' },
  { name: 'service2026', label: 'الخدمة', type: 'text', required: true },
  { name: 'confessionFather', label: 'أب الاعتراف', type: 'text' },
  { name: 'confessionChurch', label: 'الكنيسة', type: 'text' },
  { name: 'servantsGraduationYear', label: 'سنة تخرج إعداد خدام', type: 'text' },
  { name: 'servantsChurch', label: 'كنيسة إعداد خدام', type: 'text' },
  {
    name: 'scoutEntryYear',
    label: 'تاريخ دخول الكشافه',
    type: 'select',
    required: true,
    options: scoutYearOptions,
    fullWidth: true,
    group: 'بيانات إضافية',
  },
  {
    name: 'note',
    label: 'ملاحظة',
    type: 'textarea',
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
    name: 'images.idFront',
    label: 'صورة البطاقة الأمامية',
    type: 'file',
    accept: 'image/*,application/pdf,.pdf',
    fullWidth: true,
  },
  {
    name: 'images.idBack',
    label: 'صورة البطاقة الخلفية',
    type: 'file',
    accept: 'image/*,application/pdf,.pdf',
    fullWidth: true,
  },
]

function Rovers() {
  const [rovers, setRovers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRover, setSelectedRover] = useState(null)
  const [formValues, setFormValues] = useState(createEmptyForm())
  const [error, setError] = useState('')

  const loadRovers = async () => {
    setIsLoading(true)
    setError('')

    try {
      const records = await roverService.getAll()
      setRovers(records)
    } catch (loadError) {
      setError(
        getFirebaseErrorMessage(loadError, 'تعذر تحميل بيانات القادة البنات.'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadInitialRovers = async () => {
      try {
        const records = await roverService.getAll()

        if (isMounted) {
          setRovers(records)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            getFirebaseErrorMessage(loadError, 'تعذر تحميل بيانات القادة البنات.'),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialRovers()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredRovers = rovers.filter((rover) => {
    const target =
      `${rover.fullName || ''} ${rover.participantCode || ''} ${rover.phone || ''} ${rover.nationalId || ''}`.toLowerCase()
    const matchesSearch = target.includes(searchTerm.trim().toLowerCase())
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(normalizeStatusValue(rover.status))

    return matchesSearch && matchesStatus
  })

  const selectedStatusCount = selectedStatuses.length
  const statusCounts = rovers.reduce(
    (counts, rover) => {
      const currentStatus = normalizeStatusValue(rover.status)

      if (currentStatus === 'غير نشط') {
        counts.inactive += 1
      } else {
        counts.active += 1
      }

      return counts
    },
    { active: 0, inactive: 0 },
  )

  const toggleStatus = (status) => {
    setSelectedStatuses((currentStatuses) =>
      currentStatuses.includes(status)
        ? currentStatuses.filter((currentStatus) => currentStatus !== status)
        : [...currentStatuses, status],
    )
  }

  const clearStatusFilter = () => {
    setSelectedStatuses([])
  }

  const handleAddClick = () => {
    setSelectedRover(null)
    setFormValues(createEmptyForm())
    setError('')
    setIsFormOpen(true)
  }

  const handleEdit = (rover) => {
    setSelectedRover(rover)
    setFormValues({
      ...createEmptyForm(),
      ...rover,
      images: {
        ...createEmptyForm().images,
        ...rover.images,
      },
    })
    setError('')
    setIsFormOpen(true)
  }

  const handleDelete = async (rover) => {
    const shouldDelete = window.confirm(
      `هل تريد حذف بيانات ${rover.fullName || 'هذا الجوال'}؟`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await roverService.delete(rover.id)
      await loadRovers()
    } catch (deleteError) {
      setError(
        getFirebaseErrorMessage(deleteError, 'تعذر حذف بيانات الجوال الآن.'),
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
    setSelectedRover(null)
    setFormValues(createEmptyForm())
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const payload = {
      status: normalizeStatusValue(formValues.status),
      sharedMemberStage: normalizeTextValue(formValues.sharedMemberStage),
      fullName: normalizeTextValue(formValues.fullName),
      birthDate: formValues.birthDate,
      address: normalizeTextValue(formValues.address),
      nationalId: normalizeTextValue(formValues.nationalId),
      phone: normalizeTextValue(formValues.phone),
      whatsapp: normalizeTextValue(formValues.whatsapp),
      education: normalizeTextValue(formValues.education),
      graduationYear: normalizeTextValue(formValues.graduationYear),
      job: normalizeTextValue(formValues.job),
      email: normalizeTextValue(formValues.email),
      service2026: normalizeTextValue(formValues.service2026),
      confessionFather: normalizeTextValue(formValues.confessionFather),
      confessionChurch: normalizeTextValue(formValues.confessionChurch),
      servantsGraduationYear: normalizeTextValue(formValues.servantsGraduationYear),
      servantsChurch: normalizeTextValue(formValues.servantsChurch),
      scoutEntryYear: normalizeTextValue(formValues.scoutEntryYear),
      note: normalizeTextValue(formValues.note),
      participantCode: '',
      images: {
        profile: normalizeImageValue(formValues.images.profile),
        idFront: normalizeImageValue(formValues.images.idFront),
        idBack: normalizeImageValue(formValues.images.idBack),
      },
    }

    if (payload.sharedMemberStage && !payload.email) {
      setError('لازم إدخال البريد الإلكتروني قبل تفعيل مشاركة المرحلة.')
      return
    }

    if (!payload.fullName || !payload.phone || !payload.nationalId || !payload.service2026 || !payload.scoutEntryYear) {
      setError('الاسم رباعي ورقم الهاتف والرقم القومي والخدمة وسنة تاريخ الالتحاق حقول مطلوبة.')
      return
    }

    const existingParticipantCode = normalizeTextValue(selectedRover?.participantCode)

    if (existingParticipantCode) {
      payload.participantCode = existingParticipantCode
    } else {
      const codeResult = generateParticipantCode({
        nationalId: payload.nationalId,
        scoutEntryYear: payload.scoutEntryYear,
        stage: 'رائدات',
      })

      if (!codeResult.isValid) {
        setError('تعذر تكوين الكود تلقائيًا. تأكد من الرقم القومي وسنة الالتحاق.')
        return
      }

      payload.participantCode = codeResult.code
    }

    if (payload.birthDate && payload.nationalId) {
      const dobValidation = validateDobMatchesEgyptianNationalId({
        dob: payload.birthDate,
        nationalId: payload.nationalId,
      })

      if (!dobValidation.isMatch) {
        setError('❌ الرقم القومي غير صحيح أو لا يطابق تاريخ الميلاد')
        return
      }
    }

    setIsSaving(true)
    setError('')

    try {
      if (selectedRover) {
        await roverService.update(selectedRover.id, payload)
      } else {
        await roverService.add(payload)
      }

      handleCloseForm()
      await loadRovers()
    } catch (saveError) {
      setError(
        getFirebaseErrorMessage(saveError, 'تعذر حفظ بيانات الجوال الآن.'),
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
          <h2 className="records-page__title">بيانات القادة البنات</h2>
          <p className="records-page__copy">
            نفس أعمدة القادة بالكامل متاحة هنا لإدارة بيانات القادة البنات دون فقد أي
            حقل.
          </p>
        </div>

        <div className="records-page__chips">
          <span>الإجمالي {formatNumber(rovers.length)}</span>
          <span>النشط {formatNumber(statusCounts.active)}</span>
          <span>غير النشط {formatNumber(statusCounts.inactive)}</span>
        </div>
      </div>

      <SearchBar
        buttonLabel="إضافة قائدة"
        onAdd={handleAddClick}
        onChange={setSearchTerm}
        placeholder="ابحث بالاسم أو رقم الهاتف أو الرقم القومي"
        value={searchTerm}
      />

      <div className="records-page__filter-row">
        <div className="records-page__filter-shell">
          <div className="records-page__filter-header">
            <button
              aria-expanded={isStatusFilterOpen}
              aria-controls="rovers-status-filter"
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
            <div className="records-page__filter-panel" id="rovers-status-filter">
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

      {error ? <p className="records-page__error">{error}</p> : null}

      <Table
        columns={columns}
        data={filteredRovers}
        emptyMessage={
          searchTerm
            ? 'لا توجد نتائج مطابقة لبحث القادة البنات.'
            : 'لا توجد بيانات للقادة البنات حتى الآن. ابدأ بإضافة أول سجل.'
        }
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <Form
        errorMessage={error}
        fields={formFields}
        isOpen={isFormOpen}
        isSubmitting={isSaving}
        onChange={handleChange}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        title={selectedRover ? 'تعديل بيانات قائدة' : 'إضافة قائدة'}
        values={formValues}
      />
    </section>
  )
}

export default Rovers
