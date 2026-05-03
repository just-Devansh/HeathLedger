import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

const TINTS = [
  { bg: '#fef3c7', border: '#f59e0b' },
  { bg: '#dbeafe', border: '#3b82f6' },
  { bg: '#dcfce7', border: '#22c55e' },
  { bg: '#fce7f3', border: '#ec4899' },
  { bg: '#ede9fe', border: '#8b5cf6' },
  { bg: '#ffedd5', border: '#f97316' },
  { bg: '#f0fdf4', border: '#16a34a' },
  { bg: '#fdf4ff', border: '#d946ef' },
]

function currentMonthLabel() {
  return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function formatAmount(n) {
  return n.toLocaleString('en-IN')
}

export default function SummaryScreen({ expenses, categories }) {
  const { theme } = useTheme()
  const emojiMap = Object.fromEntries((categories ?? []).map(c => [c.name, c.emoji]))

  const { total, breakdown } = useMemo(() => {
    const now = new Date()
    const monthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

    const byCategory = {}
    for (const exp of monthExpenses) {
      byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount
    }

    const breakdown = Object.entries(byCategory)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)

    return { total, breakdown }
  }, [expenses])

  const biggest = breakdown[0]

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-[100px]">
      <header className="pt-8 pb-4">
        <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>HeathLedger</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1" style={{ color: theme.heading }}>Firse Kharcha?</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{currentMonthLabel()}</p>
      </header>

      <div
        className="rounded-2xl p-6 mb-5 text-center"
        style={{
          background: theme.gradientBg,
          boxShadow: `0 8px 32px rgba(${theme.shadowRgb},0.45), 0 0 0 1px rgba(${theme.shadowRgb},0.08)`,
        }}
      >
        <p className="text-sm font-semibold mb-1 tracking-tight" style={{ color: theme.mutedText }}>
          This month's damage 💸
        </p>
        <p className="text-4xl font-extrabold tracking-tight" style={{ color: '#ffffff' }}>
          ₹{formatAmount(total)}
        </p>
        {biggest ? (
          <p className="text-xs mt-2 font-medium" style={{ color: theme.mutedText }}>
            Biggest damage: {biggest.name} ₹{formatAmount(biggest.amount)}
          </p>
        ) : (
          <p className="text-xs mt-2" style={{ color: theme.mutedText }}>
            {breakdown.length} {breakdown.length === 1 ? 'category' : 'categories'}
          </p>
        )}
      </div>

      {breakdown.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#94a3b8' }}>
          <p className="text-5xl mb-3">😇</p>
          <p className="text-sm">No damage yet.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold mb-3 tracking-tight" style={{ color: theme.heading }}>
            Where it all went 👇
          </p>
          <div className="flex flex-col gap-3">
            {breakdown.map(({ name, amount, percentage }, i) => {
              const tint = TINTS[i % TINTS.length]
              return (
                <div
                  key={name}
                  className="p-4 rounded-2xl"
                  style={{
                    background: tint.bg,
                    borderLeft: `3px solid ${tint.border}`,
                    boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.07)`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-lg w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.7)' }}
                      >
                        {emojiMap[name] ?? '📦'}
                      </span>
                      <div>
                        <p className="text-sm font-bold tracking-tight leading-tight" style={{ color: theme.heading }}>{name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="text-base font-bold tracking-tight" style={{ color: tint.border }}>
                      ₹{formatAmount(amount)}
                    </p>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        background: tint.border,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
