const NATIONAL_ID_REGEX = /^\d{14}$/

const padTwoDigits = (value) => String(value).padStart(2, '0')

const toIsoDate = (dateInput) => {
  if (!dateInput || typeof dateInput !== 'string') {
    return ''
  }

  const trimmed = dateInput.trim()

  if (!trimmed) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split('/')
    return `${year}-${month}-${day}`
  }

  return ''
}

const isoToUsDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${month}/${day}/${year}`
}

const extractBirthDateFromEgyptianNationalId = (nationalIdInput) => {
  const nationalId = typeof nationalIdInput === 'string' ? nationalIdInput.trim() : ''

  if (!NATIONAL_ID_REGEX.test(nationalId)) {
    return {
      isValid: false,
      date: '',
      error: 'invalid-length',
    }
  }

  const centuryDigit = nationalId[0]
  const yearPart = Number(nationalId.slice(1, 3))
  const monthPart = Number(nationalId.slice(3, 5))
  const dayPart = Number(nationalId.slice(5, 7))

  const centuryPrefix = centuryDigit === '2' ? 1900 : centuryDigit === '3' ? 2000 : null

  if (!centuryPrefix) {
    return {
      isValid: false,
      date: '',
      error: 'invalid-century',
    }
  }

  const fullYear = centuryPrefix + yearPart
  const dateCandidate = new Date(fullYear, monthPart - 1, dayPart)

  const isRealDate =
    dateCandidate.getFullYear() === fullYear
    && dateCandidate.getMonth() === monthPart - 1
    && dateCandidate.getDate() === dayPart

  if (!isRealDate) {
    return {
      isValid: false,
      date: '',
      error: 'invalid-date',
    }
  }

  return {
    isValid: true,
    date: `${padTwoDigits(monthPart)}/${padTwoDigits(dayPart)}/${fullYear}`,
    error: '',
  }
}

const validateDobMatchesEgyptianNationalId = ({ dob, nationalId }) => {
  const dobIso = toIsoDate(dob)
  const parsedNationalId = extractBirthDateFromEgyptianNationalId(nationalId)

  if (!dobIso || !parsedNationalId.isValid) {
    return {
      isMatch: false,
      extractedDob: parsedNationalId.date,
      normalizedInputDob: '',
    }
  }

  const inputDobUs = isoToUsDate(dobIso)

  return {
    isMatch: inputDobUs === parsedNationalId.date,
    extractedDob: parsedNationalId.date,
    normalizedInputDob: inputDobUs,
  }
}

export {
  extractBirthDateFromEgyptianNationalId,
  validateDobMatchesEgyptianNationalId,
}
