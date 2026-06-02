import { useMemo, useEffect, useState } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { monthYearLabel, dayMonthLabel } from '../utils/dateFormat'

const FIXED_KEYWORDS = ['rent', 'fixed', 'electricity', 'utility', 'utilities']
const MAX_BAR_H = 96

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

function barLabel(n) {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${Math.round(n / 1000)}k`
  return n > 0 ? `${n}` : ''
}

function getWeeklyData(monthExpenses, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = []
  for (let start = 1; start <= daysInMonth; start += 7) {
    const end = Math.min(start + 6, daysInMonth)
    const total = monthExpenses
      .filter(e => { const d = new Date(e.date).getDate(); return d >= start && d <= end })
      .reduce((s, e) => s + e.amount, 0)
    weeks.push({ label: `W${weeks.length + 1}`, total })
  }
  return weeks
}

function getWeekendData(monthExpenses, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekends = []
  let sat = null

  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month, d).getDay()
    if (dayOfWeek === 6) {
      sat = d
    } else if (dayOfWeek === 0) {
      if (sat !== null) { weekends.push([sat, d]); sat = null }
      else weekends.push([d])
    }
  }
  if (sat !== null) weekends.push([sat])

  return weekends.map((days, i) => {
    const total = monthExpenses
      .filter(e => days.includes(new Date(e.date).getDate()))
      .reduce((s, e) => s + e.amount, 0)
    return { label: `WE${i + 1}`, days, total }
  })
}

function BarChart({ items, maxVal, theme, isDark, animated, delayBase }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${MAX_BAR_H + 44}px` }}>
      {items.map((item, i) => {
        const pct = maxVal > 0 ? item.total / maxVal : 0
        const barH = animated ? Math.max(pct * MAX_BAR_H, item.total > 0 ? 6 : 0) : 0
        const isHighest = item.total === maxVal && item.total > 0
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px',
              height: '100%',
              justifyContent: 'flex-end',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: isHighest ? theme.primary : theme.textFaint,
                height: '14px',
                lineHeight: '14px',
                opacity: animated ? 1 : 0,
                transition: `opacity 0.3s ease ${delayBase + i * 80 + 200}ms`,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {item.total > 0 ? `₹${barLabel(item.total)}` : ''}
            </p>
            <div
              style={{
                width: '100%',
                height: `${barH}px`,
                background: isHighest
                  ? `linear-gradient(0deg, ${theme.primary}, ${theme.gradEnd})`
                  : isDark
                    ? `rgba(${theme.shadowRgb}, 0.38)`
                    : `rgba(${theme.shadowRgb}, 0.16)`,
                borderRadius: '6px 6px 3px 3px',
                transition: `height 0.55s cubic-bezier(0.34, 1.15, 0.64, 1) ${delayBase + i * 80}ms`,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isHighest ? theme.primary : theme.textMuted,
                lineHeight: '16px',
                flexShrink: 0,
              }}
            >
              {item.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function InsightsScreen({ expenses, categories, onClose, year: yearProp, month: monthProp }) {
  const { theme, isDark } = useTheme()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const now = new Date()
  const year  = yearProp  ?? now.getFullYear()
  const month = monthProp ?? now.getMonth()

  const data = useMemo(() => {
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    // Exclude fixed-cost categories from every section
    const catById = Object.fromEntries((categories ?? []).map(c => [c.id, c]))
    const spending = monthExpenses.filter(e => {
      const name = (catById[e.categoryId]?.name ?? e.category ?? '').toLowerCase()
      return !FIXED_KEYWORDS.some(k => name.includes(k))
    })
    const spendingTotal = spending.reduce((s, e) => s + e.amount, 0)

    const weeklyData = getWeeklyData(spending, year, month)
    const weekendData = getWeekendData(spending, year, month)
    const weekendTotal = weekendData.reduce((s, w) => s + w.total, 0)
    const weekendPct = spendingTotal > 0 ? (weekendTotal / spendingTotal) * 100 : 0

    const daysElapsed = now.getMonth() === month && now.getFullYear() === year
      ? now.getDate()
      : new Date(year, month + 1, 0).getDate()
    const avgDailySpend = daysElapsed > 0 ? Math.round(spendingTotal / daysElapsed) : 0

    const byDay = {}
    for (const e of spending) {
      const key = new Date(e.date).toDateString()
      byDay[key] = (byDay[key] || 0) + e.amount
    }
    const biggestDays = Object.entries(byDay)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ds, total]) => ({ date: new Date(ds), total }))

    const distinctMonths = new Set(expenses.map(e => {
      const d = new Date(e.date)
      return `${d.getFullYear()}-${d.getMonth()}`
    }))

    return {
      weeklyData,
      weekendData,
      weekendTotal,
      weekendPct,
      avgDailySpend,
      biggestDays,
      hasEnoughHistory: distinctMonths.size >= 2,
      monthTotal: spendingTotal,
    }
  }, [expenses, categories, year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxWeekly = Math.max(...data.weeklyData.map(w => w.total), 1)
  const maxWeekend = Math.max(...data.weekendData.map(w => w.total), 1)
  const maxDay = data.biggestDays.length > 0 ? data.biggestDays[0].total : 1
  const barBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'

  const card = {
    background: theme.cardBg,
    borderRadius: 'var(--r-card)',
    border: `1px solid rgba(${theme.shadowRgb}, 0.10)`,
    boxShadow: `0 2px 16px rgba(${theme.shadowRgb}, 0.07)`,
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto insights-enter"
      style={{ background: theme.pageBg, zIndex: 60 }}
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
          <div>
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
              Your Month
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: theme.textMuted }}>
              {monthYearLabel(new Date(year, month, 1))}
            </p>
          </div>
        </div>

        {/* ── Section 1: Weekly Rhythm ─────────────────────────────────────── */}
        <div className="mb-5">
          <p
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: theme.accent, letterSpacing: '0.11em' }}
          >
            Spending Rhythm
          </p>
          <p className="text-base font-bold mb-3" style={{ color: theme.heading, letterSpacing: '-0.02em' }}>
            Week by Week
          </p>
          <div className="p-5" style={card}>
            {data.monthTotal === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: theme.textFaint }}>
                No spending logged yet.
              </p>
            ) : (
              <BarChart
                items={data.weeklyData}
                maxVal={maxWeekly}
                theme={theme}
                isDark={isDark}
                animated={animated}
                delayBase={0}
              />
            )}
          </div>
        </div>

        {/* ── Section 2: Weekend Analysis ───────────────────────────────────── */}
        <div className="mb-5">
          <p
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: theme.accent, letterSpacing: '0.11em' }}
          >
            Weekend Damage
          </p>
          <p className="text-base font-bold mb-3" style={{ color: theme.heading, letterSpacing: '-0.02em' }}>
            Your Saturdays & Sundays
          </p>

          <div className="p-5 mb-3" style={card}>
            {data.weekendData.length === 0 || data.weekendTotal === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: theme.textFaint }}>
                No weekend spending this month.
              </p>
            ) : (
              <BarChart
                items={data.weekendData}
                maxVal={maxWeekend}
                theme={theme}
                isDark={isDark}
                animated={animated}
                delayBase={100}
              />
            )}
          </div>

          {data.weekendTotal > 0 && (
            <>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 p-4" style={card}>
                  <p className="text-xs font-medium mb-1.5" style={{ color: theme.textFaint }}>
                    Weekend total
                  </p>
                  <p
                    className="font-numeric font-bold"
                    style={{
                      color: theme.heading,
                      fontSize: '1.4rem',
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    ₹{formatAmount(data.weekendTotal)}
                  </p>
                </div>
                <div className="flex-1 p-4" style={card}>
                  <p className="text-xs font-medium mb-1.5" style={{ color: theme.textFaint }}>
                    Of total spend
                  </p>
                  <p
                    className="font-numeric font-bold"
                    style={{
                      color: theme.primary,
                      fontSize: '1.9rem',
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                    }}
                  >
                    {Math.round(data.weekendPct)}%
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium text-center px-2" style={{ color: theme.textMuted }}>
                {data.weekendPct >= 40
                  ? `You spent ${Math.round(data.weekendPct)}% of your money on weekends.`
                  : data.weekendPct >= 20
                    ? `${Math.round(data.weekendPct)}% of your spending happened on weekends.`
                    : `Weekends made up ${Math.round(data.weekendPct)}% of this month's total.`
                }
              </p>
            </>
          )}
        </div>

        {/* ── Section 3: Average Daily Spend ────────────────────────────────── */}
        <div className="mb-5">
          <p
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: theme.accent, letterSpacing: '0.11em' }}
          >
            Daily Average
          </p>
          <p className="text-base font-bold mb-3" style={{ color: theme.heading, letterSpacing: '-0.02em' }}>
            What Each Day Cost
          </p>
          <div className="p-5" style={card}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p
                  className="font-numeric font-bold"
                  style={{
                    color: theme.heading,
                    fontSize: '2.6rem',
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                  }}
                >
                  ₹{formatAmount(data.avgDailySpend)}
                </p>
                <p className="text-xs mt-2" style={{ color: theme.textFaint }}>
                  per day, this month
                </p>
              </div>
              <p
                className="text-xs text-right leading-relaxed flex-shrink-0"
                style={{ color: theme.textFaint, maxWidth: '110px' }}
              >
                rent & fixed costs excluded
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 4: Biggest Spending Days ─────────────────────────────── */}
        {data.biggestDays.length > 0 && (
          <div className="mb-5">
            <p
              className="text-xs font-semibold uppercase mb-1"
              style={{ color: theme.accent, letterSpacing: '0.11em' }}
            >
              Biggest Days
            </p>
            <p className="text-base font-bold mb-3" style={{ color: theme.heading, letterSpacing: '-0.02em' }}>
              Where the Month Peaked
            </p>
            <div className="p-5" style={card}>
              {data.biggestDays.map(({ date, total }, i) => (
                <div key={i}>
                  {i > 0 && (
                    <div className="my-3.5" style={{ height: '1px', background: theme.border }} />
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold text-center"
                        style={{ color: theme.textFaint, width: '14px' }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: theme.heading }}>
                        {dayMonthLabel(date)}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold font-numeric"
                      style={{ color: theme.primary, letterSpacing: '-0.02em' }}
                    >
                      ₹{formatAmount(total)}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: barBg, marginLeft: '26px' }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: animated ? `${(total / maxDay) * 100}%` : '0%',
                        background: `linear-gradient(90deg, ${theme.primary}, ${theme.gradEnd})`,
                        borderRadius: '9999px',
                        transition: `width 0.6s cubic-bezier(0.34, 1.15, 0.64, 1) ${i * 100 + 400}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section 5: Monthly Comparison — Coming Soon ───────────────────── */}
        <div className="mb-2">
          <p
            className="text-xs font-semibold uppercase mb-1"
            style={{ color: theme.accent, letterSpacing: '0.11em' }}
          >
            Monthly Comparison
          </p>
          <p className="text-base font-bold mb-3" style={{ color: theme.heading, letterSpacing: '-0.02em' }}>
            Month Over Month
          </p>
          <div
            className="p-6 flex flex-col items-center"
            style={{ ...card, opacity: 0.65 }}
          >
            <div
              className="w-11 h-11 flex items-center justify-center rounded-2xl mb-3"
              style={{ background: theme.surface }}
            >
              <Lock size={18} color={theme.textMuted} />
            </div>
            <p className="text-sm font-bold mb-1.5" style={{ color: theme.heading }}>
              Unlocks with more data
            </p>
            <p
              className="text-xs text-center leading-relaxed"
              style={{ color: theme.textFaint, maxWidth: '220px' }}
            >
              Monthly comparisons become available after tracking across multiple months. Keep logging.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
