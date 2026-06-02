import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Repeat, Pencil } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'
import { fullDateLabel } from '../utils/dateFormat'

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

function formatTime(isoDate) {
  const d = new Date(isoDate)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function Row({ label, children }) {
  const { theme } = useTheme()
  return (
    <div>
      <p
        className="text-[10px] uppercase mb-2"
        style={{ color: theme.textFaint, letterSpacing: '0.14em' }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  const { theme } = useTheme()
  return <div style={{ height: 1, background: theme.border }} />
}

export default function ExpenseDetailsSheet({ expense, categories, trips, onClose, onEdit }) {
  const { theme } = useTheme()
  const [visible, setVisible] = useState(false)
  const dragStartY = useRef(null)
  const [dragY, setDragY]   = useState(0)

  // Trigger slide-up on next frame so the initial translateY(100%) is painted first.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const cat  = (categories ?? []).find(c => c.id === expense.categoryId) ?? null
  const trip = (trips ?? []).find(t => t.id === expense.tripId) ?? null
  const dateObj = new Date(expense.date)
  // Show "Logged at" only for expenses with a real wall-clock time — not synthetic
  // timestamps (T00:00:00 for future/legacy, T23:59:59 for past) or recurring entries.
  const h = dateObj.getHours(), m = dateObj.getMinutes(), s = dateObj.getSeconds()
  const hasRealTime = !expense.recurringRuleId
    && !(h === 0 && m === 0 && s === 0)
    && !(h === 23 && m === 59 && s === 59)

  function handleTouchStart(e) {
    dragStartY.current = e.touches[0].clientY
    setDragY(0)
  }

  function handleTouchMove(e) {
    if (dragStartY.current === null) return
    const dy = e.touches[0].clientY - dragStartY.current
    if (dy > 0) setDragY(dy)
  }

  function handleTouchEnd() {
    if (dragY > 80) {
      onClose()
    } else {
      setDragY(0)
    }
    dragStartY.current = null
  }

  return (
    <div
      className="fixed inset-0 flex items-end"
      style={{
        zIndex: 75,
        background: 'rgba(0,0,0,0.52)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] mx-auto"
        style={{
          borderRadius: '24px 24px 0 0',
          background: theme.cardBg,
          boxShadow: '0 -8px 48px rgba(0,0,0,0.28)',
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          transform: dragY > 0
            ? `translateY(${dragY}px)`
            : visible ? 'translateY(0)' : 'translateY(100%)',
          transition: dragY > 0 ? 'none' : 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: theme.border }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <p className="text-base font-semibold" style={{ color: theme.heading }}>Details</p>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full btn-close"
            style={{ color: theme.textMuted }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ height: 1, background: theme.border, flexShrink: 0 }} />

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          <div className="flex flex-col gap-5">

            {/* Amount — hero */}
            <Row label="Amount">
              <p
                className="font-numeric"
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: theme.primary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                }}
              >
                ₹{formatAmount(expense.amount)}
              </p>
            </Row>

            <Divider />

            {/* Description (full, no truncation) */}
            <Row label="Description">
              {expense.note ? (
                <p
                  style={{
                    color: theme.heading,
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                  }}
                >
                  {expense.note}
                </p>
              ) : (
                <p className="text-sm italic" style={{ color: theme.textFaint }}>No description</p>
              )}
            </Row>

            <Divider />

            {/* Category */}
            <Row label="Category">
              <div className="flex items-center gap-3">
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ background: theme.surface }}
                >
                  {getIcon(cat?.icon ?? 'box', { size: 17, color: theme.primary })}
                </span>
                <p className="text-sm font-semibold" style={{ color: theme.heading }}>
                  {cat?.name ?? expense.category ?? 'Unknown'}
                </p>
              </div>
            </Row>

            <Divider />

            {/* Date */}
            <Row label="Date">
              <p className="text-sm font-semibold" style={{ color: theme.text }}>
                {fullDateLabel(dateObj)}
              </p>
              {hasRealTime && (
                <p className="text-xs mt-1" style={{ color: theme.textFaint }}>
                  Logged at {formatTime(expense.date)}
                </p>
              )}
            </Row>

            {/* Trip (only if attached) */}
            {trip && (
              <>
                <Divider />
                <Row label="Trip">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: theme.primary, flexShrink: 0 }} />
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>{trip.title}</p>
                  </div>
                </Row>
              </>
            )}

            {/* Recurring indicator */}
            {expense.recurringRuleId && (
              <div className="flex items-center gap-2">
                <Repeat size={13} style={{ color: theme.textFaint }} />
                <p className="text-xs" style={{ color: theme.textFaint }}>Recurring expense</p>
              </div>
            )}

          </div>
        </div>

        {/* Edit action */}
        {onEdit && (
          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${theme.border}` }}>
            <button
              onClick={() => { onClose(); onEdit(expense) }}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{
                background: theme.surface,
                color: theme.primary,
                border: `1px solid ${theme.border}`,
              }}
            >
              <Pencil size={15} />
              Edit Expense
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
