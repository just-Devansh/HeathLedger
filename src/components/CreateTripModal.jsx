import { useState, useRef, useEffect, useCallback } from 'react'
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

// Extract YYYY-MM-DD from a stored trip date, interpreting it in local time.
// Stored values may be full ISO UTC strings (old data) or plain YYYY-MM-DD (new).
// Using split('T')[0] on a UTC ISO string shifts the date one day back in IST — this avoids that.
function localDateStr(isoStr) {
  if (!isoStr) return null
  if (isoStr.length === 10) return isoStr  // already YYYY-MM-DD
  const d = new Date(isoStr)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

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

// Draggable cover image — lets the user pan to frame the right part.
// Position is stored as { x, y } in 0–100% (object-position values).
function DraggableCover({ src, position, onPositionChange, onRemove, onReplace, compressing }) {
  const { theme } = useTheme()
  const divRef    = useRef(null)
  const posRef    = useRef(position)
  const dragRef   = useRef(null)   // null = not dragging

  // Keep posRef in sync when position prop changes (e.g. new image uploaded).
  useEffect(() => { posRef.current = position }, [position])

  // Apply position directly to the DOM during drag (no React re-render = smooth).
  function applyPos(x, y) {
    posRef.current = { x, y }
    if (divRef.current) divRef.current.style.backgroundPosition = `${x}% ${y}%`
  }

  const onTouchStart = useCallback(e => {
    const t = e.touches[0]
    dragRef.current = { sx: t.clientX, sy: t.clientY, px: posRef.current.x, py: posRef.current.y }
  }, [])

  const onTouchMove = useCallback(e => {
    if (!dragRef.current) return
    const t   = e.touches[0]
    const dx  = t.clientX - dragRef.current.sx
    const dy  = t.clientY - dragRef.current.sy
    const SENS = 0.18
    const nx  = Math.max(0, Math.min(100, dragRef.current.px - dx * SENS))
    const ny  = Math.max(0, Math.min(100, dragRef.current.py - dy * SENS))
    applyPos(nx, ny)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    onPositionChange({ ...posRef.current })
  }, [onPositionChange])

  // Attach touchmove with passive:false so we can prevent page scroll while panning.
  useEffect(() => {
    const el = divRef.current
    if (!el) return
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [onTouchMove])

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: '148px' }}>
      {/* The image rendered as a background so backgroundPosition panning works */}
      <div
        ref={divRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: `${position.x}% ${position.y}%`,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      />

      {/* "Drag to reposition" hint */}
      <div
        className="absolute bottom-2 left-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full pointer-events-none"
        style={{
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M5 1v8M1 5h8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M3 3L5 1l2 2M3 7l2 2 2-2M1 3l2 2-2 2M7 3l2 2-2 2" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Drag to reposition
        </span>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-white text-lg leading-none active:scale-90 transition-transform"
        style={{ background: 'rgba(0,0,0,0.55)' }}
        aria-label="Remove cover"
      >
        ×
      </button>

      {/* Change */}
      <label
        className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-white cursor-pointer active:scale-95 transition-transform"
        style={{ background: 'rgba(0,0,0,0.55)', fontSize: '11px', fontWeight: 600 }}
      >
        {compressing ? 'Loading…' : 'Change'}
        <input type="file" accept="image/*" className="hidden" onChange={onReplace} disabled={compressing} />
      </label>
    </div>
  )
}

export default function CreateTripModal({ trip, onSave, onClose }) {
  const { theme, isDark } = useTheme()
  const isEditing = !!trip

  const [title, setTitle]           = useState(trip?.title ?? '')
  const [destination, setDest]      = useState(trip?.destination ?? '')
  const [startDate, setStartDate]   = useState(trip?.startDate ? localDateStr(trip.startDate) : todayString())
  const [endDate, setEndDate]       = useState(trip?.endDate   ? localDateStr(trip.endDate)   : todayString())
  const [coverImage, setCoverImage] = useState(trip?.coverImage ?? null)
  const [coverPos, setCoverPos]     = useState(trip?.coverPosition ?? { x: 50, y: 50 })
  const [compressing, setCompr]     = useState(false)

  async function loadImage(file) {
    if (!file) return
    setCompr(true)
    try {
      const compressed = await compressImage(file)
      setCoverImage(compressed)
      setCoverPos({ x: 50, y: 50 })  // reset position for new image
    } finally {
      setCompr(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) return
    onSave({
      id:            trip?.id ?? crypto.randomUUID(),
      title:         title.trim(),
      destination:   destination.trim(),
      startDate:     startDate,
      endDate:       endDate,
      coverImage:    coverImage ?? null,
      coverPosition: coverImage ? coverPos : null,
      createdAt:     trip?.createdAt ?? new Date().toISOString(),
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
              <DraggableCover
                src={coverImage}
                position={coverPos}
                onPositionChange={setCoverPos}
                onRemove={() => { setCoverImage(null); setCoverPos({ x: 50, y: 50 }) }}
                onReplace={e => loadImage(e.target.files?.[0])}
                compressing={compressing}
              />
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
                  onChange={e => loadImage(e.target.files?.[0])}
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

            {/* Dates */}
            <div className="flex gap-4">
              <DateField label="Start date" value={startDate} onChange={setStartDate} required isDark={isDark} theme={theme} />
              <DateField label="End date"   value={endDate}   onChange={setEndDate}   min={startDate} required isDark={isDark} theme={theme} />
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
