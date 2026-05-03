import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

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

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-28">
      <header className="pt-8 pb-4">
        <p className="text-xs font-medium tracking-wide" style={{ color: theme.accent }}>HeathLedger</p>
        <h1 className="text-2xl font-bold mt-1" style={{ color: theme.heading }}>Firse Kharcha?</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{currentMonthLabel()}</p>
      </header>

      <div
        className="rounded-2xl p-6 mb-5 text-center"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          boxShadow: `0 4px 20px rgba(${theme.shadowRgb},0.35)`,
        }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: theme.mutedText }}>Total this month</p>
        <p className="text-4xl font-bold" style={{ color: '#ffffff' }}>
          ₹{formatAmount(total)}
        </p>
        <p className="text-xs mt-2" style={{ color: theme.mutedText }}>
          {breakdown.length} {breakdown.length === 1 ? 'category' : 'categories'}
        </p>
      </div>

      {breakdown.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#94a3b8' }}>
          <p className="text-5xl mb-3">📊</p>
          <p className="text-sm">No expenses this month yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {breakdown.map(({ name, amount, percentage }) => (
            <div
              key={name}
              className="p-4 rounded-2xl"
              style={{ background: '#ffffff', boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.10)` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: theme.surface }}
                  >
                    {emojiMap[name] ?? '📦'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight" style={{ color: theme.heading }}>{name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <p className="text-base font-bold" style={{ color: theme.primary }}>
                  ₹{formatAmount(amount)}
                </p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: theme.surface }}>
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
      )}
    </div>
  )
}
