import { useMemo, useState } from 'react'
import { ArrowLeft, Edit2, Trash2, Plus, MapPin, Calendar } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { getIcon } from '../utils/icons'
import CreateTripModal from './CreateTripModal'
import { useLongPress } from '../hooks/useLongPress'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

// Parse a date string as local time regardless of whether it's YYYY-MM-DD or a full ISO string.
// new Date('YYYY-MM-DD') is parsed as UTC midnight which shifts the date in IST — always
// append T00:00:00 to force local-time parsing.
function toLocalDate(str) {
  if (!str) return new Date()
  return new Date(str.length === 10 ? str + 'T00:00:00' : str)
}

function formatDateRange(startDate, endDate) {
  const s = toLocalDate(startDate)
  const e = toLocalDate(endDate)
  const start = `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]}`
  const end   = `${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}${e.getFullYear() !== s.getFullYear() ? ' ' + e.getFullYear() : ''}`
  return `${start} – ${end}`
}

function dayCount(startDate, endDate) {
  const diff = toLocalDate(endDate) - toLocalDate(startDate)
  return Math.max(1, Math.round(diff / 86400000) + 1)
}

function formatEntryDate(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  const todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayMs   = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = todayMs - dayMs
  if (diff === 0)        return 'Today'
  if (diff === 86400000) return 'Yesterday'
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

export default function TripDetailScreen({
  trip, expenses, categories,
  onClose, onSaveTrip, onDeleteTrip,
  onAddExpense, onLongPress,
}) {
  const { theme, isDark } = useTheme()
  const lp = useLongPress()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingTrip, setEditingTrip] = useState(null)

  const tripExpenses = useMemo(() =>
    expenses
      .filter(e => e.tripId === trip.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [expenses, trip.id]
  )

  const { totalSpend, biggestExpense, biggestDay, breakdown } = useMemo(() => {
    const total = tripExpenses.reduce((s, e) => s + e.amount, 0)

    const topExp = tripExpenses.reduce((max, e) => (!max || e.amount > max.amount ? e : max), null)
    const catById = Object.fromEntries((categories ?? []).map(c => [c.id, c]))
    const biggestExpense = topExp
      ? {
          amount: topExp.amount,
          label: topExp.note || catById[topExp.categoryId]?.name || 'Expense',
        }
      : null

    const byDay = {}
    for (const e of tripExpenses) {
      const key = new Date(e.date).toDateString()
      byDay[key] = (byDay[key] || 0) + e.amount
    }
    const bestEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]
    const biggestDay = bestEntry
      ? { date: new Date(bestEntry[0]), total: bestEntry[1] }
      : null

    const byCat = {}
    for (const exp of tripExpenses) {
      const key = exp.categoryId ?? exp.category ?? 'Unknown'
      byCat[key] = (byCat[key] || 0) + exp.amount
    }
    const breakdown = Object.entries(byCat)
      .map(([key, amount]) => {
        const cat = catById[key]
        return {
          key,
          name: cat?.name ?? key,
          icon: cat?.icon ?? 'box',
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.amount - a.amount)

    return { totalSpend: total, biggestExpense, biggestDay, breakdown }
  }, [tripExpenses, trip, categories])

  const days   = dayCount(trip.startDate, trip.endDate)
  const barBg  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
  const hasCover = !!trip.coverImage

  return (
    <div
      className="fixed inset-0 flex flex-col insights-enter"
      style={{ background: theme.pageBg, zIndex: 57 }}
    >
      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover image */}
        {hasCover && (
          <div style={{ height: '220px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <img
              src={trip.coverImage}
              alt=""
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                objectPosition: trip.coverPosition
                  ? `${trip.coverPosition.x}% ${trip.coverPosition.y}%`
                  : 'center center',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.62) 100%)',
              }}
            />
          </div>
        )}

      <div className="max-w-[480px] mx-auto px-4 pb-6">
        {/* Action bar */}
        <div
          className="flex items-center justify-between gap-3 pt-4 pb-5"
          style={{
            marginTop: hasCover ? '-56px' : '0',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform flex-shrink-0"
            style={{
              background: hasCover ? 'rgba(0,0,0,0.45)' : theme.surface,
              color: hasCover ? '#ffffff' : theme.heading,
              backdropFilter: hasCover ? 'blur(8px)' : 'none',
              WebkitBackdropFilter: hasCover ? 'blur(8px)' : 'none',
            }}
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingTrip(trip)}
              className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{
                background: hasCover ? 'rgba(0,0,0,0.45)' : theme.surface,
                color: hasCover ? '#ffffff' : theme.heading,
                backdropFilter: hasCover ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: hasCover ? 'blur(8px)' : 'none',
              }}
              aria-label="Edit trip"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{
                background: hasCover ? 'rgba(0,0,0,0.45)' : theme.surface,
                color: hasCover ? 'rgba(255,110,110,0.9)' : '#ef4444',
                backdropFilter: hasCover ? 'blur(8px)' : 'none',
                WebkitBackdropFilter: hasCover ? 'blur(8px)' : 'none',
              }}
              aria-label="Delete trip"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Trip identity */}
        <div className="mb-6">
          <h1
            className="font-display leading-none tracking-tight mb-3"
            style={{
              color: theme.heading,
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}
          >
            {trip.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {trip.destination && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} color={theme.textFaint} />
                <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
                  {trip.destination}
                </p>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar size={12} color={theme.textFaint} />
              <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
                {formatDateRange(trip.startDate, trip.endDate)} · {days} {days === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </div>

        {/* Hero total */}
        <div
          className="rounded-2xl p-6 mb-5 text-center"
          style={{ background: theme.gradientBg, boxShadow: theme.heroShadow }}
        >
          <p
            className="text-xs font-semibold uppercase mb-2"
            style={{ color: theme.mutedText, letterSpacing: '0.12em' }}
          >
            Total trip spend
          </p>
          <p
            className="font-numeric"
            style={{ color: '#ffffff', fontSize: '2.75rem', fontWeight: 700, lineHeight: 1 }}
          >
            ₹{formatAmount(totalSpend)}
          </p>
          <p className="text-xs mt-2.5 font-medium" style={{ color: theme.mutedText }}>
            {tripExpenses.length} {tripExpenses.length === 1 ? 'expense' : 'expenses'} · {days} {days === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* Stat chips */}
        {tripExpenses.length > 0 && (
          <div className="flex gap-3 mb-5">
            {biggestExpense && (
              <div
                className="flex-1 p-4 rounded-2xl"
                style={{
                  background: theme.cardBg,
                  border: `1px solid rgba(${theme.shadowRgb}, 0.12)`,
                  boxShadow: `0 2px 12px rgba(${theme.shadowRgb}, 0.06)`,
                }}
              >
                <p className="text-xs font-medium mb-1.5" style={{ color: theme.textFaint }}>
                  Biggest expense
                </p>
                <p
                  className="font-numeric font-bold"
                  style={{ color: theme.heading, fontSize: '1.3rem', letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  ₹{formatAmount(biggestExpense.amount)}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: theme.textFaint }}>
                  {biggestExpense.label}
                </p>
              </div>
            )}
            {biggestDay && (
              <div
                className="flex-1 p-4 rounded-2xl"
                style={{
                  background: theme.cardBg,
                  border: `1px solid rgba(${theme.shadowRgb}, 0.12)`,
                  boxShadow: `0 2px 12px rgba(${theme.shadowRgb}, 0.06)`,
                }}
              >
                <p className="text-xs font-medium mb-1.5" style={{ color: theme.textFaint }}>
                  Biggest day
                </p>
                <p
                  className="font-numeric font-bold"
                  style={{ color: theme.primary, fontSize: '1.3rem', letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  ₹{formatAmount(biggestDay.total)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
                  {biggestDay.date.getDate()} {MONTHS_SHORT[biggestDay.date.getMonth()]}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category breakdown */}
        {breakdown.length > 0 && (
          <div className="mb-5">
            <p
              className="text-sm font-semibold mb-3 tracking-tight"
              style={{ color: theme.heading }}
            >
              Where it went
            </p>
            <div className="flex flex-col gap-3">
              {breakdown.map(({ key, name, icon, amount, percentage }) => (
                <div
                  key={key}
                  className="p-4 rounded-2xl"
                  style={{
                    background: theme.cardBg,
                    border: `1px solid rgba(${theme.shadowRgb}, 0.18)`,
                    boxShadow: `0 2px 14px rgba(${theme.shadowRgb}, 0.09)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ background: theme.surface }}
                      >
                        {getIcon(icon, { size: 18, color: theme.primary })}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-bold tracking-tight leading-tight truncate"
                          style={{ color: theme.heading }}
                        >
                          {name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-base font-bold leading-tight tracking-tight flex-shrink-0"
                      style={{ color: theme.primary }}
                    >
                      ₹{formatAmount(amount)}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: barBg }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${theme.primary}, ${theme.gradEnd})`,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-sm font-semibold tracking-tight"
              style={{ color: theme.heading }}
            >
              All expenses
            </p>
            <span className="text-xs" style={{ color: theme.textFaint }}>
              {tripExpenses.length}
            </span>
          </div>

          {tripExpenses.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <p
                className="font-devanagari font-black mb-2"
                style={{ color: theme.textFaint, fontSize: '3rem', lineHeight: 1 }}
              >
                शून्य
              </p>
              <p
                className="text-xs tracking-[0.22em] uppercase"
                style={{ color: theme.textFaint, opacity: 0.45 }}
              >
                no expenses yet
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: theme.cardBg,
                border: `1px solid rgba(${theme.shadowRgb}, 0.12)`,
              }}
            >
              {tripExpenses.map((exp, i) => {
                const cat = categories.find(c => c.id === exp.categoryId)
                return (
                  <div key={exp.id}>
                    {i > 0 && (
                      <div
                        style={{ height: '1px', background: theme.border, marginLeft: '60px' }}
                      />
                    )}
                    <div
                      className="flex items-center gap-3 px-4 py-3.5"
                      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                      onPointerDown={lp.start(() => onLongPress?.(exp))}
                      onPointerUp={lp.cancel}
                      onPointerLeave={lp.cancel}
                      onPointerCancel={lp.cancel}
                      onPointerMove={lp.move}
                      onContextMenu={e => e.preventDefault()}
                    >
                      <span
                        className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ background: theme.surface }}
                      >
                        {getIcon(cat?.icon ?? 'box', { size: 16, color: theme.primary })}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-snug truncate"
                          style={{ color: theme.heading }}
                        >
                          {exp.note || cat?.name || 'Expense'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: theme.textFaint }}>
                          {cat?.name ?? exp.category ?? ''}{cat?.name ? ' · ' : ''}{formatEntryDate(exp.date)}
                        </p>
                      </div>
                      <p
                        className="text-sm font-bold tabular-nums flex-shrink-0"
                        style={{ color: theme.primary, letterSpacing: '-0.02em' }}
                      >
                        ₹{formatAmount(exp.amount)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>{/* end max-w content */}
      </div>{/* end scrollable body */}

      {/* ── FAB pinned at bottom — outside the scroll container so it never floats mid-screen ── */}
      <div
        className="flex-shrink-0 flex justify-center py-5"
        style={{ background: theme.pageBg }}
      >
        <button
          onClick={onAddExpense}
          className="active:scale-95 transition-transform flex items-center gap-2 px-5 py-3.5 font-semibold text-white rounded-full"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            boxShadow: `0 6px 28px rgba(${theme.shadowRgb}, 0.45)`,
            whiteSpace: 'nowrap',
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Delete confirmation sheet */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 flex items-end justify-center fade-in"
          style={{ background: 'rgba(0,0,0,0.52)', zIndex: 80 }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-[480px] rounded-t-2xl p-6 sheet-slide-up"
            style={{ background: theme.cardBg }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-base font-bold mb-1.5" style={{ color: theme.heading }}>
              Delete this trip?
            </p>
            <p className="text-sm mb-5" style={{ color: theme.textMuted }}>
              The trip record is removed. Expenses are not deleted — they remain in your history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: theme.surface, color: theme.heading }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); onDeleteTrip(trip.id) }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                style={{ background: '#ef4444' }}
              >
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit trip modal */}
      {editingTrip && (
        <CreateTripModal
          trip={editingTrip}
          onSave={updated => { onSaveTrip(updated); setEditingTrip(null) }}
          onClose={() => setEditingTrip(null)}
        />
      )}
    </div>
  )
}
