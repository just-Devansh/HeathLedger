import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

function getDayLabel(isoDate) {
  const d = new Date(isoDate)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(todayStart.getDate() - 1)
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dayStart.getTime() === todayStart.getTime()) return 'Today'
  if (dayStart.getTime() === yesterdayStart.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function groupByDate(expenses) {
  const groups = []
  let lastKey = null
  for (const exp of expenses) {
    const d = new Date(exp.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (key !== lastKey) {
      groups.push({ key, label: getDayLabel(exp.date), items: [exp] })
      lastKey = key
    } else {
      groups[groups.length - 1].items.push(exp)
    }
  }
  return groups
}

export default function ExpenseList({ expenses, categories }) {
  const { theme } = useTheme()
  const emojiMap = Object.fromEntries((categories ?? []).map(c => [c.name, c.emoji]))
  const groups = useMemo(() => groupByDate(expenses), [expenses])

  if (expenses.length === 0) {
    return (
      <div className="text-center py-24" style={{ color: '#94a3b8' }}>
        <p className="text-5xl mb-3">😇</p>
        <p className="text-sm">No damage yet. Tap + to add one.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {groups.map((group, groupIdx) => (
        <div key={group.key}>
          {groupIdx > 0 && (
            <div style={{ height: '1px', background: '#e2e8f0', margin: '12px 0' }} />
          )}
          <p
            className="text-xs font-medium"
            style={{ color: '#64748b', margin: '16px 8px 8px' }}
          >
            {group.label}
          </p>
          <div className="flex flex-col gap-3">
            {group.items.map(exp => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{
                  background: '#ffffff',
                  boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.10)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-xl w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{ background: theme.surface }}
                  >
                    {emojiMap[exp.category] ?? '📦'}
                  </span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: theme.heading }}>
                      {exp.category}
                    </p>
                    {exp.note && (
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{exp.note}</p>
                    )}
                  </div>
                </div>
                <p className="text-base font-bold ml-4" style={{ color: theme.primary }}>
                  ₹{exp.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
