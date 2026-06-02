import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'
import { useLongPress } from '../hooks/useLongPress'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

function formatEntryDate(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayMs   = new Date(d.getFullYear(),   d.getMonth(),   d.getDate()).getTime()
  const diff = todayMs - dayMs
  if (diff === 0)          return 'Today'
  if (diff === 86400000)   return 'Yesterday'
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export default function CategoryDrilldownSheet({ category, monthExpenses, onClose, onLongPress }) {
  const { theme } = useTheme()
  const lp = useLongPress()

  const entries = [...monthExpenses]
    .filter(e => (e.categoryId ?? e.category) === category.key)
    .sort((a, b) => {
      const aD = new Date(a.date), bD = new Date(b.date)
      const aDayMs = new Date(aD.getFullYear(), aD.getMonth(), aD.getDate()).getTime()
      const bDayMs = new Date(bD.getFullYear(), bD.getMonth(), bD.getDate()).getTime()
      if (bDayMs !== aDayMs) return bDayMs - aDayMs  // newer day first
      return aD.getTime() - bD.getTime()              // earlier-logged first within the same day
    })

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 fade-in"
        style={{ background: 'rgba(0,0,0,0.52)', zIndex: 60, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
        onClick={onClose}
      />

      <div
        className="fixed left-0 right-0 bottom-0 sheet-slide-up"
        style={{
          zIndex: 61,
          background: theme.cardBg,
          borderRadius: '24px 24px 0 0',
          maxHeight: '88dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.28)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: theme.border }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-3 pb-4 flex-shrink-0">
          <span
            className="w-12 h-12 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ background: theme.surface }}
          >
            {getIcon(category.icon, { size: 22, color: theme.primary })}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight truncate" style={{ color: theme.heading }}>
              {category.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
              {category.percentage.toFixed(1)}% of month &nbsp;·&nbsp; {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <p
              className="font-bold text-lg tabular-nums"
              style={{ color: theme.primary, letterSpacing: '-0.025em' }}
            >
              ₹{formatAmount(category.amount)}
            </p>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full btn-close flex-shrink-0"
              style={{ color: theme.textMuted, background: theme.surface }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: theme.border, flexShrink: 0 }} />

        {/* Entry list */}
        <div className="overflow-y-auto flex-1 pb-10">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p
                className="font-devanagari font-black"
                style={{ color: theme.textFaint, fontSize: '3rem', lineHeight: 1 }}
              >
                शून्य
              </p>
              <p
                className="mt-2 text-xs tracking-[0.22em] uppercase"
                style={{ color: theme.textFaint, opacity: 0.45 }}
              >
                no entries
              </p>
            </div>
          ) : (
            <div className="px-5">
              {entries.map((exp, i) => (
                <div key={exp.id}>
                  {i > 0 && <div style={{ height: '1px', background: theme.border }} />}
                  <div
                    className="flex items-center justify-between py-4 gap-4"
                    style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                    onPointerDown={lp.start(() => onLongPress?.(exp))}
                    onPointerUp={lp.cancel}
                    onPointerLeave={lp.cancel}
                    onPointerCancel={lp.cancel}
                    onPointerMove={lp.move}
                    onContextMenu={e => e.preventDefault()}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-sm leading-snug truncate"
                        style={{ color: theme.heading }}
                      >
                        {exp.note || category.name}
                      </p>
                      <p className="text-xs mt-1" style={{ color: theme.textFaint }}>
                        {formatEntryDate(exp.date)}
                      </p>
                    </div>
                    <p
                      className="font-bold text-sm tabular-nums flex-shrink-0"
                      style={{ color: theme.primary, letterSpacing: '-0.02em' }}
                    >
                      ₹{formatAmount(exp.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
