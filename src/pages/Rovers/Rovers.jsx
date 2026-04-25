import { useEffect, useState } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import Form from '../../components/Form/Form'
import getFirebaseErrorMessage from '../../firebase/errorMessages'
import roverService from '../../services/roverService'
import './Rovers.css'

const formatNumber = (value) => new Intl.NumberFormat('ar-EG').format(value)
const normalizeTextValue = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeImageValue = (value) => {
  if (value instanceof File) {
    return value
  }

  return normalizeTextValue(value)
}
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

const renderImagePreview = (imageUrl, altText) =>
  imageUrl ? (
    <a
      className="table__image-link"
      href={imageUrl}
      rel="noreferrer"
      target="_blank"
      title={altText}
    >
      <img alt={altText} className="table__image" src={imageUrl} />
    </a>
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
]

const createEmptyForm = () => ({
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
  images: {
    idFront: '',
    idBack: '',
    profile: '',
  },
})

const formFields = [
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
    name: 'images.profile',
    label: 'الصورة الشخصية',
    type: 'file',
    accept: 'image/*',
    fullWidth: true,
    group: 'الصور',
  },
  {
    name: 'images.idFront',
    label: 'صورة البطاقة الأمامية',
    type: 'file',
    accept: 'image/*',
    fullWidth: true,
  },
  {
    name: 'images.idBack',
    label: 'صورة البطاقة الخلفية',
    type: 'file',
    accept: 'image/*',
    fullWidth: true,
  },
]

function Rovers() {
  const [rovers, setRovers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
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
        getFirebaseErrorMessage(loadError, 'تعذر تحميل بيانات الجوالة.'),
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
            getFirebaseErrorMessage(loadError, 'تعذر تحميل بيانات الجوالة.'),
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
      `${rover.fullName || ''} ${rover.phone || ''} ${rover.nationalId || ''}`.toLowerCase()
    return target.includes(searchTerm.trim().toLowerCase())
  })

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
      images: {
        profile: normalizeImageValue(formValues.images.profile),
        idFront: normalizeImageValue(formValues.images.idFront),
        idBack: normalizeImageValue(formValues.images.idBack),
      },
    }

    if (!payload.fullName || !payload.phone || !payload.nationalId || !payload.service2026) {
      setError('الاسم رباعي ورقم الهاتف والرقم القومي والخدمة حقول مطلوبة.')
      return
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
          <h2 className="records-page__title">بيانات الجوالة</h2>
          <p className="records-page__copy">
            نفس أعمدة القادة بالكامل متاحة هنا لإدارة بيانات الجوالة دون فقد أي
            حقل.
          </p>
        </div>

        <div className="records-page__chips">
          <span>الإجمالي {formatNumber(rovers.length)}</span>
          <span>المعروض {formatNumber(filteredRovers.length)}</span>
        </div>
      </div>

      <SearchBar
        buttonLabel="إضافة جوال"
        onAdd={handleAddClick}
        onChange={setSearchTerm}
        placeholder="ابحث بالاسم أو رقم الهاتف أو الرقم القومي"
        value={searchTerm}
      />

      {error ? <p className="records-page__error">{error}</p> : null}

      <Table
        columns={columns}
        data={filteredRovers}
        emptyMessage={
          searchTerm
            ? 'لا توجد نتائج مطابقة لبحث الجوالة.'
            : 'لا توجد بيانات جوالة حتى الآن. ابدأ بإضافة أول سجل.'
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
        title={selectedRover ? 'تعديل بيانات جوال' : 'إضافة جوال'}
        values={formValues}
      />
    </section>
  )
}

export default Rovers
