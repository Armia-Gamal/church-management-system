import { useEffect, useState } from 'react'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import Form from '../../components/Form/Form'
import getFirebaseErrorMessage from '../../firebase/errorMessages'
import memberService from '../../services/memberService'
import './Members.css'

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
    key: 'images.profile',
    label: 'الصورة الشخصية',
    render: (member) => renderImagePreview(member.images?.profile, 'الصورة الشخصية'),
  },
  {
    key: 'images.document',
    label: 'صورة المستند',
    render: (member) => renderImagePreview(member.images?.document, 'صورة المستند'),
  },
]

const createEmptyForm = () => ({
  stage: '',
  fullName: '',
  birthDate: '',
  nationalId: '',
  phone: '',
  parentPhone: '',
  address: '',
  images: {
    profile: '',
    document: '',
  },
})

const formFields = [
  { name: 'stage', label: 'المرحلة', type: 'text', required: true },
  { name: 'fullName', label: 'الاسم رباعي', type: 'text', required: true },
  { name: 'birthDate', label: 'تاريخ الميلاد', type: 'date' },
  { name: 'nationalId', label: 'الرقم القومي', type: 'text', required: true },
  { name: 'phone', label: 'رقم الهاتف', type: 'tel', required: true },
  { name: 'parentPhone', label: 'رقم هاتف ولي الأمر', type: 'tel' },
  { name: 'address', label: 'العنوان', type: 'text', fullWidth: true },
  {
    name: 'images.profile',
    label: 'الصورة الشخصية',
    type: 'file',
    accept: 'image/*',
    fullWidth: true,
    group: 'الصور',
  },
  {
    name: 'images.document',
    label: 'صورة المستند',
    type: 'file',
    accept: 'image/*',
    fullWidth: true,
  },
]

function Members() {
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
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
      const records = await memberService.getAll()
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
        const records = await memberService.getAll()

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
  }, [])

  const filteredMembers = members.filter((member) => {
    const target =
      `${member.fullName || ''} ${member.phone || ''} ${member.nationalId || ''}`.toLowerCase()
    return target.includes(searchTerm.trim().toLowerCase())
  })

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
      stage: normalizeTextValue(formValues.stage),
      fullName: normalizeTextValue(formValues.fullName),
      birthDate: formValues.birthDate,
      nationalId: normalizeTextValue(formValues.nationalId),
      phone: normalizeTextValue(formValues.phone),
      parentPhone: normalizeTextValue(formValues.parentPhone),
      address: normalizeTextValue(formValues.address),
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
            عرض وإدارة كامل أعمدة الأعضاء مع المرحلة والعنوان وصور المستندات.
          </p>
        </div>

        <div className="records-page__chips">
          <span>الإجمالي {formatNumber(members.length)}</span>
          <span>المعروض {formatNumber(filteredMembers.length)}</span>
        </div>
      </div>

      <SearchBar
        buttonLabel="إضافة عضو"
        onAdd={handleAddClick}
        onChange={setSearchTerm}
        placeholder="ابحث بالاسم أو رقم الهاتف أو الرقم القومي"
        value={searchTerm}
      />

      {error ? <p className="records-page__error">{error}</p> : null}

      <Table
        columns={columns}
        data={filteredMembers}
        emptyMessage={
          searchTerm
            ? 'لا توجد نتائج مطابقة لبحث الأعضاء.'
            : 'لا توجد بيانات أعضاء حتى الآن. ابدأ بإضافة أول سجل.'
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
        title={selectedMember ? 'تعديل بيانات عضو' : 'إضافة عضو'}
        values={formValues}
      />
    </section>
  )
}

export default Members
