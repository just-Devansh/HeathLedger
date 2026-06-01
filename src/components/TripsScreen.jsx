import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowLeft, Plus, MapPin } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import CreateTripModal from './CreateTripModal'
import TripDetailScreen from './TripDetailScreen'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

function formatDateRange(startDate, endDate) {
  const s = new Date(startDate)
  const e = new Date(endDate)
  const start = `${s.getDate()} ${MONTHS_SHORT[s.getMonth()]}`
  const end   = `${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}${e.getFullYear() !== s.getFullYear() ? ' ' + e.getFullYear() : ''}`
  return `${start} – ${end}`
}

// Pick a deterministic placeholder emoji based on the trip title.
function getPlaceholder(title) {
  const t = title.toLowerCase()
  if (/beach|goa|sea|coast|maldive/.test(t))      return '🏖️'
  if (/manali|mountain|hill|trek|ladakh|spiti/.test(t)) return '🏔️'
  if (/forest|camp|nature|jungle/.test(t))         return '🌲'
  if (/dubai|paris|london|europe|abroad/.test(t))  return '🌍'
  if (/temple|pilgrimage|varanasi|tirupati/.test(t)) return '🛕'
  if (/road.?trip|drive/.test(t))                  return '🚗'
  const chars = '✈️🏕️🌄🗺️🧳🌅'
  const idx = title.charCodeAt(0) % chars.replace(/️/g, '').length
  return [...chars][idx] ?? '✈️'
}

export default function TripsScreen({
  trips, expenses, categories,
  onSaveTrip, onDeleteTrip,
  onAddExpenseToTrip,
  onClose, onPushOverlay, onSyncBack,
  onRegisterBackHandler,
}) {
  const { theme } = useTheme()
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const histDepth      = useRef(0)
  const isUIBack       = useRef(false)
  const selectedRef    = useRef(null)
  useEffect(() => { selectedRef.current = selectedTrip }, [selectedTrip])

  // Register the back handler so App.jsx can delegate popstate to us.
  useEffect(() => {
    if (!onRegisterBackHandler) return
    onRegisterBackHandler(() => {
      if (isUIBack.current) {
        isUIBack.current = false
        return
      }
      if (selectedRef.current) {
        setSelectedTrip(null)
        if (histDepth.current > 0) histDepth.current--
        return
      }
      onClose()
    })
  }, [onRegisterBackHandler, onClose])

  function openTrip(trip) {
    setSelectedTrip(trip)
    histDepth.current++
    onPushOverlay?.()
  }

  function closeTrip() {
    setSelectedTrip(null)
    isUIBack.current = true
    if (histDepth.current > 0) histDepth.current--
    onSyncBack?.()
  }

  // Per-trip total and count derived from expenses.
  const tripStats = useMemo(() => {
    const map = {}
    for (const exp of expenses) {
      if (!exp.tripId) continue
      if (!map[exp.tripId]) map[exp.tripId] = { total: 0, count: 0 }
      map[exp.tripId].total += exp.amount
      map[exp.tripId].count++
    }
    return map
  }, [expenses])

  if (selectedTrip) {
    const current = trips.find(t => t.id === selectedTrip.id) ?? selectedTrip
    return (
      <TripDetailScreen
        trip={current}
        expenses={expenses}
        categories={categories}
        onClose={closeTrip}
        onSaveTrip={onSaveTrip}
        onDeleteTrip={id => { onDeleteTrip(id); closeTrip() }}
        onAddExpense={() => onAddExpenseToTrip(current.id)}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto insights-enter"
      style={{ background: theme.pageBg, zIndex: 56 }}
    >
      <div className="max-w-[480px] mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-8 pb-6 flex items-start gap-4">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform mt-1 flex-shrink-0"
            style={{ background: theme.surface, color: theme.heading }}
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold uppercase"
              style={{ color: theme.accent, letterSpacing: '0.13em' }}
            >
              Heath Ledger ✦
            </p>
            <h1
              className="font-display mt-1.5"
              style={{
                color: theme.heading,
                fontSize: '2.2rem',
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: '-0.035em',
              }}
            >
              Your Trips
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold active:scale-95 transition-transform flex-shrink-0"
            style={{
              borderRadius: 'var(--r-element)',
              background: theme.primary,
              color: '#ffffff',
              boxShadow: `0 4px 14px rgba(${theme.shadowRgb},0.35)`,
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </div>

        {/* Empty state */}
        {trips.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p
              className="font-devanagari font-black mb-4"
              style={{ color: theme.textFaint, fontSize: '4rem', lineHeight: 1 }}
            >
              शून्य
            </p>
            <p className="text-sm font-semibold mb-1.5" style={{ color: theme.heading }}>
              No trips yet
            </p>
            <p className="text-xs leading-relaxed" style={{ color: theme.textFaint, maxWidth: '220px' }}>
              Create your first trip to track its spending separately from your everyday expenses.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold active:scale-95 transition-transform text-white rounded-full"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                boxShadow: `0 4px 16px rgba(${theme.shadowRgb},0.35)`,
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Create a trip
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {trips.map(trip => {
              const stats   = tripStats[trip.id] ?? { total: 0, count: 0 }
              const emoji   = getPlaceholder(trip.title)
              const hasCover = !!trip.coverImage
              return (
                <button
                  key={trip.id}
                  onClick={() => openTrip(trip)}
                  className="w-full text-left rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
                  style={{
                    background: theme.cardBg,
                    border: `1.5px solid rgba(${theme.shadowRgb}, 0.14)`,
                    boxShadow: `0 4px 20px rgba(${theme.shadowRgb}, 0.10)`,
                  }}
                >
                  {/* Cover */}
                  {hasCover ? (
                    <div style={{ height: '148px', overflow: 'hidden' }}>
                      <img
                        src={trip.coverImage}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: '88px',
                        background: `linear-gradient(135deg, rgba(${theme.shadowRgb},0.07) 0%, rgba(${theme.shadowRgb},0.03) 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.6rem',
                        userSelect: 'none',
                        borderBottom: `1px solid rgba(${theme.shadowRgb},0.07)`,
                      }}
                    >
                      {emoji}
                    </div>
                  )}

                  {/* Card body */}
                  <div className="px-4 py-4">
                    <p
                      className="font-bold leading-tight tracking-tight mb-1.5"
                      style={{ color: theme.heading, fontSize: '1.05rem', letterSpacing: '-0.025em' }}
                    >
                      {trip.title.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-1 mb-3">
                      {trip.destination && (
                        <>
                          <MapPin size={11} color={theme.textFaint} />
                          <p className="text-xs" style={{ color: theme.textFaint }}>
                            {trip.destination}&nbsp;·&nbsp;
                          </p>
                        </>
                      )}
                      <p className="text-xs" style={{ color: theme.textFaint }}>
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </p>
                    </div>
                    <div
                      style={{ height: '1px', background: `rgba(${theme.shadowRgb},0.08)`, marginBottom: '12px' }}
                    />
                    <div className="flex items-center justify-between">
                      <p
                        className="font-numeric font-bold"
                        style={{ color: theme.primary, fontSize: '1.3rem', letterSpacing: '-0.03em' }}
                      >
                        ₹{formatAmount(stats.total)}
                      </p>
                      <p className="text-xs font-medium" style={{ color: theme.textFaint }}>
                        {stats.count} {stats.count === 1 ? 'expense' : 'expenses'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTripModal
          trip={null}
          onSave={trip => { onSaveTrip(trip); setShowCreateModal(false) }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
