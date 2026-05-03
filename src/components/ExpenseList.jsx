import { useMemo, useState } from 'react'
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

export default function ExpenseList({ expenses, categories, onEdit, onDelete }) {
  const { theme } = useTheme()
  const emojiMap = Object.fromEntries((categories ?? []).map(c => [c.name, c.emoji]))
  const groups = useMemo(() => groupByDate(expenses), [expenses])
  const [openMenuId, setOpenMenuId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function handleConfirmDelete(id) {
    onDelete(id)
    setConfirmDeleteId(null)
  }

  function closeAll() {
    setOpenMenuId(null)
    setConfirmDeleteId(null)
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-24" style={{ color: '#94a3b8' }}>
        <p className="text-5xl mb-3">😇</p>
        <p className="text-sm">No damage yet. Tap + to add one.</p>
      </div>
    )
  }

  const hasOverlay = openMenuId !== null || confirmDeleteId !== null

  return (
    <div className="flex flex-col">

      {hasOverlay && (
        <div className="fixed inset-0" style={{ zIndex: 10 }} onClick={closeAll} />
      )}

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
            {group.items.map(exp => {
              const isMenuOpen = openMenuId === exp.id
              const isConfirming = confirmDeleteId === exp.id
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{
                    background: '#ffffff',
                    boxShadow: `0 2px 12px rgba(${theme.shadowRgb},0.10)`,
                    position: 'relative',
                    zIndex: isMenuOpen || isConfirming ? 11 : 'auto',
                  }}
                >
                  {/* Left: emoji + category name + note */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xl w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ background: theme.surface }}
                    >
                      {emojiMap[exp.category] ?? '📦'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: theme.heading }}>
                        {exp.category}
                      </p>
                      {exp.note && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{exp.note}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + three-dots or confirmation */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <p className="text-base font-bold" style={{ color: theme.primary }}>
                      ₹{exp.amount}
                    </p>

                    {isConfirming ? (
                      <div className="confirm-popup flex gap-1.5">
                        <button
                          onClick={() => handleConfirmDelete(exp.id)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl font-bold"
                          style={{ background: '#22c55e', color: '#ffffff', fontSize: '16px' }}
                          aria-label="Confirm delete"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="action-btn w-8 h-8 flex items-center justify-center rounded-xl font-bold"
                          style={{ background: '#ef4444', color: '#ffffff', fontSize: '16px' }}
                          aria-label="Cancel delete"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setOpenMenuId(isMenuOpen ? null : exp.id)}
                          className="dots-btn w-8 h-8 flex items-center justify-center rounded-xl text-lg leading-none"
                          style={{
                            color: '#94a3b8',
                            background: isMenuOpen ? '#f1f5f9' : 'transparent',
                          }}
                          aria-label="More options"
                        >
                          ⋮
                        </button>

                        {isMenuOpen && (
                          <div
                            className="absolute right-0 rounded-2xl overflow-hidden"
                            style={{
                              top: 'calc(100% + 6px)',
                              background: '#ffffff',
                              boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
                              zIndex: 20,
                              minWidth: '130px',
                            }}
                          >
                            <button
                              onClick={() => { onEdit(exp); setOpenMenuId(null) }}
                              className="expense-menu-item w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium"
                              style={{ color: '#0f172a' }}
                            >
                              <span>✏️</span> Edit
                            </button>
                            <div style={{ height: '1px', background: '#f1f5f9' }} />
                            <button
                              onClick={() => { setConfirmDeleteId(exp.id); setOpenMenuId(null) }}
                              className="expense-menu-item danger w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium"
                              style={{ color: '#ef4444' }}
                            >
                              <span>🗑️</span> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
