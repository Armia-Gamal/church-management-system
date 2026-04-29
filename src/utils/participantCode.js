const STAGE_RULES = {
  'براعم اولاد': { gender: '1', letter: 'A' },
  'براعم بنات': { gender: '0', letter: 'A' },
  أشبال: { gender: '1', letter: 'B' },
  زهرات: { gender: '0', letter: 'B' },
  كشافة: { gender: '1', letter: 'C' },
  مرشدات: { gender: '0', letter: 'C' },
  'جواله اولاد': { gender: '1', letter: 'D' },
  'جواله بنات': { gender: '0', letter: 'D' },
  متقدم: { gender: '1', letter: 'E' },
  رائدات: { gender: '0', letter: 'E' },
}

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '')
const normalizeDigits = (value) => (typeof value === 'string' ? value.replace(/\D/g, '') : '')

const generateParticipantCode = ({ nationalId, scoutEntryYear, stage }) => {
  const normalizedNationalId = normalizeDigits(nationalId)
  const firstSeven = normalizedNationalId.slice(0, 7)

  if (firstSeven.length < 7) {
    return {
      isValid: false,
      code: '',
      error: 'national-id',
    }
  }

  const year = normalizeText(scoutEntryYear)

  if (!/^\d{4}$/.test(year)) {
    return {
      isValid: false,
      code: '',
      error: 'entry-year',
    }
  }

  const stageRule = STAGE_RULES[normalizeText(stage)]

  if (!stageRule) {
    return {
      isValid: false,
      code: '',
      error: 'stage',
    }
  }

  return {
    isValid: true,
    code: `${firstSeven}${year}${stageRule.gender}${stageRule.letter}`,
    error: '',
  }
}

export { generateParticipantCode }
