import { useState, useMemo } from 'react'
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

export default function HistoryScreen({ expenses, categories, onClose, onEdit, onDelete }) {
  const { theme } = useTheme()
  const [view, setView] = useState('years')
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [slideDir, setSlideDir] = useState('forward')

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
  }

  function goToMonth(month) {
    setSlideDir('forward')
    setSelectedMonth(month)
    setView('expenses')
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
                  className="font-display font-bold mt-2"
                  style={{
                    color: theme.heading,
                    fontSize: '2.25rem',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  History
                </h1>
                <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
                  Your financial memory
                </p>
              </div>
              <button
                onClick={onClose}
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
                  className="font-display font-bold"
                  style={{
                    color: theme.heading,
                    fontSize: '1.75rem',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
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
                            className="font-display font-extrabold tracking-tight"
                            style={{ color: theme.heading, fontSize: '2.25rem', lineHeight: 1 }}
                          >
                            {year}
                          </p>
                          <p
                            className="text-sm font-medium mt-2"
                            style={{ color: theme.textMuted }}
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
