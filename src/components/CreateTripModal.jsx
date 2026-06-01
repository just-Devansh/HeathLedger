import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

async function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        const ratio = Math.min(1, MAX / Math.max(img.width, img.height))
        const w = Math.round(img.width * ratio)
        const h = Math.round(img.height * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function todayString() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

// Indian date format: DD/MM/YYYY
function fmtDate(isoStr) {
  if (!isoStr) return '—'
  const [yyyy, mm, dd] = isoStr.split('-')
  return `${dd}/${mm}/${yyyy}`
}

function DateField({ label, value, onChange, min, required, isDark, theme }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: theme.textFaint }}>
        {label}
      </p>
      <div className="relative border-b" style={{ borderColor: theme.border }}>
        <div
          className="flex items-center justify-between py-2 select-none"
          style={{ color: theme.text }}
        >
          <span className="text-sm font-medium">{fmtDate(value)}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <input
          type="date"
          value={value}
          min={min}
          onChange={e => onChange(e.target.value)}
          required={required}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          style={{ colorScheme: isDark ? 'dark' : 'light' }}
        />
      </div>
    </div>
  )
}

export default function CreateTripModal({ trip, onSave, onClose }) {
  const { theme, isDark } = useTheme()
  const isEditing = !!trip

  const [title, setTitle]           = useState(trip?.title ?? '')
  const [destination, setDest]      = useState(trip?.destination ?? '')
  const [startDate, setStartDate]   = useState(trip?.startDate?.split('T')[0] ?? todayString())
  const [endDate, setEndDate]       = useState(trip?.endDate?.split('T')[0] ?? todayString())
  const [coverImage, setCoverImage] = useState(trip?.coverImage ?? null)
  const [compressing, setCompr]     = useState(false)

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCompr(true)
    try {
      setCoverImage(await compressImage(file))
    } finally {
      setCompr(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) return
    onSave({
      id:          trip?.id ?? crypto.randomUUID(),
      title:       title.trim(),
      destination: destination.trim(),
      startDate:   new Date(startDate + 'T00:00:00').toISOString(),
      endDate:     new Date(endDate + 'T23:59:59').toISOString(),
      coverImage:  coverImage ?? null,
      createdAt:   trip?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-end z-[70]"
      style={{ background: theme.modalBg }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl max-w-[480px] mx-auto flex flex-col"
        style={{ background: theme.cardBg, maxHeight: 'min(92dvh, 92vh)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-2">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            {isEditing ? 'Edit Trip' : 'New Trip'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full text-xl leading-none active:scale-90 transition-transform"
            style={{ background: theme.inputBg, color: theme.textMuted }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Cover image */}
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden" style={{ height: '140px' }}>
                <img src={coverImage} alt="" className="w-full h-full object-cover" />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => setCoverImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-white text-lg leading-none"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                  aria-label="Remove cover"
                >
                  ×
                </button>
                {/* Change / replace button */}
                <label
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white cursor-pointer active:scale-95 transition-transform"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  {compressing ? 'Compressing…' : 'Change'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={compressing}
                  />
                </label>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                style={{
                  height: '90px',
                  background: theme.surface,
                  border: `1.5px dashed ${theme.border}`,
                  color: theme.textFaint,
                }}
              >
                {compressing ? (
                  <p className="text-sm">Compressing…</p>
                ) : (
                  <>
                    <p className="text-2xl mb-1">🖼️</p>
                    <p className="text-xs font-medium">Add cover photo (optional)</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={compressing}
                />
              </label>
            )}

            {/* Title */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: theme.textFaint }}>
                Trip name
              </p>
              <input
                type="text"
                placeholder="e.g. Manali 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
                className="w-full border-b outline-none py-2 text-base bg-transparent"
                style={{ borderColor: theme.border, color: theme.text }}
              />
            </div>

            {/* Destination */}
            <div>
              <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: theme.textFaint }}>
                Destination (optional)
              </p>
              <input
                type="text"
                placeholder="e.g. Himachal Pradesh"
                value={destination}
                onChange={e => setDest(e.target.value)}
                className="w-full border-b outline-none py-2 text-base bg-transparent"
                style={{ borderColor: theme.border, color: theme.text }}
              />
            </div>

            {/* Dates — DD/MM/YYYY display, invisible native picker overlay */}
            <div className="flex gap-4">
              <DateField
                label="Start date"
                value={startDate}
                onChange={setStartDate}
                required
                isDark={isDark}
                theme={theme}
              />
              <DateField
                label="End date"
                value={endDate}
                onChange={setEndDate}
                min={startDate}
                required
                isDark={isDark}
                theme={theme}
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || !startDate || !endDate}
              className="py-3.5 rounded-xl text-base font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform mt-1"
              style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
            >
              {isEditing ? 'Save Changes' : 'Create Trip'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
