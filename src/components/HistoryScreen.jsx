import { useState, useMemo, useEffect, useRef } from 'react'
import { ArrowLeft, ChevronRight, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import ExpenseList from './ExpenseList'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

function EmptyState({ label }) {
  const { theme } = useTheme()
  return (
    <div className="flex flex-col items-center justify-center py-24 empty-state-in">
      <p
        className="font-devanagari font-black"
        style={{ color: theme.textFaint, fontSize: '4rem', lineHeight: 1 }}
      >
        शून्य
      </p>
      <p
        className="mt-3 text-xs tracking-[0.22em] uppercase"
        style={{ color: theme.textFaint, opacity: 0.45 }}
      >
        {label}
      </p>
    </div>
  )
}

export default function HistoryScreen({ expenses, categories, onClose, onClosedByUI, onEdit, onDelete, onRegisterBackHandler }) {
  const { theme } = useTheme()
  const [view, setView] = useState('years')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [slideDir, setSlideDir] = useState('forward')

  // Tracks how many history entries this component pushed (for internal nav).
  const histDepth = useRef(0)
  // isUIBack prevents the popstate handler from double-firing when the UI
  // back button calls history.back() to sync the browser stack.
  const isUIBack = useRef(false)
  // Keep view and onClose accessible in the popstate handler without stale closures.
  const viewRef = useRef('years')
  const onCloseRef = useRef(onClose)
  useEffect(() => { viewRef.current = view }, [view])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  // Register our back handler with App.jsx so the centralized popstate
  // delegates to us while the history tab is active.
  // Reads all state via refs to avoid stale closures (handler is set once).
  useEffect(() => {
    if (!onRegisterBackHandler) return
    onRegisterBackHandler(() => {
      // When the UI back button calls history.back() it sets isUIBack=true so
      // we skip here — the internal state was already updated by goBack().
      if (isUIBack.current) {
        isUIBack.current = false
        return
      }
      const v = viewRef.current
      if (v !== 'years') {
        setSlideDir('back')
        if (v === 'expenses') {
          setView('months')
          setSelectedMonth(null)
        } else {
          setView('years')
          setSelectedYear(null)
        }
        if (histDepth.current > 0) histDepth.current--
        return
      }
      // At the top level — close history tab.
      onCloseRef.current()
    })
    return () => onRegisterBackHandler(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterBackHandler])

  const yearGroups = useMemo(() => {
    const map = {}
    for (const exp of expenses) {
      const year = new Date(exp.date).getFullYear()
      if (!map[year]) map[year] = 0
      map[year] += exp.amount
    }
    return Object.entries(map)
      .map(([year, total]) => ({ year: Number(year), total }))
      .sort((a, b) => b.year - a.year)
  }, [expenses])

  const monthGroups = useMemo(() => {
    if (!selectedYear) return []
    const map = {}
    for (const exp of expenses) {
      const d = new Date(exp.date)
      if (d.getFullYear() !== selectedYear) continue
      const m = d.getMonth()
      if (!map[m]) map[m] = { total: 0, count: 0 }
      map[m].total += exp.amount
      map[m].count++
    }
    return Object.entries(map)
      .map(([m, data]) => ({ month: Number(m), ...data }))
      .sort((a, b) => b.month - a.month)
  }, [expenses, selectedYear])

  const monthExpenses = useMemo(() => {
    if (selectedYear == null || selectedMonth == null) return []
    return expenses
      .filter(exp => {
        const d = new Date(exp.date)
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, selectedYear, selectedMonth])

  function goToYear(year) {
    setSlideDir('forward')
    setSelectedYear(year)
    setView('months')
    histDepth.current++
    history.pushState({ heathLedger: 'historyView', depth: histDepth.current }, '')
  }

  function goToMonth(month) {
    setSlideDir('forward')
    setSelectedMonth(month)
    setView('expenses')
    histDepth.current++
    history.pushState({ heathLedger: 'historyView', depth: histDepth.current }, '')
  }

  function goBack() {
    setSlideDir('back')
    if (view === 'expenses') {
      setView('months')
      setSelectedMonth(null)
    } else {
      setView('years')
      setSelectedYear(null)
    }
    // Sync browser stack when the UI back button triggers this (not hardware back).
    if (histDepth.current > 0) {
      histDepth.current--
      isUIBack.current = true
      history.back()
    }
  }

  const animClass = slideDir === 'forward' ? 'history-slide-right' : 'history-slide-left'

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: theme.pageBg, zIndex: 50 }}
    >
      <div className="max-w-[480px] mx-auto px-4 pb-10">

        {/* Header */}
        <header className="pt-8 pb-4">
          {view === 'years' ? (
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-xs font-semibold uppercase"
                  style={{ color: theme.accent, letterSpacing: '0.13em' }}
                >
                  Heath Ledger ✦
                </p>
                <h1
                  className="font-display mt-2"
                  style={{
                    color: theme.heading,
                    fontSize: '2.35rem',
                    fontWeight: 800,
                    lineHeight: 1.0,
                    letterSpacing: '-0.035em',
                  }}
                >
                  History
                </h1>
                <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
                  Your financial memory
                </p>
              </div>
              <button
                onClick={onClosedByUI ?? onClose}
                className="btn-settings w-9 h-9 flex items-center justify-center rounded-full mt-1"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.secondary,
                }}
                aria-label="Close history"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="btn-settings w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.secondary,
                }}
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold uppercase"
                  style={{ color: theme.accent, letterSpacing: '0.13em' }}
                >
                  {view === 'months' ? 'History' : selectedYear}
                </p>
                <h1
                  className="font-display"
                  style={{
                    color: theme.heading,
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    lineHeight: 1.0,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {view === 'months' ? selectedYear : MONTHS[selectedMonth]}
                </h1>
              </div>
            </div>
          )}
        </header>

        {/* Animated content panel — key forces remount on each navigation step */}
        <div
          key={`${view}-${selectedYear}-${selectedMonth}`}
          className={animClass}
        >
          {view === 'years' && (
            yearGroups.length === 0
              ? <EmptyState label="no history yet" />
              : (
                <div className="flex flex-col gap-3">
                  {yearGroups.map(({ year, total }) => (
                    <button
                      key={year}
                      onClick={() => goToYear(year)}
                      className="w-full text-left p-5 rounded-2xl active:scale-[0.98]"
                      style={{
                        background: theme.cardBg,
                        boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.09)`,
                        border: `1px solid ${theme.border}`,
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="font-numeric"
                            style={{ color: theme.heading, fontSize: '2.4rem', fontWeight: 700, lineHeight: 1 }}
                          >
                            {year}
                          </p>
                          <p
                            className="font-numeric text-sm mt-2"
                            style={{ color: theme.textMuted, fontSize: '0.875rem', fontWeight: 500 }}
                          >
                            ₹{formatAmount(total)} spent
                          </p>
                        </div>
                        <div
                          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0"
                          style={{ background: theme.surface }}
                        >
                          <ChevronRight size={18} color={theme.primary} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
          )}

          {view === 'months' && (
            monthGroups.length === 0
              ? <EmptyState label="no expenses this year" />
              : (
                <div className="flex flex-col gap-3">
                  {monthGroups.map(({ month, total, count }) => (
                    <button
                      key={month}
                      onClick={() => goToMonth(month)}
                      className="w-full text-left p-4 rounded-2xl active:scale-[0.98]"
                      style={{
                        background: theme.cardBg,
                        boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.08)`,
                        border: `1px solid ${theme.border}`,
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="text-lg font-bold tracking-tight"
                            style={{ color: theme.heading }}
                          >
                            {MONTHS[month]}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: theme.textMuted }}
                          >
                            {count} {count === 1 ? 'expense' : 'expenses'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <p className="text-base font-bold" style={{ color: theme.primary }}>
                            ₹{formatAmount(total)}
                          </p>
                          <div
                            className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ background: theme.surface }}
                          >
                            <ChevronRight size={16} color={theme.primary} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
          )}

          {view === 'expenses' && (
            monthExpenses.length === 0
              ? <EmptyState label="no expenses this month" />
              : (
                <ExpenseList
                  expenses={monthExpenses}
                  categories={categories}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )
          )}
        </div>

      </div>
    </div>
  )
}
