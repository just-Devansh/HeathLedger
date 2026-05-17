const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function monthName(date) {
  return MONTHS_LONG[date.getMonth()]
}

export function monthNameShort(date) {
  return MONTHS_SHORT[date.getMonth()]
}

export function monthYearLabel(date) {
  return `${MONTHS_LONG[date.getMonth()]} • ${date.getFullYear()}`
}

export function dayMonthLabel(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function fullDateLabel(date) {
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}
